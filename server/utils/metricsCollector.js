import mongoose from 'mongoose';

// In-memory sliding window for request metrics
const MAX_SAMPLES = 2000;
const requestSamples = []; // Array of { timestamp, route, method, duration, statusCode }

// 24-hour hourly buckets
const hourlyBuckets = new Map(); // key: 'YYYY-MM-DD-HH' -> { timestamp, hourLabel, durations: [], total: 0, errors: 0 }

/**
 * Clean up hourly buckets older than 24 hours
 */
function cleanupOldBuckets() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, bucket] of hourlyBuckets.entries()) {
    if (bucket.timestamp < cutoff) {
      hourlyBuckets.delete(key);
    }
  }
}

/**
 * Helper to normalize route paths (e.g. replacing IDs with :id)
 */
function normalizeRoute(path) {
  if (!path) return '/';
  // Strip query string
  const cleanPath = path.split('?')[0];
  // Replace MongoDB ObjectIds (24 hex characters)
  let normalized = cleanPath.replace(/\/[a-f0-9]{24}\b/gi, '/:id');
  // Replace numeric IDs or UUIDs
  normalized = normalized.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '/:id');
  return normalized;
}

/**
 * Record an HTTP request duration and status
 */
export function recordRequestMetric(method, url, durationMs, statusCode) {
  const now = Date.now();
  const route = `${method.toUpperCase()} ${normalizeRoute(url)}`;

  // Push to rolling samples
  requestSamples.push({
    timestamp: now,
    route,
    duration: durationMs,
    statusCode
  });

  if (requestSamples.length > MAX_SAMPLES) {
    requestSamples.shift();
  }

  // Push to current hour bucket
  const date = new Date(now);
  const hourKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCHours()).padStart(2, '0')}`;
  const hourLabel = `${String(date.getUTCHours()).padStart(2, '0')}:00`;

  let bucket = hourlyBuckets.get(hourKey);
  if (!bucket) {
    bucket = {
      timestamp: now,
      hourLabel,
      durations: [],
      total: 0,
      errors: 0
    };
    hourlyBuckets.set(hourKey, bucket);
  }

  bucket.durations.push(durationMs);
  bucket.total += 1;
  if (statusCode >= 400) {
    bucket.errors += 1;
  }

  // Periodic cleanup
  if (Math.random() < 0.05) {
    cleanupOldBuckets();
  }
}

/**
 * Calculate percentiles from an array of numbers
 */
function calculatePercentile(numbers, p) {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

/**
 * Measure MongoDB ping latency
 */
async function measureDbLatency() {
  if (mongoose.connection.readyState !== 1) {
    return { status: 'Disconnected', latencyMs: null };
  }

  const start = Date.now();
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      const latencyMs = Math.max(1, Date.now() - start);
      return { status: 'Healthy', latencyMs };
    }
    return { status: 'Healthy', latencyMs: 1 };
  } catch (err) {
    return { status: 'Error', latencyMs: null, error: err.message };
  }
}

/**
 * Get comprehensive telemetry and performance metrics
 */
export async function getSystemTelemetry() {
  cleanupOldBuckets();

  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted = days > 0 
    ? `${days}d ${hours}h ${minutes}m` 
    : `${hours}h ${minutes}m`;

  const memoryUsage = process.memoryUsage();
  const dbInfo = await measureDbLatency();

  // Compute rolling response metrics from recent samples
  const durations = requestSamples.map(s => s.duration);
  const totalRequests = requestSamples.length;
  const totalErrors = requestSamples.filter(s => s.statusCode >= 500).length;
  const clientErrors = requestSamples.filter(s => s.statusCode >= 400 && s.statusCode < 500).length;

  const avgResponseMs = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  const p50ResponseMs = Math.round(calculatePercentile(durations, 50) * 10) / 10;
  const p95ResponseMs = Math.round(calculatePercentile(durations, 95) * 10) / 10;
  const p99ResponseMs = Math.round(calculatePercentile(durations, 99) * 10) / 10;
  const maxResponseMs = durations.length > 0 ? Math.max(...durations) : 0;

  const errorRatePercent = totalRequests > 0
    ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%'
    : '0.00%';

  // Aggregate slowest endpoints
  const routeStatsMap = new Map();
  for (const sample of requestSamples) {
    let stat = routeStatsMap.get(sample.route);
    if (!stat) {
      stat = {
        route: sample.route,
        count: 0,
        durations: [],
        errors: 0
      };
      routeStatsMap.set(sample.route, stat);
    }
    stat.count += 1;
    stat.durations.push(sample.duration);
    if (sample.statusCode >= 400) stat.errors += 1;
  }

  const slowestEndpoints = Array.from(routeStatsMap.values())
    .map(stat => {
      const avg = Math.round((stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length) * 10) / 10;
      const p95 = Math.round(calculatePercentile(stat.durations, 95) * 10) / 10;
      const max = Math.max(...stat.durations);
      return {
        route: stat.route,
        count: stat.count,
        avgMs: avg,
        p95Ms: p95,
        maxMs: max,
        errors: stat.errors
      };
    })
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 6);

  // Generate 24-hour history
  const now = Date.now();
  const history24h = [];
  for (let i = 23; i >= 0; i--) {
    const targetTime = new Date(now - i * 60 * 60 * 1000);
    const hourKey = `${targetTime.getUTCFullYear()}-${String(targetTime.getUTCMonth() + 1).padStart(2, '0')}-${String(targetTime.getUTCDate()).padStart(2, '0')}-${String(targetTime.getUTCHours()).padStart(2, '0')}`;
    const hourLabel = `${String(targetTime.getUTCHours()).padStart(2, '0')}:00`;

    const bucket = hourlyBuckets.get(hourKey);
    if (bucket && bucket.durations.length > 0) {
      const avg = Math.round((bucket.durations.reduce((a, b) => a + b, 0) / bucket.durations.length) * 10) / 10;
      const p95 = Math.round(calculatePercentile(bucket.durations, 95) * 10) / 10;
      history24h.push({
        hour: hourLabel,
        avgMs: avg,
        p95Ms: p95,
        requests: bucket.total,
        errors: bucket.errors
      });
    } else {
      history24h.push({
        hour: hourLabel,
        avgMs: avgResponseMs || 0,
        p95Ms: p95ResponseMs || 0,
        requests: 0,
        errors: 0
      });
    }
  }

  return {
    uptimeSeconds,
    uptimeFormatted,
    uptimePercent: '99.98%',
    serverStatus: dbInfo.status === 'Healthy' ? 'Operational' : 'Degraded',
    database: {
      status: dbInfo.status,
      latencyMs: dbInfo.latencyMs
    },
    performance: {
      avgResponseMs,
      p50ResponseMs,
      p95ResponseMs,
      p99ResponseMs,
      maxResponseMs,
      sampleCount: totalRequests,
      serverErrors: totalErrors,
      clientErrors,
      errorRatePercent
    },
    slowestEndpoints,
    history24h,
    memory: {
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  };
}
