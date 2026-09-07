import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Changelog from '../models/Changelog.js';
import User from '../models/User.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_CHANGELOG_PATH = path.resolve(__dirname, '../../src/data/changelog.json');

const router = express.Router();

/**
 * Helper to check if the current user is an administrator
 */
async function requireAdmin(req, res) {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const user = await User.findById(req.userId).select('username isAdmin').lean();
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: 'Unauthorized. Administrator privileges required.' });
    return null;
  }
  return user;
}

/**
 * Ensure historical entries from changelog.json are seeded into the database on first run
 */
async function ensureHistoricalSeeded() {
  try {
    const count = await Changelog.countDocuments();
    if (count > 0) return;

    if (fs.existsSync(JSON_CHANGELOG_PATH)) {
      const raw = fs.readFileSync(JSON_CHANGELOG_PATH, 'utf-8');
      const entries = JSON.parse(raw);

      if (Array.isArray(entries) && entries.length > 0) {
        console.log(`[Changelog] Seeding ${entries.length} historical releases from changelog.json into MongoDB...`);

        const docsToInsert = entries.map(entry => {
          let sections = [];
          if (Array.isArray(entry.sections) && entry.sections.length > 0) {
            entry.sections.forEach(s => {
              if (s.items && s.items.length > 0) {
                sections.push({ type: s.type, items: s.items });
              }
            });
          } else {
            if (Array.isArray(entry.features) && entry.features.length > 0) {
              sections.push({ type: 'feature', items: entry.features });
            }
            if (Array.isArray(entry.changes) && entry.changes.length > 0) {
              sections.push({ type: 'improvement', items: entry.changes });
            }
            if (Array.isArray(entry.fixes) && entry.fixes.length > 0) {
              sections.push({ type: 'fix', items: entry.fixes });
            }
          }

          let releaseDate = new Date();
          if (entry.date) {
            const parsed = new Date(entry.date);
            if (!isNaN(parsed.getTime())) releaseDate = parsed;
          }

          return {
            version: entry.version || 'v1.0.0',
            releaseDate,
            published: true,
            title: entry.title || '',
            description: entry.description || '',
            sections,
            createdBy: 'System'
          };
        });

        await Changelog.insertMany(docsToInsert);
        console.log(`[Changelog] Successfully seeded ${docsToInsert.length} releases.`);
      }
    }
  } catch (err) {
    console.error('[Changelog] Failed to seed historical releases:', err);
  }
}

const CHANGELOG_SECTION_ORDER = {
  feature: 1,
  improvement: 2,
  fix: 3,
  removed: 4,
  security: 5
};

function sanitizeAndPrioritizeSections(sections) {
  if (!Array.isArray(sections)) return [];

  // Group items by section type to enforce at most 1 of each section
  const typeMap = new Map();

  sections.forEach(sec => {
    if (!sec) return;
    const rawType = String(sec.type || 'feature').toLowerCase();
    const type = ['feature', 'improvement', 'fix', 'removed', 'security'].includes(rawType)
      ? rawType
      : 'feature';

    const items = (Array.isArray(sec.items) ? sec.items : [])
      .map(item => String(item || '').trim())
      .filter(Boolean);

    if (items.length > 0) {
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type).push(...items);
    }
  });

  return Array.from(typeMap.entries())
    .map(([type, items]) => ({ type, items }))
    .sort((a, b) => (CHANGELOG_SECTION_ORDER[a.type] || 99) - (CHANGELOG_SECTION_ORDER[b.type] || 99));
}

/**
 * Format a changelog document for consistent public and admin responses
 */
