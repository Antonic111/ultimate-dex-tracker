import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Zap,
  TrendingUp,
  Wrench,
  Shield,
  Trash2,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  FileText,
  Bug,
  Lightbulb,
  MessageSquare,
  ExternalLink,
  X,
  Sparkles,
  Calendar
} from 'lucide-react';
import changelogData from '../data/changelog.json';
import { changelogAPI } from '../utils/api';
import './Changelog.css';

/**
 * Format raw date string (e.g. "2026-09-3" or "2026-08-30") to readable English (e.g. "September 3, 2026")
 */
function formatChangelogDate(dateStr) {
  if (!dateStr) return '';
  // If it's an ISO timestamp or date
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return String(dateStr);
  const [year, month, day] = parts;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = months[month - 1] || '';
  return `${monthName} ${day}, ${year}`;
}

/**
 * Safely parse markdown **bold** text into React <strong> elements
 */
function renderMarkdownText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/**
 * Categorize bullets into Features, Improvements, Fixes, Removed, and Security
 */
function getCategorizedItems(entry) {
  // If entry contains explicit DB sections
  if (Array.isArray(entry.sections) && entry.sections.length > 0) {
    const features = [];
    const improvements = [];
    const fixes = [];
    const removed = [];
    const security = [];

    entry.sections.forEach((sec) => {
      const type = (sec.type || '').toLowerCase();
      const items = (sec.items || []).filter(Boolean);
      if (type.includes('feature')) features.push(...items);
      else if (type.includes('improv') || type.includes('change')) improvements.push(...items);
      else if (type.includes('fix')) fixes.push(...items);
      else if (type.includes('remov')) removed.push(...items);
      else if (type.includes('secur')) security.push(...items);
      else features.push(...items);
    });

    return { features, improvements, fixes, removed, security };
  }

  const explicitFeatures = entry.features || [];
  const explicitFixes = entry.fixes || [];
  const explicitChanges = entry.changes || entry.improvements || [];
  const explicitRemoved = entry.removed || [];
  const explicitSecurity = entry.security || [];

  if (explicitChanges.length > 0 || explicitRemoved.length > 0 || explicitSecurity.length > 0) {
    return {
      features: explicitFeatures,
      improvements: explicitChanges,
      fixes: explicitFixes,
      removed: explicitRemoved,
      security: explicitSecurity
    };
  }

  const features = [];
  const improvements = [];
  explicitFeatures.forEach((item) => {
    const lower = item.trim().toLowerCase();
    if (lower.startsWith('improved ') || lower.startsWith('revamped ')) {
      improvements.push(item);
    } else {
      features.push(item);
    }
  });

  return {
    features,
    improvements,
    fixes: explicitFixes,
    removed: explicitRemoved,
    security: explicitSecurity
  };
}

/**
 * Get a clean single-line summary for collapsed row preview
 */
function getPreviewSummary(entry, categorized) {
  const candidate = (categorized.features && categorized.features[0]) ||
    (categorized.improvements && categorized.improvements[0]) ||
    (categorized.fixes && categorized.fixes[0]) ||
    '';
  return candidate.replace(/\*\*/g, '');
}

/**
 * Determine type pill badge for a release
 */
function getEntryTypeBadge(entry, categorized) {
  if (entry.version === 'v1.0.0' || entry.version === 'v1.0.1') {
    return { label: 'Release', className: 'badge-release' };
  }
  if (entry.type === 'fix' || (!categorized.features.length && categorized.fixes.length > 0)) {
    return { label: 'Fix', className: 'badge-fix' };
  }
  if (categorized.improvements.length > categorized.features.length) {
    return { label: 'Improvement', className: 'badge-improvement' };
  }
  return { label: 'Feature', className: 'badge-feature' };
}

const PAGE_SIZE = 10;

