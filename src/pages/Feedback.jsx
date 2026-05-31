import React, { useState, useCallback } from 'react';
import { Bug, Zap } from 'lucide-react';
import { useMessage } from '../components/Shared/MessageContext';
import { api } from '../utils/api';
import './Changelog.css';

const Feedback = () => {
  const { showMessage } = useMessage();
  const [bugReport, setBugReport] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportType, setReportType] = useState('bug'); // 'bug' or 'feature'

  const handleBugReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/bug-reports', { ...bugReport, type: reportType });
      const typeText = reportType === 'bug' ? 'Bug report' : 'Feature request';
      showMessage(`${typeText} submitted successfully!`, 'success');
      setBugReport({ title: '', description: '' });
    } catch (error) {
      console.error('Error submitting report:', error);
      const typeText = reportType === 'bug' ? 'bug report' : 'feature request';
      showMessage(`Failed to submit ${typeText}: ${error.userMessage || error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setBugReport(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="changelog-page">
      <div className="changelog-container">
        <h1>Feedback</h1>
        <div className="app-divider" />

        <section className="bug-report-section" style={{ marginTop: 0 }}>
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

          <p className="bug-report-description">
            {reportType === 'bug'
              ? "Found something broken? Let us know and we'll get it fixed as soon as possible."
              : "Have an idea that would make the site better? We'd love to hear it!"}
          </p>

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
                  placeholder={reportType === 'bug' ? 'Brief description of the issue' : 'Brief description of the feature'}
                  maxLength={100}
                  required
                />
                <span className="char-counter">{bugReport.title.length}/100</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <div className="textarea-with-counter">
                <textarea
                  id="description"
                  name="description"
                  value={bugReport.description}
                  onChange={handleInputChange}
                  placeholder={reportType === 'bug'
                    ? 'Please provide detailed steps to reproduce the issue, what you expected to happen, and what actually happened.'
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

export default Feedback;
