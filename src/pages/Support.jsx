import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bug, Zap, HelpCircle, Ticket, LayoutGrid,
  Upload, X, Info, Send, ChevronDown, ChevronUp,
  Lock, RefreshCw, Plus, ArrowLeft,
  CheckCircle, UserCircle2, ShieldCheck, ExternalLink,
  MessageSquare, Sparkles, Check, AlertTriangle
} from 'lucide-react';
import { SelectField } from '../components/Shared/FormField';
import { Modal } from '../components/Shared/Modal';
import { useMessage } from '../components/Shared/MessageContext';
import { useUser } from '../components/Shared/UserContext';
import { getTimeAgo } from '../utils/profileUtils';
import { api } from '../utils/api';
import './Support.css';

// Categories tailored for each ticket type
const BUG_CATEGORIES = [
  { value: 'Dex & Tracking', label: 'Pokédex & Tracking' },
  { value: 'Shiny Counters', label: 'Shiny Counters & Hunting' },
  { value: 'Streamer Tools', label: 'Streamer Tools & Overlays' },
  { value: 'Account & Profile', label: 'Account, Profile & Login' },
  { value: 'Membership', label: 'Membership & Payments' },
  { value: 'UI & Visuals', label: 'UI, Visuals & Animations' },
  { value: 'Other', label: 'Other / Miscellaneous' }
];

const FEATURE_CATEGORIES = [
  { value: 'Dex & Tracking', label: 'Pokédex & Tracking' },
  { value: 'Shiny Counters', label: 'Shiny Counters & Hunting' },
  { value: 'Streamer Tools', label: 'Streamer Tools & Overlays' },
  { value: 'Achievements', label: 'Achievements & Badges' },
  { value: 'Trainers & Social', label: 'Trainers & Social Profiles' },
  { value: 'Mobile & Layout', label: 'Mobile Experience & UI' },
  { value: 'Other', label: 'Other Suggestion' }
];

const HELP_CATEGORIES = [
  { value: 'Billing & Membership', label: 'Billing & Membership (Stripe, Subscriptions, Access)' },
  { value: 'Account & Login', label: 'Account & Login (Password, Email, 2FA, Access)' },
  { value: 'Data & Dex Tracking', label: 'Data & Dex Tracking (Lost progress, Cloud sync)' },
  { value: 'General Support', label: 'General Support & Feedback' },
  { value: 'Other', label: 'Other Inquiry' }
];

/**
 * Status helper mapping backend statuses to user-friendly badge config
 */
export const getTicketStatusConfig = (type, status) => {
  if (type === 'help') {
    switch (status) {
      case 'new':
      case 'awaiting_staff':
        return { label: 'Awaiting Staff', color: 'amber', dot: '🟡' };
      case 'awaiting_user':
        return { label: 'Waiting for You', color: 'accent', dot: '⚡' };
      case 'resolved':
        return { label: 'Resolved', color: 'emerald', dot: '🟢' };
      case 'closed':
        return { label: 'Closed', color: 'neutral', dot: '⚪' };
      default:
        return { label: status || 'Open', color: 'amber', dot: '🟡' };
    }
  } else if (type === 'bug') {
    switch (status) {
      case 'reported':
        return { label: 'Received', color: 'rose', dot: '🔴' };
      case 'investigating':
        return { label: 'Investigating', color: 'amber', dot: '🟡' };
      case 'confirmed':
        return { label: 'Confirmed', color: 'purple', dot: '🟣' };
      case 'fix_in_progress':
        return { label: 'Fix In Progress', color: 'orange', dot: '🟠' };
      case 'fixed':
      case 'resolved':
        return { label: 'Fixed', color: 'emerald', dot: '🟢' };
      case 'closed':
        return { label: 'Closed', color: 'neutral', dot: '⚪' };
      default:
        return { label: status || 'Reported', color: 'amber', dot: '🟡' };
    }
  } else if (type === 'feature') {
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', color: 'accent', dot: '⚡' };
      case 'under_review':
        return { label: 'Under Review', color: 'purple', dot: '🟣' };
      case 'planned':
        return { label: 'Planned', color: 'amber', dot: '🟡' };
      case 'in_progress':
        return { label: 'In Progress', color: 'orange', dot: '🟠' };
      case 'completed':
      case 'resolved':
        return { label: 'Completed', color: 'emerald', dot: '🟢' };
      case 'declined':
        return { label: 'Declined', color: 'neutral', dot: '⚪' };
      case 'duplicate':
        return { label: 'Duplicate', color: 'neutral', dot: '⚪' };
      default:
        return { label: status || 'Submitted', color: 'accent', dot: '⚡' };
    }
  }
  return { label: status || 'Active', color: 'amber', dot: '🟡' };
};

/**
 * Reusable Attachment Upload Component
 */