const Changelog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic changelog data from API with fallback to static json
  const [entriesData, setEntriesData] = useState(() => changelogData || []);

  // Strictly only 1 changelog version allowed to be open at a time.
  // Defaults to the latest version (e.g. v1.2.2).
  const [openVersion, setOpenVersion] = useState(() => {
    return (changelogData && changelogData.length > 0) ? changelogData[0].version : 'v1.2.2';
  });

  // Fetch live published changelog from database API
  useEffect(() => {
    let isMounted = true;
    changelogAPI.getPublic()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setEntriesData(data);
          setOpenVersion(prev => prev || data[0].version);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch published changelog from API, using fallback data:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggling: if clicking the open version, it collapses; if clicking a different one, it opens and closes the other.
  const toggleVersion = (version) => {
    setOpenVersion(prev => prev === version ? null : version);
  };

  // Precompute categorized entries once
  const preparedEntries = useMemo(() => {
    return (entriesData || []).map((entry, index) => {
      const categorized = getCategorizedItems(entry);
      const summary = getPreviewSummary(entry, categorized);
      const badge = getEntryTypeBadge(entry, categorized);
      const rawDate = entry.releaseDate || entry.date;
      const formattedDate = formatChangelogDate(rawDate);
      const isLatest = index === 0;

      // Extract all items from sections if present
      const sectionItems = Array.isArray(entry.sections)
        ? entry.sections.flatMap(s => s.items || [])
        : [];

      // Full search corpus
      const searchCorpus = [
        entry.version,
        ...(entry.features || []),
        ...(entry.fixes || []),
        ...(entry.changes || []),
        ...sectionItems
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        ...entry,
        categorized,
        summary,
        badge,
        formattedDate,
        isLatest,
        searchCorpus
      };
    });
  }, [entriesData]);

  // Compute stats across the whole changelog
  const stats = useMemo(() => {
    let featureCount = 0;
    let improvementCount = 0;
    let fixCount = 0;
    let securityCount = 0;
    let removedCount = 0;

    preparedEntries.forEach((entry) => {
      if (entry.categorized.features.length > 0) featureCount++;
      if (entry.categorized.improvements.length > 0) improvementCount++;
      if (entry.categorized.fixes.length > 0) fixCount++;

      const corpus = entry.searchCorpus;
      if (corpus.includes('security') || corpus.includes('xss') || corpus.includes('sanitiz')) {
        securityCount++;
      }
      if (corpus.includes('removed')) {
        removedCount++;
      }
    });

    return {
      total: preparedEntries.length,
      features: featureCount,
      improvements: improvementCount,
      fixes: fixCount,
      security: Math.max(1, securityCount),
      removed: Math.max(2, removedCount)
    };
  }, [preparedEntries]);

  // Filter entries based on search and active tab
  const filteredEntries = useMemo(() => {
    let result = preparedEntries;

    if (filterType !== 'all') {
      result = result.filter(entry => {
        if (filterType === 'features') {
          return entry.categorized.features.length > 0 || entry.type === 'feature';
        }
        if (filterType === 'improvements') {
          return entry.categorized.improvements.length > 0;
        }
        if (filterType === 'fixes') {
          return entry.categorized.fixes.length > 0 || entry.type === 'fix';
        }
        if (filterType === 'security') {
          return entry.searchCorpus.includes('security') || entry.searchCorpus.includes('xss') || entry.searchCorpus.includes('sanitiz');
        }
        if (filterType === 'removed') {
          return entry.searchCorpus.includes('removed');
        }
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(entry => entry.searchCorpus.includes(term));
    }

    return result;
  }, [preparedEntries, filterType, searchTerm]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="changelog-page fade-in-up">
      {/* ============================================================
          PAGE TITLE & HEADER (Matches Trainers page exact header layout)
          ============================================================ */}
      <div className="trainers-title-wrap">
        <h1 className="trainers-main-heading">
          Changelog
        </h1>
      </div>

      <div className="app-divider" />

      {/* ============================================================
          SEARCH & FILTER BAR CONTROLS
          ============================================================ */}
      <div className="changelog-controls-bar">
        <div className="changelog-search-wrap">
          <Search className="changelog-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="changelog-search-input"
            aria-label="Search updates"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="changelog-search-clear-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="changelog-filter-pills" role="tablist">
          <button
            className={`changelog-filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`changelog-filter-pill ${filterType === 'features' ? 'active' : ''}`}
            onClick={() => setFilterType('features')}
          >
            <Zap size={14} className="pill-icon text-emerald-400" />
            <span>Features</span>
          </button>
          <button
            className={`changelog-filter-pill ${filterType === 'improvements' ? 'active' : ''}`}
            onClick={() => setFilterType('improvements')}
          >
            <TrendingUp size={14} className="pill-icon text-sky-400" />
            <span>Improvements</span>
          </button>
          <button
            className={`changelog-filter-pill ${filterType === 'fixes' ? 'active' : ''}`}
            onClick={() => setFilterType('fixes')}
          >
            <Wrench size={14} className="pill-icon text-rose-400" />
            <span>Fixes</span>
          </button>
          <button
            className={`changelog-filter-pill ${filterType === 'security' ? 'active' : ''}`}
            onClick={() => setFilterType('security')}
          >
            <Shield size={14} className="pill-icon text-purple-400" />
            <span>Security</span>
          </button>
          <button
            className={`changelog-filter-pill ${filterType === 'removed' ? 'active' : ''}`}
            onClick={() => setFilterType('removed')}
          >
            <Trash2 size={14} className="pill-icon text-amber-500" />
            <span>Removed</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TWO-COLUMN LAYOUT: MAIN CONTENT + SIDEBAR
          ============================================================ */}
      <div className="changelog-layout-grid">
        {/* LEFT COLUMN: UPDATES LIST & PAGINATION */}
        <div className="changelog-main-col">
          {paginatedEntries.length === 0 ? (
            <div className="changelog-empty-state">
              <FileText size={40} className="empty-icon text-muted" />
              <h3>No updates found</h3>
              <p>Try adjusting your search query or selected category filter.</p>
              <button
                className="changelog-reset-filter-btn"
                onClick={() => { setSearchTerm(''); setFilterType('all'); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="changelog-list">
              {paginatedEntries.map((entry) => {
                const isOpen = openVersion === entry.version;

                return (
                  <motion.article
                    layout="position"
                    key={entry.version}
                    className={`changelog-card ${isOpen ? 'expanded' : 'collapsed'} ${entry.isLatest ? 'is-latest' : ''}`}
                    transition={{ layout: { duration: 0.28, ease: [0.25, 1, 0.5, 1] } }}
                  >
                    {/* Clickable Header Bar */}
                    <div
                      className="changelog-card-header-clickable"
                      onClick={() => toggleVersion(entry.version)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleVersion(entry.version);
                        }
                      }}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} update ${entry.version}`}
                    >
                      {isOpen ? (
                        <div className="changelog-card-header-expanded">
                          <div className="changelog-card-header-left">
                            <div className="changelog-version-row">
                              <h2 className="changelog-version-heading">{entry.version}</h2>
                              {entry.isLatest && (
                                <span className="changelog-latest-pill">Latest</span>
                              )}
                            </div>
                            <span className="changelog-date-text">
                              <Calendar size={13} className="changelog-date-icon" />
                              <span>{entry.formattedDate}</span>
                            </span>
                          </div>

                          <div className="changelog-card-header-right">
                            <button
                              type="button"
                              className="changelog-toggle-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVersion(entry.version);
                              }}
                              aria-label={`Collapse update ${entry.version}`}
                              title="Collapse update"
                            >
                              <ChevronUp size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="changelog-row-collapsed-inner">
                          <div className="changelog-row-left">
                            <span className="changelog-row-version">{entry.version}</span>
                            <span className="changelog-row-date">{entry.formattedDate}</span>
                            <span className={`changelog-row-badge ${entry.badge.className}`}>
                              {entry.badge.label}
                            </span>
                          </div>

                          <div className="changelog-row-summary" title={entry.summary}>
                            {entry.summary}
                          </div>

                          <div className="changelog-row-right">
                            <ChevronRight size={18} className="changelog-row-chevron" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Animated Collapsible Body with Motion */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="collapsible-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
                            opacity: { duration: 0.22, ease: "linear" }
                          }}
                          className="changelog-card-collapsible-overflow"
                        >
                          <div className="changelog-card-body">
                            {/* Features Section */}
                            {entry.categorized.features.length > 0 && (
                              <section className="changelog-group features-group">
                                <h3 className="changelog-group-title features-title">
                                  <span className="changelog-section-icon-box features-icon-box">
                                    <Zap size={15} />
                                  </span>
                                  <span>Features</span>
                                </h3>
                                <ul className="changelog-bullet-list">
                                  {entry.categorized.features.map((item, idx) => (
                                    <li key={idx} className="changelog-bullet-item">
                                      {renderMarkdownText(item)}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                            {/* Improvements Section */}
                            {entry.categorized.improvements.length > 0 && (
                              <section className="changelog-group improvements-group">
                                <h3 className="changelog-group-title improvements-title">
                                  <span className="changelog-section-icon-box improvements-icon-box">
                                    <TrendingUp size={15} />
                                  </span>
                                  <span>Improvements</span>
                                </h3>
                                <ul className="changelog-bullet-list">
                                  {entry.categorized.improvements.map((item, idx) => (
                                    <li key={idx} className="changelog-bullet-item">
                                      {renderMarkdownText(item)}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                            {/* Fixes Section */}
                            {entry.categorized.fixes.length > 0 && (
                              <section className="changelog-group fixes-group">
                                <h3 className="changelog-group-title fixes-title">
                                  <span className="changelog-section-icon-box fixes-icon-box">
                                    <Wrench size={15} />
                                  </span>
                                  <span>Fixes</span>
                                </h3>
                                <ul className="changelog-bullet-list">
                                  {entry.categorized.fixes.map((item, idx) => (
                                    <li key={idx} className="changelog-bullet-item">
                                      {renderMarkdownText(item)}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                            {/* Removed Section */}
                            {entry.categorized.removed && entry.categorized.removed.length > 0 && (
                              <section className="changelog-group removed-group">
                                <h3 className="changelog-group-title removed-title">
                                  <span className="changelog-section-icon-box removed-icon-box">
                                    <Trash2 size={15} />
                                  </span>
                                  <span>Removed</span>
                                </h3>
                                <ul className="changelog-bullet-list">
                                  {entry.categorized.removed.map((item, idx) => (
                                    <li key={idx} className="changelog-bullet-item">
                                      {renderMarkdownText(item)}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                            {/* Security Section */}
                            {entry.categorized.security && entry.categorized.security.length > 0 && (
                              <section className="changelog-group security-group">
                                <h3 className="changelog-group-title security-title">
                                  <span className="changelog-section-icon-box security-icon-box">
                                    <Shield size={15} />
                                  </span>
                                  <span>Security</span>
                                </h3>
                                <ul className="changelog-bullet-list">
                                  {entry.categorized.security.map((item, idx) => (
                                    <li key={idx} className="changelog-bullet-item">
                                      {renderMarkdownText(item)}
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="changelog-pagination-bar">
              <button
                className="changelog-page-nav-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="changelog-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`changelog-page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="changelog-page-nav-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR WIDGETS */}
        <aside className="changelog-sidebar-col">
          {/* Widget 1: Update Stats */}
          <div className="changelog-widget changelog-stats-widget">
            <div className="changelog-widget-header">
              <BarChart2 size={18} className="widget-header-icon" />
              <h3>Update Stats</h3>
            </div>
            <div className="changelog-stats-list">
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <FileText size={15} className="stat-icon text-muted" />
                  <span>Total Updates</span>
                </div>
                <span className="stat-num">{stats.total}</span>
              </div>
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <Zap size={15} className="stat-icon text-emerald-400" />
                  <span>Features</span>
                </div>
                <span className="stat-num">{stats.features}</span>
              </div>
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <TrendingUp size={15} className="stat-icon text-sky-400" />
                  <span>Improvements</span>
                </div>
                <span className="stat-num">{stats.improvements}</span>
              </div>
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <Wrench size={15} className="stat-icon text-rose-400" />
                  <span>Fixes</span>
                </div>
                <span className="stat-num">{stats.fixes}</span>
              </div>
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <Shield size={15} className="stat-icon text-purple-400" />
                  <span>Security</span>
                </div>
                <span className="stat-num">{stats.security}</span>
              </div>
              <div className="changelog-stat-row">
                <div className="stat-left">
                  <Trash2 size={15} className="stat-icon text-amber-500" />
                  <span>Removed</span>
                </div>
                <span className="stat-num">{stats.removed}</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Quick Links */}
          <div className="changelog-widget changelog-links-widget">
            <div className="changelog-widget-header">
              <Sparkles size={18} className="widget-header-icon" />
              <h3>Quick Links</h3>
            </div>
            <div className="changelog-quick-links-list">
              <Link
                to="/support?tab=bug"
                className="changelog-quick-link-item"
                title="Report an issue or bug"
              >
                <div className="link-item-left">
                  <Bug size={16} className="text-rose-400" />
                  <span>Report a Bug</span>
                </div>
                <ChevronRight size={15} className="link-arrow" />
              </Link>

              <Link
                to="/support?tab=feature"
                className="changelog-quick-link-item"
                title="Suggest a new feature or improvement"
              >
                <div className="link-item-left">
                  <Lightbulb size={16} className="text-emerald-400" />
                  <span>Suggest a Feature</span>
                </div>
                <ChevronRight size={15} className="link-arrow" />
              </Link>

              <a
                href="https://discord.com/invite/YE9uCuQcrW"
                target="_blank"
                rel="noopener noreferrer"
                className="changelog-quick-link-item"
                title="Join our Discord community"
              >
                <div className="link-item-left">
                  <MessageSquare size={16} className="text-indigo-400" />
                  <span>Join our Discord</span>
                </div>
                <ExternalLink size={14} className="link-arrow" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Changelog;