function formatChangelogDoc(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  const releaseDateObj = d.releaseDate ? new Date(d.releaseDate) : new Date(d.createdAt || Date.now());
  const year = releaseDateObj.getFullYear();
  const month = String(releaseDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(releaseDateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const sortedSections = [...(d.sections || [])].sort(
    (a, b) => (CHANGELOG_SECTION_ORDER[a?.type] || 99) - (CHANGELOG_SECTION_ORDER[b?.type] || 99)
  );

  // Build backward-compatible arrays
  const features = [];
  const changes = [];
  const fixes = [];

  sortedSections.forEach(sec => {
    if (sec.type === 'feature') features.push(...(sec.items || []));
    else if (sec.type === 'improvement' || sec.type === 'removed' || sec.type === 'security') changes.push(...(sec.items || []));
    else if (sec.type === 'fix') fixes.push(...(sec.items || []));
  });

  return {
    _id: String(d._id),
    version: d.version,
    releaseDate: releaseDateObj.toISOString(),
    date: dateStr,
    published: Boolean(d.published),
    title: d.title || '',
    description: d.description || '',
    sections: sortedSections,
    features,
    changes,
    fixes,
    createdBy: d.createdBy || 'Admin',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

/* ============================================================
   PUBLIC ENDPOINTS
   ============================================================ */

/**
 * GET /api/changelog
 * Public: Fetch all published changelog releases
 */
router.get('/changelog', async (req, res) => {
  try {
    await ensureHistoricalSeeded();

    const docs = await Changelog.find({ published: true })
      .sort({ releaseDate: -1, createdAt: -1 })
      .lean();

    if (!docs || docs.length === 0) {
      // Fallback directly to json file if database is empty or unseeded
      if (fs.existsSync(JSON_CHANGELOG_PATH)) {
        const raw = fs.readFileSync(JSON_CHANGELOG_PATH, 'utf-8');
        return res.json({
          success: true,
          changelogs: JSON.parse(raw),
          source: 'file_fallback'
        });
      }
      return res.json({ success: true, changelogs: [] });
    }

    const formatted = docs.map(formatChangelogDoc);
    res.json({
      success: true,
      changelogs: formatted,
      count: formatted.length,
      source: 'database'
    });
  } catch (err) {
    console.error('[Changelog] Public fetch error:', err);
    // Graceful fallback to static JSON
    try {
      if (fs.existsSync(JSON_CHANGELOG_PATH)) {
        const raw = fs.readFileSync(JSON_CHANGELOG_PATH, 'utf-8');
        return res.json({
          success: true,
          changelogs: JSON.parse(raw),
          source: 'error_fallback'
        });
      }
    } catch {
      // Ignore inner error
    }
    res.status(500).json({ error: 'Failed to fetch changelog updates' });
  }
});

/* ============================================================
   ADMIN ENDPOINTS
   ============================================================ */

/**
 * GET /api/admin/changelog
 * Admin: Fetch all releases (drafts + published) with summary metrics
 */
router.get('/admin/changelog', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    await ensureHistoricalSeeded();

    const docs = await Changelog.find({})
      .sort({ releaseDate: -1, createdAt: -1 })
      .lean();

    const formatted = docs.map(formatChangelogDoc);
    const draftsCount = formatted.filter(r => !r.published).length;
    const publishedCount = formatted.filter(r => r.published).length;

    res.json({
      success: true,
      changelogs: formatted,
      totalCount: formatted.length,
      draftsCount,
      publishedCount
    });
  } catch (err) {
    console.error('[Changelog Admin] Fetch all error:', err);
    res.status(500).json({ error: 'Failed to fetch admin changelog list' });
  }
});

/**
 * POST /api/admin/changelog
 * Admin: Create a new release (draft or published)
 */
router.post('/admin/changelog', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const {
      version,
      releaseDate,
      published = false,
      title = '',
      description = '',
      sections = []
    } = req.body || {};

    if (!version || !String(version).trim()) {
      return res.status(400).json({ error: 'Version string is required (e.g. v1.2.3)' });
    }

    // Clean, prioritize, and ensure at most 1 of each section
    const cleanedSections = sanitizeAndPrioritizeSections(sections);

    const doc = new Changelog({
      version: String(version).trim(),
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      published: Boolean(published),
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      sections: cleanedSections,
      createdBy: admin.username || 'Admin'
    });

    await doc.save();

    res.status(201).json({
      success: true,
      changelog: formatChangelogDoc(doc)
    });
  } catch (err) {
    console.error('[Changelog Admin] Create error:', err);
    res.status(500).json({ error: 'Failed to create changelog release' });
  }
});

/**
 * PUT /api/admin/changelog/:id
 * Admin: Update an existing changelog release
 */
router.put('/admin/changelog/:id', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const {
      version,
      releaseDate,
      published,
      title,
      description,
      sections
    } = req.body || {};

    const doc = await Changelog.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Changelog release not found' });
    }

    if (version !== undefined) {
      if (!String(version).trim()) {
        return res.status(400).json({ error: 'Version cannot be empty' });
      }
      doc.version = String(version).trim();
    }

    if (releaseDate !== undefined) {
      const parsed = new Date(releaseDate);
      if (!isNaN(parsed.getTime())) doc.releaseDate = parsed;
    }

    if (published !== undefined) {
      doc.published = Boolean(published);
    }

    if (title !== undefined) {
      doc.title = String(title || '').trim();
    }

    if (description !== undefined) {
      doc.description = String(description || '').trim();
    }

    if (sections !== undefined && Array.isArray(sections)) {
      doc.sections = sanitizeAndPrioritizeSections(sections);
    }

    await doc.save();

    res.json({
      success: true,
      changelog: formatChangelogDoc(doc)
    });
  } catch (err) {
    console.error('[Changelog Admin] Update error:', err);
    res.status(500).json({ error: 'Failed to update changelog release' });
  }
});