const AttachmentUploadBox = ({ inputId, attachments, onUpload, onRemove, hintText }) => {
  return (
    <div className="support-field-group">
      <div className="support-field-label-row">
        <span>Screenshots or Attachments</span>
        <span className="text-[11px] text-[var(--text-muted)]">Up to 3 images (max 10MB each)</span>
      </div>

      <input
        type="file"
        id={inputId}
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onUpload}
      />
      <div
        className="support-upload-zone"
        onClick={() => {
          if (attachments.length < 3) {
            document.getElementById(inputId)?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="support-upload-left">
          <div className="support-upload-icon-box">
            <Upload size={18} />
          </div>
          <div className="support-upload-text">
            <div className="upload-title">
              <span>Click to upload</span> or drag screenshots
            </div>
            <div className="upload-hint">{hintText || 'PNG, JPG, WEBP, or GIF (max 10MB each)'}</div>
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="support-upload-inline-previews" onClick={(e) => e.stopPropagation()}>
            {attachments.map((att, idx) => (
              <div key={idx} className="support-inline-thumb">
                <img src={att} alt={`Attachment ${idx + 1}`} />
                <button
                  type="button"
                  className="support-inline-remove-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {attachments.length < 3 && (
              <button
                type="button"
                className="support-inline-add-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  document.getElementById(inputId)?.click();
                }}
                title="Add another screenshot"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Support = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const { user } = useUser();

  // Active view: list of requests or dedicated ticket view
  const ticketParam = searchParams.get('ticket');
  const [activeTicketId, setActiveTicketId] = useState(ticketParam || null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isLoadingActiveTicket, setIsLoadingActiveTicket] = useState(false);

  // Tickets filter: 'all' | 'open' | 'waiting' | 'resolved'
  const [ticketFilter, setTicketFilter] = useState('all');

  // Modal form triggers: null | 'bug' | 'feature' | 'help'
  const [activeModal, setActiveModal] = useState(null);

  // Diagnostics collapsed state
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Form states
  const [bugForm, setBugForm] = useState({
    title: '',
    category: 'Dex & Tracking',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    attachments: []
  });
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  const [featureForm, setFeatureForm] = useState({
    title: '',
    category: 'Dex & Tracking',
    description: '',
    useCase: '',
    attachments: []
  });
  const [isSubmittingFeature, setIsSubmittingFeature] = useState(false);

  const [helpForm, setHelpForm] = useState({
    title: '',
    category: 'Billing & Membership',
    description: '',
    attachments: []
  });
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

  // User tickets list
  const [userTickets, setUserTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Dedicated Ticket Reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Technical info snapshot
  const techInfo = useMemo(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let os = 'Unknown OS';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    return {
      browser,
      os,
      screen: screenRes,
      version: 'v1.2.2',
      url: currentUrl,
      timestamp: new Date().toISOString()
    };
  }, []);

  // Fetch all user's tickets
  const fetchUserTickets = useCallback(async ({ silent = false } = {}) => {
    if (!user) return;
    if (!silent) setIsLoadingTickets(true);
    try {
      const res = await api.get('/bug-reports/my');
      if (res && res.reports) {
        setUserTickets(prev => {
          if (
            prev.length === res.reports.length &&
            prev.every((t, i) => t._id === res.reports[i]._id && t.status === res.reports[i].status && t.lastActivityAt === res.reports[i].lastActivityAt)
          ) {
            return prev;
          }
          return res.reports;
        });
      }
    } catch (err) {
      if (!silent) console.error('Failed to load tickets:', err);
    } finally {
      if (!silent) setIsLoadingTickets(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user, fetchUserTickets]);

  // Sync active ticket ID from URL param
  useEffect(() => {
    const p = searchParams.get('ticket');
    if (p) {
      setActiveTicketId(p);
    } else {
      setActiveTicketId(null);
      setActiveTicket(null);
    }
  }, [searchParams]);

  // Load single ticket details when activeTicketId changes
  const loadActiveTicket = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return;
    if (!silent) setIsLoadingActiveTicket(true);
    try {
      const res = await api.get(`/bug-reports/${id}`);
      if (res && res.ticket) {
        setActiveTicket(prev => {
          if (!prev || prev._id !== res.ticket._id) return res.ticket;
          const prevLen = prev.messages?.length || 0;
          const newLen = res.ticket.messages?.length || 0;
          const statusChanged = prev.status !== res.ticket.status;
          const changelogChanged = prev.linkedChangelogVersion !== res.ticket.linkedChangelogVersion;
          const lastActivityChanged = prev.lastActivityAt !== res.ticket.lastActivityAt;
          if (prevLen !== newLen || statusChanged || changelogChanged || lastActivityChanged) {
            return res.ticket;
          }
          return prev;
        });
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to load ticket:', err);
        showMessage('Could not load ticket details', 'error');
      }
    } finally {
      if (!silent) setIsLoadingActiveTicket(false);
    }
  }, [showMessage]);

  useEffect(() => {
    if (activeTicketId) {
      loadActiveTicket(activeTicketId);
    }
  }, [activeTicketId, loadActiveTicket]);

  // Live polling effect for instant updates without page refresh (paused when tab is hidden)
  useEffect(() => {
    if (!user) return;

    let isPolling = false;

    const poll = async () => {
      if (document.hidden || isPolling) return;
      isPolling = true;
      try {
        if (activeTicketId) {
          // When active ticket is open: live sync conversation every 4s
          await loadActiveTicket(activeTicketId, { silent: true });
        } else {
          // When viewing inbox list: live sync list every 10s
          await fetchUserTickets({ silent: true });
        }
      } finally {
        isPolling = false;
      }
    };

    const intervalMs = activeTicketId ? 4000 : 10000;
    const timer = setInterval(poll, intervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        poll();
      }
    };
    const handleFocus = () => poll();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, activeTicketId, loadActiveTicket, fetchUserTickets]);

  // Open dedicated ticket view
  const handleOpenTicket = (ticketId) => {
    setActiveTicketId(ticketId);
    setSearchParams({ ticket: ticketId });
  };

  const handleBackToList = () => {
    setActiveTicketId(null);
    setActiveTicket(null);
    setSearchParams({});
    fetchUserTickets();
  };

  // Upload handler for forms
  const handleFileUpload = (e, formType) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.slice(0, 3).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        showMessage(`File "${file.name}" exceeds 10MB limit`, 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        if (formType === 'bug') {
          setBugForm(prev => ({ ...prev, attachments: [...prev.attachments, dataUrl].slice(0, 3) }));
        } else if (formType === 'feature') {
          setFeatureForm(prev => ({ ...prev, attachments: [...prev.attachments, dataUrl].slice(0, 3) }));
        } else if (formType === 'help') {
          setHelpForm(prev => ({ ...prev, attachments: [...prev.attachments, dataUrl].slice(0, 3) }));
        } else if (formType === 'reply') {
          setReplyAttachments(prev => [...prev, dataUrl].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index, formType) => {
    if (formType === 'bug') {
      setBugForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
    } else if (formType === 'feature') {
      setFeatureForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
    } else if (formType === 'help') {
      setHelpForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
    } else if (formType === 'reply') {
      setReplyAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ---------------------------------------------------------------------------
  // SUBMISSIONS
  // ---------------------------------------------------------------------------
  const handleBugSubmit = async (e) => {
    e.preventDefault();
    if (!bugForm.title.trim()) {
      showMessage('Please provide a bug title', 'warning');
      return;
    }
    if (!bugForm.description.trim()) {
      showMessage('Please describe the issue', 'warning');
      return;
    }

    setIsSubmittingBug(true);
    try {
      const payload = {
        type: 'bug',
        title: bugForm.title.trim(),
        category: bugForm.category,
        description: bugForm.description.trim(),
        stepsToReproduce: bugForm.stepsToReproduce.trim(),
        expectedBehavior: bugForm.expectedBehavior.trim(),
        attachments: bugForm.attachments,
        technicalInfo: techInfo
      };

      const res = await api.post('/bug-reports', payload);
      const ticketIdNum = res.report?.reportId || 'Submitted';
      showMessage(`Ticket #${ticketIdNum} submitted. We'll update you here when there's a response.`, 'success');

      setBugForm({
        title: '',
        category: 'Dex & Tracking',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        attachments: []
      });
      setActiveModal(null);

      if (res.report?._id) {
        handleOpenTicket(res.report._id);
      } else {
        fetchUserTickets();
      }
    } catch (err) {
      showMessage(err?.userMessage || err?.message || 'Failed to submit bug report.', 'error');
    } finally {
      setIsSubmittingBug(false);
    }
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!featureForm.title.trim()) {
      showMessage('Please provide a feature title', 'warning');
      return;
    }
    if (!featureForm.description.trim()) {
      showMessage('Please describe your proposed feature', 'warning');
      return;
    }

    setIsSubmittingFeature(true);
    try {
      const payload = {
        type: 'feature',
        title: featureForm.title.trim(),
        category: featureForm.category,
        description: featureForm.description.trim(),
        useCase: featureForm.useCase.trim(),
        attachments: featureForm.attachments,
        technicalInfo: techInfo
      };

      const res = await api.post('/bug-reports', payload);
      const ticketIdNum = res.report?.reportId || 'Submitted';
      showMessage(`Ticket #${ticketIdNum} submitted. We'll update you here when there's a response.`, 'success');

      setFeatureForm({
        title: '',
        category: 'Dex & Tracking',
        description: '',
        useCase: '',
        attachments: []
      });
      setActiveModal(null);

      if (res.report?._id) {
        handleOpenTicket(res.report._id);
      } else {
        fetchUserTickets();
      }
    } catch (err) {
      showMessage(err?.userMessage || err?.message || 'Failed to submit feature request.', 'error');
    } finally {
      setIsSubmittingFeature(false);
    }
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!helpForm.title.trim()) {
      showMessage('Please provide a subject for your request', 'warning');
      return;
    }
    if (!helpForm.description.trim()) {
      showMessage('Please describe what you need help with', 'warning');
      return;
    }

    setIsSubmittingHelp(true);
    try {
      const payload = {
        type: 'help',
        title: helpForm.title.trim(),
        category: helpForm.category,
        description: helpForm.description.trim(),
        attachments: helpForm.attachments,
        technicalInfo: techInfo
      };

      const res = await api.post('/bug-reports', payload);
      const ticketIdNum = res.report?.reportId || 'Submitted';
      showMessage(`Ticket #${ticketIdNum} submitted. We'll update you here when there's a response.`, 'success');

      setHelpForm({
        title: '',
        category: 'Billing & Membership',
        description: '',
        attachments: []
      });
      setActiveModal(null);

      if (res.report?._id) {
        handleOpenTicket(res.report._id);
      } else {
        fetchUserTickets();
      }
    } catch (err) {
      showMessage(err?.userMessage || err?.message || 'Failed to submit support request.', 'error');
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  // Send reply in dedicated ticket view
  const handleSendReply = async () => {
    if (!activeTicket?._id || (!replyText.trim() && replyAttachments.length === 0)) return;
    setIsSendingReply(true);
    try {
      const res = await api.post(`/bug-reports/${activeTicket._id}/messages`, {
        content: replyText.trim(),
        attachments: replyAttachments
      });
      if (res && res.ticket) {
        setActiveTicket(res.ticket);
        setReplyText('');
        setReplyAttachments([]);
        showMessage('Reply sent successfully', 'success');
        fetchUserTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      showMessage(err?.message || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Toggle ticket resolved/reopen status
  const handleToggleResolve = async () => {
    if (!activeTicket?._id) return;
    const isResolved = activeTicket.status === 'resolved' || activeTicket.status === 'fixed' || activeTicket.status === 'completed';
    const newStatus = isResolved ? 'open' : 'resolved';
    try {
      const res = await api.patch(`/bug-reports/${activeTicket._id}/status`, { status: newStatus });
      if (res && res.ticket) {
        setActiveTicket(prev => ({ ...prev, status: res.ticket.status, resolvedAt: res.ticket.resolvedAt }));
        showMessage(`Ticket ${isResolved ? 'reopened' : 'marked as resolved'}`, 'success');
        fetchUserTickets();
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to update ticket status', 'error');
    }
  };

  // Filter user tickets
  const filteredTickets = useMemo(() => {
    return userTickets.filter(ticket => {
      const isResolved = ticket.status === 'resolved' || ticket.status === 'fixed' || ticket.status === 'completed' || ticket.status === 'closed';
      if (ticketFilter === 'open') {
        return !isResolved;
      }
      if (ticketFilter === 'waiting') {
        return ticket.status === 'awaiting_user';
      }
      if (ticketFilter === 'resolved') {
        return isResolved;
      }
      return true; // 'all'
    });
  }, [userTickets, ticketFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let open = 0;
    let waiting = 0;
    let resolved = 0;
    userTickets.forEach(t => {
      const isRes = t.status === 'resolved' || t.status === 'fixed' || t.status === 'completed' || t.status === 'closed';
      if (isRes) resolved++;
      else open++;
      if (t.status === 'awaiting_user') waiting++;
    });
    return { all: userTickets.length, open, waiting, resolved };
  }, [userTickets]);

  return (
    <div className="support-page fade-in-up">
      {/* ============================================================
          PAGE TITLE & HEADER (Standard 1300px layout + divider)
          ============================================================ */}
      <div className="trainers-title-wrap">
        <h1 className="trainers-main-heading">Support</h1>
      </div>

      <div className="app-divider" />

      <div className="support-container">
        {/* ============================================================
            1. "NEED HELP?" ACTION BAR (3 Action triggers, not tabs)
            ============================================================ */}
        <section className="support-actions-bar" aria-label="Support actions">
          <div className="support-actions-header">
            <span className="support-actions-label">Need help?</span>
          </div>

          <div className="support-action-triggers">
            <button
              type="button"
              className="support-action-btn trigger-bug"
              onClick={() => setActiveModal('bug')}
            >
              <div className="action-icon-circle bug">
                <Bug size={17} />
              </div>
              <div className="action-text-group">
                <span className="action-title">Report a Bug</span>
                <span className="action-subtitle">Something broken?</span>
              </div>
            </button>

            <button
              type="button"
              className="support-action-btn trigger-feature"
              onClick={() => setActiveModal('feature')}
            >
              <div className="action-icon-circle feature">
                <Zap size={17} />
              </div>
              <div className="action-text-group">
                <span className="action-title">Request a Feature</span>
                <span className="action-subtitle">Share your ideas</span>
              </div>
            </button>

            <button
              type="button"
              className="support-action-btn trigger-help"
              onClick={() => setActiveModal('help')}
            >
              <div className="action-icon-circle help">
                <HelpCircle size={17} />
              </div>
              <div className="action-text-group">
                <span className="action-title">Contact Support</span>
                <span className="action-subtitle">Billing, account & questions</span>
              </div>
            </button>
          </div>
        </section>

        {/* ============================================================
            2. PERMANENT "YOUR SUPPORT REQUESTS" / TICKET VIEW
            ============================================================ */}
        <main className="support-inbox-section">
          {activeTicketId ? (
            /* ----------------------------------------------------------
               VIEW A: DEDICATED TICKET VIEW (Centerpiece)
               ---------------------------------------------------------- */
            <div className="support-ticket-view fade-in-up">
              {/* Back Button */}
              <button
                type="button"
                className="support-back-btn"
                onClick={handleBackToList}
              >
                <ArrowLeft size={16} />
                <span>Back to Support Requests</span>
              </button>

              {isLoadingActiveTicket && !activeTicket ? (
                <div className="support-loading-box">
                  <RefreshCw size={20} className="animate-spin text-[var(--accent)]" />
                  <span>Loading ticket #{activeTicketId}...</span>
                </div>
              ) : !activeTicket ? (
                <div className="support-empty-state">
                  <AlertTriangle size={32} className="text-amber-400" />
                  <h3>Ticket Not Found</h3>
                  <p>This request may have been removed or you may not have access to view it.</p>
                  <button type="button" className="support-submit-btn" onClick={handleBackToList}>
                    Return to Inbox
                  </button>
                </div>
              ) : (
                <div className="support-ticket-workspace">
                  {/* Ticket Header & Metadata */}
                  <header className="support-ticket-view-header">
                    <div className="ticket-title-row">
                      <h2 className="ticket-view-title">
                        <span className="ticket-id-tag">#{activeTicket.reportId}</span>
                        <span className="ticket-title-sep">—</span>
                        <span>{activeTicket.title}</span>
                      </h2>

                      {/* Top Action / Mark Resolved */}
                      <button
                        type="button"
                        className={`ticket-resolve-btn ${activeTicket.status === 'resolved' || activeTicket.status === 'fixed' || activeTicket.status === 'completed' ? 'reopen' : 'resolve'}`}
                        onClick={handleToggleResolve}
                      >
                        <CheckCircle size={14} />
                        <span>
                          {activeTicket.status === 'resolved' || activeTicket.status === 'fixed' || activeTicket.status === 'completed'
                            ? 'Reopen Ticket'
                            : 'Mark as Resolved'}
                        </span>
                      </button>
                    </div>

                    {/* Badge Row */}
                    <div className="ticket-badge-ribbon">
                      {/* Type Pill */}
                      <span className={`ticket-type-pill ${activeTicket.type}`}>
                        {activeTicket.type === 'bug' ? 'Bug Report' : activeTicket.type === 'feature' ? 'Feature Request' : 'Help Request'}
                      </span>

                      {/* Category Pill */}
                      {activeTicket.category && (
                        <span className="ticket-category-pill">
                          {activeTicket.category}
                        </span>
                      )}

                      {/* Status Pill */}
                      {(() => {
                        const s = getTicketStatusConfig(activeTicket.type, activeTicket.status);
                        return (
                          <span className={`ticket-status-pill status-${s.color}`}>
                            <span className="status-dot-symbol">{s.dot}</span>
                            <span>{s.label}</span>
                          </span>
                        );
                      })()}

                      {/* Changelog Link Badge (if linked to release!) */}
                      {activeTicket.linkedChangelogVersion && (
                        <Link
                          to={`/changelog`}
                          className="ticket-changelog-pill"
                          title="View in release changelog"
                        >
                          <Sparkles size={12} className="text-amber-400" />
                          <span>
                            {activeTicket.type === 'feature' ? 'Completed in ' : 'Fixed in '}
                            <strong>{activeTicket.linkedChangelogVersion}</strong>
                          </span>
                          <span className="changelog-arrow">View Changelog →</span>
                        </Link>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="ticket-time-row">
                      <span>Created {new Date(activeTicket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="dot-sep">•</span>
                      <span>Last activity {getTimeAgo(activeTicket.lastActivityAt || activeTicket.updatedAt)}</span>
                    </div>
                  </header>

                  {/* Initial Details Accordion / Card */}
                  {(activeTicket.description || activeTicket.stepsToReproduce || activeTicket.useCase) && (
                    <div className="support-ticket-details-card">
                      <div className="ticket-details-summary">
                        <span className="details-label">Initial Request Summary</span>
                      </div>
                      <p className="ticket-description-body">{activeTicket.description}</p>

                      {activeTicket.useCase && (
                        <div className="ticket-field-detail">
                          <strong className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Why it would be useful:</strong>
                          <p className="text-xs text-gray-300 mt-0.5">{activeTicket.useCase}</p>
                        </div>
                      )}

                      {activeTicket.stepsToReproduce && (
                        <div className="ticket-field-detail">
                          <strong className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Steps to Reproduce:</strong>
                          <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-wrap">{activeTicket.stepsToReproduce}</p>
                        </div>
                      )}

                      {activeTicket.expectedBehavior && (
                        <div className="ticket-field-detail">
                          <strong className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Expected Behavior:</strong>
                          <p className="text-xs text-gray-300 mt-0.5">{activeTicket.expectedBehavior}</p>
                        </div>
                      )}

                      {activeTicket.attachments?.length > 0 && (
                        <div className="ticket-attachments-list">
                          <span className="text-[11px] text-[var(--text-muted)] font-semibold">Attached screenshots:</span>
                          <div className="flex items-center gap-2 mt-1">
                            {activeTicket.attachments.map((att, idx) => (
                              <a key={idx} href={att} target="_blank" rel="noreferrer" className="ticket-thumb-link">
                                <img src={att} alt={`Attachment ${idx + 1}`} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversation Stream */}
                  <div className="support-chat-stream-container">
                    <div className="support-chat-stream-header">
                      <MessageSquare size={15} className="text-[var(--accent)]" />
                      <span>Conversation Thread</span>
                    </div>

                    <div className="support-chat-thread">
                      {(Array.isArray(activeTicket.messages) && activeTicket.messages.length > 0
                        ? activeTicket.messages
                        : [{ senderRole: 'user', senderName: 'You', content: activeTicket.description, createdAt: activeTicket.createdAt }]
                      ).map((msg, idx) => {
                        const isStaff = msg.senderRole === 'admin';
                        return (
                          <div
                            key={idx}
                            className={`support-chat-bubble-wrap ${isStaff ? 'from-staff' : 'from-user'}`}
                          >
                            <div className="chat-bubble-header">
                              <div className="chat-bubble-author">
                                {isStaff ? (
                                  <>
                                    <ShieldCheck size={14} className="text-[var(--accent)] shrink-0" />
                                    <span className="author-name staff">{msg.senderName || 'Support Team'}</span>
                                    <span className="staff-tag">STAFF</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCircle2 size={14} className="text-gray-400 shrink-0" />
                                    <span className="author-name user">{msg.senderName || 'You'}</span>
                                  </>
                                )}
                              </div>
                              <span className="chat-bubble-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="chat-bubble-body">
                              {msg.content}
                            </div>

                            {msg.attachments?.length > 0 && (
                              <div className="chat-bubble-attachments">
                                {msg.attachments.map((att, aIdx) => (
                                  <a key={aIdx} href={att} target="_blank" rel="noreferrer" className="ticket-thumb-link">
                                    <img src={att} alt="Attachment" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Composer */}
                    <div className="support-chat-composer">
                      <textarea
                        className="support-composer-textarea"
                        placeholder="Write a reply..."
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />

                      {/* Reply Attachments previews */}
                      {replyAttachments.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 px-1">
                          {replyAttachments.map((att, idx) => (
                            <div key={idx} className="support-inline-thumb">
                              <img src={att} alt={`Reply attachment ${idx + 1}`} />
                              <button
                                type="button"
                                className="support-inline-remove-btn"
                                onClick={() => handleRemoveAttachment(idx, 'reply')}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="composer-actions-bar">
                        <div className="composer-left-actions">
                          <input
                            type="file"
                            id="reply-file-input"
                            multiple
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'reply')}
                          />
                          <button
                            type="button"
                            className="composer-attach-btn"
                            onClick={() => document.getElementById('reply-file-input')?.click()}
                            title="Attach screenshot (PNG, JPG, WEBP)"
                          >
                            <Upload size={14} />
                            <span>Attach Screenshot</span>
                          </button>
                          <span className="composer-hint">Ctrl+Enter to send</span>
                        </div>

                        <button
                          type="button"
                          className="support-submit-btn composer-send-btn"
                          disabled={(!replyText.trim() && replyAttachments.length === 0) || isSendingReply}
                          onClick={handleSendReply}
                        >
                          {isSendingReply ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          <span>Send Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ----------------------------------------------------------
               VIEW B: "YOUR SUPPORT REQUESTS" INBOX LIST
               ---------------------------------------------------------- */
            <div className="support-inbox-list-view">
              {/* Inbox Header & Metric Filter Pills */}
              <div className="support-inbox-header">
                <div>
                  <h2 className="support-inbox-title">Your Support Requests</h2>
                  <p className="support-inbox-subtitle">Track updates, responses, and resolutions from our team.</p>
                </div>

                {/* Filter Pills */}
                {user && (
                  <div className="support-filter-pills" role="tablist">
                    <button
                      type="button"
                      className={`filter-pill ${ticketFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setTicketFilter('all')}
                    >
                      <span>All</span>
                      <span className="pill-count">{counts.all}</span>
                    </button>
                    <button
                      type="button"
                      className={`filter-pill ${ticketFilter === 'open' ? 'active' : ''}`}
                      onClick={() => setTicketFilter('open')}
                    >
                      <span>Open</span>
                      <span className="pill-count amber">{counts.open}</span>
                    </button>
                    <button
                      type="button"
                      className={`filter-pill ${ticketFilter === 'waiting' ? 'active' : ''}`}
                      onClick={() => setTicketFilter('waiting')}
                    >
                      <span>Waiting for You</span>
                      <span className="pill-count accent">{counts.waiting}</span>
                    </button>
                    <button
                      type="button"
                      className={`filter-pill ${ticketFilter === 'resolved' ? 'active' : ''}`}
                      onClick={() => setTicketFilter('resolved')}
                    >
                      <span>Resolved</span>
                      <span className="pill-count emerald">{counts.resolved}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Not Logged In State */}
              {!user ? (
                <div className="support-auth-notice">
                  <div className="notice-icon-box">
                    <Lock size={26} className="text-[var(--accent)]" />
                  </div>
                  <div className="notice-text">
                    <h3>Sign In to View Your Support Requests</h3>
                    <p>Submissions created while signed in are saved to your account so you can track responses and reply to staff.</p>
                  </div>
                  <Link to="/login" className="support-submit-btn notice-login-btn">
                    Sign In
                  </Link>
                </div>
              ) : isLoadingTickets ? (
                <div className="support-loading-box">
                  <RefreshCw size={20} className="animate-spin text-[var(--accent)]" />
                  <span>Loading your requests...</span>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="support-empty-state">
                  <Ticket size={34} className="empty-icon" />
                  <h4>{ticketFilter === 'all' ? 'No Support Requests Found' : `No ${ticketFilter} requests found`}</h4>
                  <p>
                    {ticketFilter === 'all'
                      ? "You haven't submitted any bug reports, feature suggestions, or support requests yet."
                      : "There are no tickets matching this filter right now."}
                  </p>
                </div>
              ) : (
                /* Ticket List */
                <div className="support-tickets-stream">
                  {filteredTickets.map(ticket => {
                    const statusConfig = getTicketStatusConfig(ticket.type, ticket.status);
                    return (
                      <div
                        key={ticket._id}
                        className="support-ticket-card-row"
                        onClick={() => handleOpenTicket(ticket._id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ticket-card-main">
                          {/* Title & ID */}
                          <div className="ticket-card-title-row">
                            <span className="ticket-card-id">#{ticket.reportId}</span>
                            <span className="ticket-card-sep">—</span>
                            <h3 className="ticket-card-title">{ticket.title}</h3>
                          </div>

                          {/* Subtitle / Type & Category */}
                          <div className="ticket-card-meta-line">
                            <span className="ticket-type-label">
                              {ticket.type === 'bug' ? 'Bug Report' : ticket.type === 'feature' ? 'Feature Request' : 'Help Request'}
                            </span>
                            {ticket.category && (
                              <>
                                <span className="meta-dot">·</span>
                                <span className="ticket-category-label">{ticket.category}</span>
                              </>
                            )}
                            {ticket.linkedChangelogVersion && (
                              <>
                                <span className="meta-dot">·</span>
                                <span className="ticket-changelog-indicator">
                                  ✅ {ticket.type === 'feature' ? 'Completed in ' : 'Fixed in '} {ticket.linkedChangelogVersion}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Status badge & Last updated */}
                        <div className="ticket-card-status-col">
                          <span className={`ticket-status-pill status-${statusConfig.color}`}>
                            <span className="status-dot-symbol">{statusConfig.dot}</span>
                            <span>{statusConfig.label}</span>
                          </span>
                          <span className="ticket-time-ago">
                            Last updated {getTimeAgo(ticket.lastActivityAt || ticket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================
          MODAL 1: REPORT A BUG
          ============================================================ */}
      <Modal
        isOpen={activeModal === 'bug'}
        onClose={() => !isSubmittingBug && setActiveModal(null)}
        title="Report a Bug"
        subtitle="Found something that isn't working as expected? Let us know so we can fix it!"
        size="lg"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="support-cancel-btn"
              onClick={close}
              disabled={isSubmittingBug}
            >
              Cancel
            </button>
            <button
              type="button"
              className="support-submit-btn"
              disabled={isSubmittingBug || !bugForm.title.trim() || !bugForm.description.trim()}
              onClick={handleBugSubmit}
            >
              {isSubmittingBug ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Bug size={14} />
                  <span>Submit Bug Report</span>
                </>
              )}
            </button>
          </div>
        )}
      >
        <form onSubmit={handleBugSubmit} className="support-form-grid py-1">
          {/* Title */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Bug Title<span className="required-star">*</span></span>
              <span className="support-char-counter">{bugForm.title.length}/100</span>
            </div>
            <div className="support-input-wrap">
              <input
                type="text"
                className="support-text-input"
                placeholder="Brief summary of the issue..."
                value={bugForm.title}
                onChange={(e) => setBugForm(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Category</span>
            </div>
            <SelectField
              value={bugForm.category}
              onChange={(val) => setBugForm(prev => ({ ...prev, category: val }))}
              options={BUG_CATEGORIES}
              startIcon={<LayoutGrid size={16} />}
              fullWidth
            />
          </div>

          {/* Description */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>What happened?<span className="required-star">*</span></span>
              <span className="support-char-counter">{bugForm.description.length}/1000</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="Describe the bug in detail..."
              value={bugForm.description}
              onChange={(e) => setBugForm(prev => ({ ...prev, description: e.target.value.slice(0, 1000) }))}
              rows={4}
              required
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Steps to Reproduce (Optional)</span>
              <span className="support-char-counter">{bugForm.stepsToReproduce.length}/1000</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="1. Go to Poké Radar&#10;2. Click on filters&#10;3. Select Generation 3..."
              value={bugForm.stepsToReproduce}
              onChange={(e) => setBugForm(prev => ({ ...prev, stepsToReproduce: e.target.value.slice(0, 1000) }))}
              rows={3}
            />
          </div>

          {/* Expected Behavior */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Expected Behavior (Optional)</span>
              <span className="support-char-counter">{bugForm.expectedBehavior.length}/500</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="What did you expect to happen instead?"
              value={bugForm.expectedBehavior}
              onChange={(e) => setBugForm(prev => ({ ...prev, expectedBehavior: e.target.value.slice(0, 500) }))}
              rows={2}
            />
          </div>

          {/* Attachments */}
          <AttachmentUploadBox
            inputId="modal-bug-attachment-input"
            attachments={bugForm.attachments}
            onUpload={(e) => handleFileUpload(e, 'bug')}
            onRemove={(idx) => handleRemoveAttachment(idx, 'bug')}
          />

          {/* Collapsible Diagnostics (Not overly prominent) */}
          <div className="support-collapsible-diagnostics">
            <button
              type="button"
              className="diagnostics-toggle-btn"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
            >
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Info size={14} />
                <span>Automatic Diagnostics Captured ({techInfo.os}, {techInfo.browser})</span>
              </div>
              {showDiagnostics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDiagnostics && (
              <div className="diagnostics-expanded-card">
                <span className="support-tech-tag"><strong>Browser:</strong> {techInfo.browser}</span>
                <span className="support-tech-tag"><strong>OS:</strong> {techInfo.os}</span>
                <span className="support-tech-tag"><strong>Screen:</strong> {techInfo.screen}</span>
                <span className="support-tech-tag"><strong>Version:</strong> {techInfo.version}</span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ============================================================
          MODAL 2: REQUEST A FEATURE
          ============================================================ */}
      <Modal
        isOpen={activeModal === 'feature'}
        onClose={() => !isSubmittingFeature && setActiveModal(null)}
        title="Request a Feature"
        subtitle="Have an idea that would make Ultimate Dex Tracker even better? We'd love to hear it!"
        size="lg"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="support-cancel-btn"
              onClick={close}
              disabled={isSubmittingFeature}
            >
              Cancel
            </button>
            <button
              type="button"
              className="support-submit-btn"
              disabled={isSubmittingFeature || !featureForm.title.trim() || !featureForm.description.trim()}
              onClick={handleFeatureSubmit}
            >
              {isSubmittingFeature ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Submit Feature Request</span>
                </>
              )}
            </button>
          </div>
        )}
      >
        <form onSubmit={handleFeatureSubmit} className="support-form-grid py-1">
          {/* Title */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Feature Title<span className="required-star">*</span></span>
              <span className="support-char-counter">{featureForm.title.length}/100</span>
            </div>
            <div className="support-input-wrap">
              <input
                type="text"
                className="support-text-input"
                placeholder="Brief summary of your suggestion..."
                value={featureForm.title}
                onChange={(e) => setFeatureForm(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Category</span>
            </div>
            <SelectField
              value={featureForm.category}
              onChange={(val) => setFeatureForm(prev => ({ ...prev, category: val }))}
              options={FEATURE_CATEGORIES}
              startIcon={<LayoutGrid size={16} />}
              fullWidth
            />
          </div>

          {/* Description */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Description<span className="required-star">*</span></span>
              <span className="support-char-counter">{featureForm.description.length}/1000</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="Explain the feature you would like to see added..."
              value={featureForm.description}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value.slice(0, 1000) }))}
              rows={4}
              required
            />
          </div>

          {/* Why would this be useful? */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Why would this be useful? (Optional)</span>
              <span className="support-char-counter">{featureForm.useCase.length}/500</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="How would this benefit you or the wider community?"
              value={featureForm.useCase}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, useCase: e.target.value.slice(0, 500) }))}
              rows={3}
            />
          </div>

          {/* Attachments */}
          <AttachmentUploadBox
            inputId="modal-feature-attachment-input"
            attachments={featureForm.attachments}
            onUpload={(e) => handleFileUpload(e, 'feature')}
            onRemove={(idx) => handleRemoveAttachment(idx, 'feature')}
            hintText="Mockups, reference screenshots, or concepts (max 10MB each)"
          />
        </form>
      </Modal>

      {/* ============================================================
          MODAL 3: CONTACT SUPPORT / GET HELP
          ============================================================ */}
      <Modal
        isOpen={activeModal === 'help'}
        onClose={() => !isSubmittingHelp && setActiveModal(null)}
        title="Contact Support"
        subtitle="Need assistance with payments, account settings, or membership? We're here to help."
        size="lg"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="support-cancel-btn"
              onClick={close}
              disabled={isSubmittingHelp}
            >
              Cancel
            </button>
            <button
              type="button"
              className="support-submit-btn"
              disabled={isSubmittingHelp || !helpForm.title.trim() || !helpForm.description.trim()}
              onClick={handleHelpSubmit}
            >
              {isSubmittingHelp ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        )}
      >
        <form onSubmit={handleHelpSubmit} className="support-form-grid py-1">
          {/* Subject */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Subject<span className="required-star">*</span></span>
              <span className="support-char-counter">{helpForm.title.length}/100</span>
            </div>
            <div className="support-input-wrap">
              <input
                type="text"
                className="support-text-input"
                placeholder="Brief summary of your inquiry (e.g. Membership not activating)..."
                value={helpForm.title}
                onChange={(e) => setHelpForm(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Category<span className="required-star">*</span></span>
            </div>
            <SelectField
              value={helpForm.category}
              onChange={(val) => setHelpForm(prev => ({ ...prev, category: val }))}
              options={HELP_CATEGORIES}
              startIcon={<LayoutGrid size={16} />}
              fullWidth
            />
          </div>

          {/* Description */}
          <div className="support-field-group">
            <div className="support-field-label-row">
              <span>Description<span className="required-star">*</span></span>
              <span className="support-char-counter">{helpForm.description.length}/1000</span>
            </div>
            <textarea
              className="support-textarea"
              placeholder="Provide full details of your request. If related to payments, mention when you subscribed so we can verify your Stripe transaction..."
              value={helpForm.description}
              onChange={(e) => setHelpForm(prev => ({ ...prev, description: e.target.value.slice(0, 1000) }))}
              rows={4}
              required
            />
          </div>

          {/* Attachments */}
          <AttachmentUploadBox
            inputId="modal-help-attachment-input"
            attachments={helpForm.attachments}
            onUpload={(e) => handleFileUpload(e, 'help')}
            onRemove={(idx) => handleRemoveAttachment(idx, 'help')}
            hintText="Receipts or screenshots (max 10MB each)"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Support;
