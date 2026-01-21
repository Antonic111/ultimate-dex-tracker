import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Bug, Calendar, AlertCircle, ChevronLeft, ChevronRight, Filter, Search, FileText, Zap, ChevronDown } from 'lucide-react';
import { useMessage } from '../components/Shared/MessageContext';
import { api } from '../utils/api';
import changelogData from '../data/changelog.json';
import './Changelog.css';

const Changelog = () => {
  const { showMessage } = useMessage();
  const [bugReport, setBugReport] = useState({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportType, setReportType] = useState('bug'); // 'bug' or 'feature'

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterButtonRef = useRef();
  const entriesPerPage = 1;

  const changelogEntries = changelogData;

  // Filter and paginate changelog entries
  const filteredEntries = useMemo(() => {
    let filtered = changelogEntries;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [changelogEntries, filterType, searchTerm]);

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  // Click outside handler for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilterLabel = () => {
    switch (filterType) {
      case 'feature': return 'New Features';
      case 'fix': return 'Bug Fixes';
      default: return 'All Updates';
    }
  };

  const handleBugReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const responseData = await api.post('/bug-reports', {
        ...bugReport,
        type: reportType
      });

      console.log('Response data:', responseData);

      const typeText = reportType === 'bug' ? 'Bug report' : 'Feature request';
      showMessage(`${typeText} submitted successfully!`, 'success');
      setBugReport({ title: '', description: '' });
    } catch (error) {
      console.error('Error submitting bug report:', error);
      const typeText = reportType === 'bug' ? 'bug report' : 'feature request';
      showMessage(`Failed to submit ${typeText}: ${error.userMessage || error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setBugReport(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'feature':
        return <Zap className="changelog-icon feature" />;
      case 'fix':
        return <AlertCircle className="changelog-icon fix" />;
      default:
        return <Calendar className="changelog-icon" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'feature':
        return 'New Feature';
      case 'fix':
        return 'Bug Fix';
      default:
        return 'Update';
    }
  };

  return (
    <div className="changelog-page">
      <div className="changelog-container">
        <h1>Changelogs & Bug Reports</h1>

        {/* Changelog Section */}
        <section className="changelog-section">
          <h2>
            <FileText className="changelog-header-icon" />
            Recent Updates
          </h2>

          {/* Filter Controls */}
          <div className="changelog-controls">
            <div className="search-controls">
              <div className="search-input-wrap">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search updates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="filter-controls">
              <div className={`filter-button-wrap ${showFilterDropdown ? 'open' : ''}`} ref={filterButtonRef}>
                <button
                  className="filter-button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  aria-label="Filter updates"
                >
                  <div className="filter-content">
                    <Filter size={18} />
                    <span>{getFilterLabel()}</span>
                  </div>
                  <ChevronDown
                    className={`ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer ${showFilterDropdown ? '' : 'rotate-180'}`}
                    style={{ color: 'var(--accent)' }}
                    size={16}
                  />
                </button>

                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <button
                      className={`filter-option ${filterType === "all" ? "active" : ""}`}
                      onClick={() => {
                        setFilterType("all");
                        setShowFilterDropdown(false);
                      }}
                    >
                      All Updates
                    </button>
                    <button
                      className={`filter-option ${filterType === "feature" ? "active" : ""}`}
                      onClick={() => {
                        setFilterType("feature");
                        setShowFilterDropdown(false);
                      }}
                    >
                      New Features
                    </button>
                    <button
                      className={`filter-option ${filterType === "fix" ? "active" : ""}`}
                      onClick={() => {
                        setFilterType("fix");
                        setShowFilterDropdown(false);
                      }}
                    >
                      Bug Fixes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="changelog-entries">
            {paginatedEntries.map((entry, index) => (
              <div key={index} className="changelog-entry">
                <div className="changelog-header">
                  <div className="changelog-meta">
                    {getTypeIcon(entry.type)}
                    <span className="changelog-type">{getTypeLabel(entry.type)}</span>
                    <span className="changelog-version">{entry.version}</span>
                    <span className="changelog-date">{entry.date}</span>
                  </div>
                  <h3 className="changelog-title">{entry.title}</h3>
                </div>
                <p className="changelog-description">{entry.description}</p>

                {/* Display features, changes, and fixes in order */}
                {entry.features && entry.features.length > 0 && (
                  <div className="changelog-section">
                    <h4 className="changelog-section-title">Features:</h4>
                    <ul className="changelog-list">
                      {entry.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="changelog-item">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes && entry.changes.length > 0 && (
                  <div className="changelog-section">
                    <h4 className="changelog-section-title">Changes:</h4>
                    <ul className="changelog-list">
                      {entry.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="changelog-item">{change}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.fixes && entry.fixes.length > 0 && (
                  <div className="changelog-section">
                    <h4 className="changelog-section-title">Fixes:</h4>
                    <ul className="changelog-list">
                      {entry.fixes.map((fix, fixIndex) => (
                        <li key={fixIndex} className="changelog-item">{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(startIndex + entriesPerPage, filteredEntries.length)} of {filteredEntries.length} updates
              </div>

              <div className="pagination-buttons">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Bug Report Section */}
        <section className="bug-report-section">
          <div className="report-headers">
            <h2
              className={`report-header ${reportType === 'bug' ? 'active' : ''}`}
              onClick={() => setReportType('bug')}
            >
              <Bug className="changelog-header-icon" />
              Report a Bug
            </h2>
            <h2
              className={`report-header ${reportType === 'feature' ? 'active' : ''}`}
              onClick={() => setReportType('feature')}
            >
              <Zap className="changelog-header-icon" />
              Request a Feature
            </h2>
          </div>

          <form onSubmit={handleBugReportSubmit} className="bug-report-form">
            <div className="form-group">
              <label htmlFor="title">
                {reportType === 'bug' ? 'Bug Title' : 'Feature Title'} *
              </label>
              <div className="input-with-counter">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={bugReport.title}
                  onChange={handleInputChange}
                  placeholder={reportType === 'bug' ? "Brief description of the issue" : "Brief description of the feature"}
                  maxLength={100}
                  required
                />
                <span className="char-counter">{bugReport.title.length}/100</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description *
              </label>
              <div className="textarea-with-counter">
                <textarea
                  id="description"
                  name="description"
                  value={bugReport.description}
                  onChange={handleInputChange}
                  placeholder={reportType === 'bug'
                    ? "Please provide detailed steps to reproduce the issue, what you expected to happen, and what actually happened."
                    : "Please describe the feature you'd like to see, how it would work, and why it would be useful."
                  }
                  rows="5"
                  maxLength={1000}
                  required
                />
                <span className="char-counter">{bugReport.description.length}/1000</span>
              </div>
            </div>



            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : (reportType === 'bug' ? 'Submit Bug Report' : 'Submit Feature Request')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Changelog;