/**
 * PATCH /api/admin/changelog/:id/publish
 * Admin: Toggle publication state
 */
router.patch('/admin/changelog/:id/publish', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const doc = await Changelog.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Changelog release not found' });
    }

    doc.published = !doc.published;
    await doc.save();

    res.json({
      success: true,
      published: doc.published,
      changelog: formatChangelogDoc(doc)
    });
  } catch (err) {
    console.error('[Changelog Admin] Toggle publish error:', err);
    res.status(500).json({ error: 'Failed to toggle publication status' });
  }
});

/**
 * DELETE /api/admin/changelog/:id
 * Admin: Delete a changelog release
 */
router.delete('/admin/changelog/:id', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const doc = await Changelog.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ error: 'Changelog release not found' });
    }

    res.json({
      success: true,
      message: 'Changelog release deleted successfully'
    });
  } catch (err) {
    console.error('[Changelog Admin] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete changelog release' });
  }
});

/**
 * POST /api/admin/changelog/duplicate/:id
 * Admin: Duplicate previous release structure into a fresh draft
 */
router.post('/admin/changelog/duplicate/:id', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    const source = await Changelog.findById(id).lean();
    if (!source) {
      return res.status(404).json({ error: 'Source release not found' });
    }

    // Auto-increment version suggestion if possible (e.g. v1.2.2 -> v1.2.3)
    let nextVersion = `${source.version}-draft`;
    const match = source.version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      const [_, major, minor, patch] = match;
      nextVersion = `v${major}.${minor}.${Number(patch) + 1}`;
    }

    // Clone sections with empty items arrays for fresh typing
    const cleanSections = (source.sections || []).map(sec => ({
      type: sec.type,
      items: []
    }));

    // If no sections existed, provide default starter sections
    if (cleanSections.length === 0) {
      cleanSections.push({ type: 'feature', items: [] });
      cleanSections.push({ type: 'improvement', items: [] });
      cleanSections.push({ type: 'fix', items: [] });
    }

    const newDraft = new Changelog({
      version: nextVersion,
      releaseDate: new Date(),
      published: false,
      title: '',
      description: '',
      sections: cleanSections,
      createdBy: admin.username || 'Admin'
    });

    await newDraft.save();

    res.status(201).json({
      success: true,
      changelog: formatChangelogDoc(newDraft)
    });
  } catch (err) {
    console.error('[Changelog Admin] Duplicate error:', err);
    res.status(500).json({ error: 'Failed to duplicate release structure' });
  }
});

/**
 * POST /api/admin/changelog/quick-entry
 * Admin: Append a single bullet entry directly into the latest unpublished release
 */
router.post('/admin/changelog/quick-entry', authenticateUser, async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { type = 'feature', item, version } = req.body || {};
    if (!item || !String(item).trim()) {
      return res.status(400).json({ error: 'Entry text is required' });
    }

    const cleanItem = String(item).trim();
    const cleanType = ['feature', 'improvement', 'fix', 'removed', 'security'].includes(type) ? type : 'feature';

    // Find latest draft or create one
    let target = null;
    if (version) {
      target = await Changelog.findOne({ version: String(version).trim() });
    } else {
      target = await Changelog.findOne({ published: false }).sort({ createdAt: -1 });
    }

    if (!target) {
      // Create new draft
      target = new Changelog({
        version: 'vNext',
        releaseDate: new Date(),
        published: false,
        sections: [{ type: cleanType, items: [cleanItem] }],
        createdBy: admin.username || 'Admin'
      });
    } else {
      let sec = target.sections.find(s => s.type === cleanType);
      if (!sec) {
        target.sections.push({ type: cleanType, items: [cleanItem] });
      } else {
        sec.items.push(cleanItem);
      }
    }

    await target.save();

    res.json({
      success: true,
      changelog: formatChangelogDoc(target)
    });
  } catch (err) {
    console.error('[Changelog Admin] Quick entry error:', err);
    res.status(500).json({ error: 'Failed to add quick entry to changelog' });
  }
});

export default router;
