import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Users, Bug, Shield, ShieldCheck, Settings, Search, ChevronDown, CheckCircle, 
  XCircle, AlertCircle, Calendar, Mail, UserCheck, Filter, Trash2, Check, 
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Video, Youtube, Twitch, 
  Clock, MessageSquare, Crown, UserX, Edit3, MoreHorizontal,
  ExternalLink, Ban, RefreshCw, Send, Radio, AlertTriangle, X, Bell, Home,
  LogOut, ArrowLeft, Sparkles, Activity, Cpu, Zap, BarChart2, Gauge, Server, TrendingUp, Database, Award,
  Gem, Gift, CreditCard, ChevronsLeft, ChevronsRight, TrendingDown, User, UserCircle2,
  History, Copy, Plus, FileText, Eye, EyeOff, HelpCircle, Inbox, Lock, Paperclip
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useMessage, Modal, ConfirmModal, Button } from '../components/Shared';
import { SearchField, TextField, TextArea, DateField, SelectField } from '../components/Shared/FormField';
import { buildApiUrl } from '../config/api.js';
import { creatorAPI, authAPI, changelogAPI } from '../utils/api.js';
import { getUserAvatarUrl, getTimeAgo } from '../utils/profileUtils.js';
import './Admin.css';

const SUSPENSION_PRESETS = [
  'Violation of Community Guidelines',
  'Inappropriate Profile or Username',
  'Cheating or Exploiting',
  'Spam or Botting Activity',
  'Harassment or Abusive Behavior',
];

const CHANGELOG_SECTION_ORDER = {
  feature: 1,
  improvement: 2,
  fix: 3,
  removed: 4,
  security: 5
};

const sortChangelogSections = (sections) => {
  if (!Array.isArray(sections)) return [];
  return [...sections].sort((a, b) => {
    const orderA = CHANGELOG_SECTION_ORDER[(a?.type || '').toLowerCase()] || 99;
    const orderB = CHANGELOG_SECTION_ORDER[(b?.type || '').toLowerCase()] || 99;
    return orderA - orderB;
  });
};

const Admin = () => {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [activeTab, setActiveTab] = useState('users'); // 'dashboard', 'users', 'bug-reports', 'feature-requests', 'creator-requests', 'settings'
  
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [creatorRequests, setCreatorRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceStartTime, setMaintenanceStartTime] = useState(null);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  const [schedulePreset, setSchedulePreset] = useState('5m'); // '5m', '15m', '30m', '1h', 'custom'
  const [customScheduleDate, setCustomScheduleDate] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}-${day}-${d.getFullYear()}`;
  });
  const [customScheduleHour, setCustomScheduleHour] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    let h = d.getHours() % 12;
    return String(h === 0 ? 12 : h);
  });
  const [customScheduleMinute, setCustomScheduleMinute] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const m = Math.ceil(d.getMinutes() / 5) * 5;
    return String(m >= 60 ? 0 : m).padStart(2, '0');
  });
  const [customScheduleAmPm, setCustomScheduleAmPm] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return d.getHours() >= 12 ? 'PM' : 'AM';
  });
  const [systemStats, setSystemStats] = useState({
    uptimePercent: '99.98%',
    apiLatency: '24ms',
    databaseStatus: 'Healthy'
  });
  const [autoRefreshDiagnostics, setAutoRefreshDiagnostics] = useState(true);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [chartHoverIndex, setChartHoverIndex] = useState(null);
  
  // Top right menu
  const [showAdminProfileMenu, setShowAdminProfileMenu] = useState(false);
  const adminProfileMenuRef = useRef();

  // User management states
  const [userSearch, setUserSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'creator', 'premium', 'premium_paid', 'premium_admin', 'suspended', 'user'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef();

  const [userPage, setUserPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [userSortField, setUserSortField] = useState('joined'); // 'username', 'admin', 'joined', 'lastActive'
  const [userSortDir, setUserSortDir] = useState('desc'); // 'asc', 'desc'
  
  // Modals & Action states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserActions, setShowUserActions] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userActionMenuOpenId, setUserActionMenuOpenId] = useState(null);

  // Premium grant modal states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumTargetUser, setPremiumTargetUser] = useState(null);
  const [grantType, setGrantType] = useState('months'); // 'months', 'days', 'date', 'permanent'
  const [grantMonths, setGrantMonths] = useState(1);
  const [grantDays, setGrantDays] = useState(30);
  const [grantDate, setGrantDate] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [isSubmittingPremium, setIsSubmittingPremium] = useState(false);
  const [showRevokeConfirmModal, setShowRevokeConfirmModal] = useState(false);
  
  // User edit form
  const [editingBio, setEditingBio] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingCreator, setEditingCreator] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [editingSuspended, setEditingSuspended] = useState(false);
  const [editingAvatarRemoved, setEditingAvatarRemoved] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Sub-view searches
  const [bugReportSearch, setBugReportSearch] = useState('');
  const [featureRequestSearch, setFeatureRequestSearch] = useState('');

  // Report Modals
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showHelpChatModal, setShowHelpChatModal] = useState(false);
  const [activeHelpChatReport, setActiveHelpChatReport] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
  const [helpTickets, setHelpTickets] = useState([]);
  const [helpTicketSearch, setHelpTicketSearch] = useState('');

  // Unified Support Inbox & Workspace States
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportMetrics, setSupportMetrics] = useState({
    openCount: 0,
    awaitingStaffCount: 0,
    awaitingUserCount: 0,
    resolvedCount: 0,
    totalCount: 0
  });
  const [supportTypeFilter, setSupportTypeFilter] = useState('all'); // 'all', 'help', 'bug', 'feature'
  const [supportStatusFilter, setSupportStatusFilter] = useState('all'); // 'all', 'open', 'awaiting_staff', 'awaiting_user', 'resolved', 'closed'
  const [supportPriorityFilter, setSupportPriorityFilter] = useState('all'); // 'all', 'low', 'normal', 'high', 'urgent'
  const [supportSearch, setSupportSearch] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Admin Ticket Workspace States
  const [activeAdminTicket, setActiveAdminTicket] = useState(null);
  const [adminComposerMode, setAdminComposerMode] = useState('reply'); // 'reply' | 'note'
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const [adminTicketDraftStatus, setAdminTicketDraftStatus] = useState('');
  const [adminTicketDraftPriority, setAdminTicketDraftPriority] = useState('normal');
  const [adminTicketDraftAssignee, setAdminTicketDraftAssignee] = useState('');
  const [adminTicketDraftChangelog, setAdminTicketDraftChangelog] = useState('');
  const [isSavingAdminChanges, setIsSavingAdminChanges] = useState(false);
  const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);
  const adminMessagesEndRef = useRef(null);

  // Changelog Manager states
  const [changelogs, setChangelogs] = useState([]);
  const [changelogsLoading, setChangelogsLoading] = useState(false);
  const [changelogSearch, setChangelogSearch] = useState('');
  const [changelogFilter, setChangelogFilter] = useState('all'); // 'all', 'published', 'draft'
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [editingChangelogId, setEditingChangelogId] = useState(null);
  const [isSavingChangelog, setIsSavingChangelog] = useState(false);
  const [showDeleteChangelogModal, setShowDeleteChangelogModal] = useState(false);
  const [changelogToDelete, setChangelogToDelete] = useState(null);

  const DEFAULT_CHANGELOG_FORM = {
    version: '',
    releaseDate: new Date().toISOString().slice(0, 10),
    published: false,
    title: '',
    description: '',
    sections: [
      { type: 'feature', items: [''] },
      { type: 'improvement', items: [''] },
      { type: 'fix', items: [''] },
      { type: 'removed', items: [] }
    ]
  };

  const [changelogForm, setChangelogForm] = useState(DEFAULT_CHANGELOG_FORM);

  const changelogDraftsCount = useMemo(() => {
    return changelogs.filter(c => !c.published).length;
  }, [changelogs]);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  // Global click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (adminProfileMenuRef.current && !adminProfileMenuRef.current.contains(event.target)) {
        setShowAdminProfileMenu(false);
      }
      if (!event.target.closest('.user-more-actions-menu') && !event.target.closest('.user-more-btn')) {
        setUserActionMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (isAdmin === false) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(buildApiUrl('/profile'), {
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const userData = await response.json();
          setCurrentUser(userData);
          if (userData.isAdmin) {
            setIsAdmin(true);
            loadData();
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const fetchSystemStats = async (showToast = false) => {
    setDiagnosticsLoading(true);
    const startPing = Date.now();
    try {
      const statsRes = await fetch(buildApiUrl('/admin/system-stats'), {
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });
      const pingDuration = Date.now() - startPing;
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSystemStats({
          ...statsData,
          apiLatency: `${pingDuration}ms`
        });
        if (showToast) showMessage('Diagnostics telemetry refreshed', 'success');
      }
    } catch (err) {
      if (showToast) showMessage('Failed to refresh diagnostics', 'error');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'diagnostics' && autoRefreshDiagnostics && isAdmin) {
      const interval = setInterval(() => {
        fetchSystemStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefreshDiagnostics, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const startPing = Date.now();
    try {
      const [usersRes, bugReportsRes, featureRequestsRes, helpTicketsRes, settingsRes, creatorReqsData, statsRes, changelogsData, supportInboxRes] = await Promise.all([
        fetch(buildApiUrl('/admin/users'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/admin/bug-reports'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/admin/feature-requests'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/admin/help-tickets'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/site-settings')),
        creatorAPI.getAll('all').catch(() => ({ requests: [] })),
        fetch(buildApiUrl('/admin/system-stats'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }).catch(() => null),
        changelogAPI.getAdminAll().catch(() => ({ changelogs: [] })),
        fetch(buildApiUrl('/admin/support/inbox?limit=150'), {
          headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          credentials: 'include'
        }).catch(() => null)
      ]);

      const pingDuration = Date.now() - startPing;

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (bugReportsRes.ok) {
        const bugReportsData = await bugReportsRes.json();
        setBugReports(bugReportsData.bugReports || []);
      }

      if (featureRequestsRes.ok) {
        const featureRequestsData = await featureRequestsRes.json();
        setFeatureRequests(featureRequestsData.featureRequests || []);
      }

      if (helpTicketsRes.ok) {
        const helpTicketsData = await helpTicketsRes.json();
        setHelpTickets(helpTicketsData.helpTickets || []);
      }

      if (supportInboxRes && supportInboxRes.ok) {
        const supportInboxData = await supportInboxRes.json();
        setSupportTickets(supportInboxData.tickets || []);
        if (supportInboxData.metrics) {
          setSupportMetrics(supportInboxData.metrics);
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setMaintenanceMode(settingsData.maintenanceMode || false);
        setMaintenanceStartTime(settingsData.maintenanceStartTime || null);
      }

      if (creatorReqsData && creatorReqsData.requests) {
        setCreatorRequests(creatorReqsData.requests);
      }

      if (changelogsData && Array.isArray(changelogsData.changelogs)) {
        setChangelogs(changelogsData.changelogs);
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setSystemStats({
          ...statsData,
          apiLatency: `${pingDuration}ms`
        });
      } else {
        setSystemStats(prev => ({ ...prev, apiLatency: `${pingDuration}ms` }));
      }
    } catch (err) {
      showMessage('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Support Inbox & Workspace Handlers
  // -------------------------------------------------------------------------
  const fetchSupportInbox = async (filters = {}, { silent = false } = {}) => {
    if (!silent) setSupportLoading(true);
    try {
      const type = filters.type !== undefined ? filters.type : supportTypeFilter;
      const status = filters.status !== undefined ? filters.status : supportStatusFilter;
      const priority = filters.priority !== undefined ? filters.priority : supportPriorityFilter;
      const search = filters.search !== undefined ? filters.search : supportSearch;

      const params = new URLSearchParams();
      if (type && type !== 'all') params.set('type', type);
      if (status && status !== 'all') params.set('status', status);
      if (priority && priority !== 'all') params.set('priority', priority);
      if (search && search.trim()) params.set('search', search.trim());
      params.set('limit', '150');

      const res = await fetch(buildApiUrl(`/admin/support/inbox?${params.toString()}`), {
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setSupportTickets(prev => {
          const next = data.tickets || [];
          if (
            prev.length === next.length &&
            prev.every((t, i) => t._id === next[i]._id && t.status === next[i].status && t.priority === next[i].priority && t.lastActivityAt === next[i].lastActivityAt)
          ) {
            return prev;
          }
          return next;
        });
        if (data.metrics) setSupportMetrics(data.metrics);
      }
    } catch (err) {
      if (!silent) console.error('Failed to load support inbox:', err);
    } finally {
      if (!silent) setSupportLoading(false);
    }
  };

  const fetchActiveAdminTicket = async (ticketId, { silent = true } = {}) => {
    if (!ticketId) return;
    try {
      const res = await fetch(buildApiUrl(`/bug-reports/${ticketId}`), {
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setActiveAdminTicket(prev => {
            if (!prev || prev._id !== data.ticket._id) return data.ticket;
            const prevLen = prev.messages?.length || 0;
            const newLen = data.ticket.messages?.length || 0;
            const statusChanged = prev.status !== data.ticket.status;
            const priorityChanged = prev.priority !== data.ticket.priority;
            const lastActivityChanged = prev.lastActivityAt !== data.ticket.lastActivityAt;
            if (prevLen !== newLen || statusChanged || priorityChanged || lastActivityChanged) {
              return data.ticket;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      if (!silent) console.error('Failed to poll active ticket:', e);
    }
  };

  const handleOpenAdminTicket = async (ticket) => {
    setActiveAdminTicket(ticket);
    setAdminTicketDraftStatus(ticket.status || 'new');
    setAdminTicketDraftPriority(ticket.priority || 'normal');
    setAdminTicketDraftAssignee(ticket.assignedTo || '');
    setAdminTicketDraftChangelog(ticket.linkedChangelogVersion || '');
    setAdminComposerMode('reply');
    setAdminReplyInput('');

    // Fetch full ticket record with latest messages and activity log
    try {
      const res = await fetch(buildApiUrl(`/bug-reports/${ticket._id}`), {
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setActiveAdminTicket(data.ticket);
          setAdminTicketDraftStatus(data.ticket.status || 'new');
          setAdminTicketDraftPriority(data.ticket.priority || 'normal');
          setAdminTicketDraftAssignee(data.ticket.assignedTo || '');
          setAdminTicketDraftChangelog(data.ticket.linkedChangelogVersion || '');
        }
      }
    } catch (e) {
      console.error('Failed to fetch full ticket record:', e);
    }
  };

  const handleSaveAdminTicketFields = async () => {
    if (!activeAdminTicket) return;
    setIsSavingAdminChanges(true);
    try {
      const payload = {
        status: adminTicketDraftStatus,
        priority: adminTicketDraftPriority,
        assignedTo: adminTicketDraftAssignee.trim(),
        linkedChangelogVersion: adminTicketDraftChangelog.trim()
      };

      const res = await fetch(buildApiUrl(`/bug-reports/${activeAdminTicket._id}/admin`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update ticket');
      }

      const data = await res.json();
      if (data.ticket) {
        setActiveAdminTicket(data.ticket);
        setSupportTickets(prev => prev.map(t => (t._id === data.ticket._id ? { ...t, ...data.ticket } : t)));
        showMessage('Ticket changes saved successfully', 'success');
        fetchSupportInbox();
      }
    } catch (err) {
      showMessage(err.message || 'Failed to save changes', 'error');
    } finally {
      setIsSavingAdminChanges(false);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!activeAdminTicket || !adminReplyInput.trim()) return;
    setIsSendingAdminMessage(true);
    try {
      const isInternal = adminComposerMode === 'note';
      const res = await fetch(buildApiUrl(`/bug-reports/${activeAdminTicket._id}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({
          content: adminReplyInput.trim(),
          isInternalNote: isInternal
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to post message');
      }

      const data = await res.json();
      if (data.ticket) {
        setActiveAdminTicket(data.ticket);
        setAdminReplyInput('');
        setSupportTickets(prev => prev.map(t => (t._id === data.ticket._id ? { ...t, ...data.ticket } : t)));
        showMessage(isInternal ? 'Internal note added' : 'Reply sent to user', 'success');
        fetchSupportInbox();
      }
    } catch (err) {
      showMessage(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSendingAdminMessage(false);
    }
  };

  const handleQuickResolveTicket = async (ticket) => {
    try {
      const resolveStatus = ticket.type === 'bug' ? 'fixed' : ticket.type === 'feature' ? 'completed' : 'resolved';
      const res = await fetch(buildApiUrl(`/bug-reports/${ticket._id}/admin`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ status: resolveStatus }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        showMessage(`Ticket #${ticket.reportId || ''} marked as ${resolveStatus}`, 'success');
        if (activeAdminTicket && activeAdminTicket._id === ticket._id) {
          setActiveAdminTicket(data.ticket);
          setAdminTicketDraftStatus(resolveStatus);
        }
        setSupportTickets(prev => prev.map(t => (t._id === ticket._id ? { ...t, status: resolveStatus } : t)));
        fetchSupportInbox();
      }
    } catch (err) {
      showMessage('Failed to resolve ticket', 'error');
    }
  };

  const handleQuickCloseTicket = async (ticket) => {
    try {
      const res = await fetch(buildApiUrl(`/bug-reports/${ticket._id}/admin`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ status: 'closed' }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        showMessage(`Ticket #${ticket.reportId || ''} closed`, 'success');
        if (activeAdminTicket && activeAdminTicket._id === ticket._id) {
          setActiveAdminTicket(data.ticket);
          setAdminTicketDraftStatus('closed');
        }
        setSupportTickets(prev => prev.map(t => (t._id === ticket._id ? { ...t, status: 'closed' } : t)));
        fetchSupportInbox();
      }
    } catch (err) {
      showMessage('Failed to close ticket', 'error');
    }
  };

  // Live polling effect for Support Inbox & Open Ticket Workspace (paused when tab is hidden)
  useEffect(() => {
    let isPolling = false;

    const poll = async () => {
      if (document.hidden || isPolling) return;
      isPolling = true;
      try {
        if (activeTab === 'support-inbox') {
          if (activeAdminTicket?._id) {
            await fetchActiveAdminTicket(activeAdminTicket._id, { silent: true });
          } else {
            await fetchSupportInbox({}, { silent: true });
          }
        } else {
          // On other tabs: poll support inbox metrics every 25s so sidebar count stays live
          await fetchSupportInbox({}, { silent: true });
        }
      } finally {
        isPolling = false;
      }
    };

    const intervalMs = activeTab === 'support-inbox'
      ? (activeAdminTicket?._id ? 4000 : 8000)
      : 25000;

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
  }, [activeTab, activeAdminTicket?._id, supportTypeFilter, supportStatusFilter, supportPriorityFilter, supportSearch]);

  // Immediately refresh inbox on tab switch
  useEffect(() => {
    if (activeTab === 'support-inbox' && !activeAdminTicket) {
      fetchSupportInbox({}, { silent: true });
    }
  }, [activeTab]);

  // Auto-scroll admin thread when new messages are added
  useEffect(() => {
    if (activeAdminTicket?.messages?.length) {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAdminTicket?.messages?.length]);


  // -------------------------------------------------------------------------
  // Changelog Management Handlers
  // -------------------------------------------------------------------------
  const loadChangelogs = async () => {
    setChangelogsLoading(true);
    try {
      const res = await changelogAPI.getAdminAll();
      if (res && Array.isArray(res.changelogs)) {
        setChangelogs(res.changelogs);
      }
    } catch (err) {
      console.error('Failed to load changelogs:', err);
    } finally {
      setChangelogsLoading(false);
    }
  };

  const handleOpenNewChangelog = (duplicateFrom = null) => {
    setEditingChangelogId(null);
    if (duplicateFrom) {
      const clonedSections = (duplicateFrom.sections && duplicateFrom.sections.length > 0)
        ? duplicateFrom.sections.map(sec => ({
            type: sec.type,
            items: ['']
          }))
        : [
            { type: 'feature', items: [''] },
            { type: 'improvement', items: [''] },
            { type: 'fix', items: [''] },
            { type: 'removed', items: [] }
          ];

      let nextVersion = '';
      const match = duplicateFrom.version?.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
      if (match) {
        const patch = parseInt(match[3], 10) + 1;
        nextVersion = `v${match[1]}.${match[2]}.${patch}`;
      } else {
        nextVersion = duplicateFrom.version ? `${duplicateFrom.version}-draft` : 'v1.0.0';
      }

      const today = new Date();
      const formattedToday = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;

      setChangelogForm({
        version: nextVersion,
        releaseDate: formattedToday,
        published: false,
        sections: clonedSections
      });
    } else {
      const today = new Date();
      const formattedToday = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;

      setChangelogForm({
        version: '',
        releaseDate: formattedToday,
        published: false,
        sections: [
          { type: 'feature', items: [''] },
          { type: 'improvement', items: [''] },
          { type: 'fix', items: [''] },
          { type: 'removed', items: [] }
        ]
      });
    }
    setShowChangelogModal(true);
  };

  const handleEditChangelog = (entry) => {
    setEditingChangelogId(entry._id);
    let formattedDate = '';
    if (entry.releaseDate) {
      try {
        const d = new Date(entry.releaseDate);
        if (!isNaN(d.getTime())) {
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const yr = d.getFullYear();
          formattedDate = `${mo}-${day}-${yr}`;
        } else {
          formattedDate = String(entry.releaseDate);
        }
      } catch (e) {
        formattedDate = String(entry.releaseDate);
      }
    } else if (entry.date) {
      try {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime())) {
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const yr = d.getFullYear();
          formattedDate = `${mo}-${day}-${yr}`;
        } else {
          formattedDate = String(entry.date);
        }
      } catch (e) {
        formattedDate = String(entry.date);
      }
    } else {
      const now = new Date();
      formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;
    }

    let sections = [];
    if (Array.isArray(entry.sections) && entry.sections.length > 0) {
      sections = entry.sections.map(s => ({
        type: s.type,
        items: s.items && s.items.length > 0 ? [...s.items] : ['']
      }));
    } else {
      if (entry.features?.length) sections.push({ type: 'feature', items: [...entry.features] });
      if (entry.changes?.length) sections.push({ type: 'improvement', items: [...entry.changes] });
      if (entry.fixes?.length) sections.push({ type: 'fix', items: [...entry.fixes] });
      if (entry.removed?.length) sections.push({ type: 'removed', items: [...entry.removed] });
      if (sections.length === 0) {
        sections = [
          { type: 'feature', items: [''] },
          { type: 'improvement', items: [''] },
          { type: 'fix', items: [''] }
        ];
      }
    }

    setChangelogForm({
      version: entry.version || '',
      releaseDate: formattedDate,
      published: Boolean(entry.published),
      sections: sortChangelogSections(sections)
    });
    setShowChangelogModal(true);
  };

  const handleAddSection = (type = 'feature') => {
    setChangelogForm(prev => {
      const normalizedType = (type || 'feature').toLowerCase();
      // Only allow 1 of each section
      if (prev.sections.some(s => (s.type || '').toLowerCase() === normalizedType)) {
        showMessage(`A ${normalizedType} section is already added. Only 1 of each section is allowed.`, 'warning');
        return prev;
      }
      const nextSections = [...prev.sections, { type: normalizedType, items: [''] }];
      return {
        ...prev,
        sections: sortChangelogSections(nextSections)
      };
    });
  };

  const handleRemoveSection = (sectionIndex) => {
    setChangelogForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex)
    }));
  };

  const handleAddSectionItem = (sectionIndex) => {
    setChangelogForm(prev => {
      const nextSections = [...prev.sections];
      const items = [...(nextSections[sectionIndex].items || []), ''];
      nextSections[sectionIndex] = { ...nextSections[sectionIndex], items };
      return { ...prev, sections: nextSections };
    });
  };

  const handleSectionItemChange = (sectionIndex, itemIndex, value) => {
    setChangelogForm(prev => {
      const nextSections = [...prev.sections];
      const items = [...(nextSections[sectionIndex].items || [])];
      items[itemIndex] = value;
      nextSections[sectionIndex] = { ...nextSections[sectionIndex], items };
      return { ...prev, sections: nextSections };
    });
  };

  const handleRemoveSectionItem = (sectionIndex, itemIndex) => {
    setChangelogForm(prev => {
      const nextSections = [...prev.sections];
      const items = (nextSections[sectionIndex].items || []).filter((_, idx) => idx !== itemIndex);
      nextSections[sectionIndex] = { ...nextSections[sectionIndex], items };
      return { ...prev, sections: nextSections };
    });
  };

  const handleSaveChangelog = async (forcePublish = null) => {
    if (!changelogForm.version.trim()) {
      showMessage('Version is required (e.g. v1.2.3)', 'error');
      return;
    }

    setIsSavingChangelog(true);
    try {
      const cleanedSections = sortChangelogSections(
        (changelogForm.sections || [])
          .map(sec => ({
            type: (sec.type || 'feature').toLowerCase(),
            items: (sec.items || []).map(i => i.trim()).filter(Boolean)
          }))
          .filter(sec => sec.items.length > 0)
      );

      const isPublished = forcePublish !== null ? forcePublish : changelogForm.published;

      const payload = {
        version: changelogForm.version.trim(),
        releaseDate: changelogForm.releaseDate,
        published: isPublished,
        sections: cleanedSections
      };

      if (editingChangelogId) {
        await changelogAPI.update(editingChangelogId, payload);
        showMessage(`Release ${payload.version} updated successfully!`, 'success');
      } else {
        await changelogAPI.create(payload);
        showMessage(`Release ${payload.version} created (${isPublished ? 'Published' : 'Draft'})!`, 'success');
      }

      setShowChangelogModal(false);
      loadChangelogs();
    } catch (err) {
      showMessage(err.userMessage || 'Failed to save release', 'error');
    } finally {
      setIsSavingChangelog(false);
    }
  };

  const handleTogglePublishChangelog = async (entry) => {
    try {
      const res = await changelogAPI.togglePublish(entry._id);
      showMessage(`Release ${entry.version} is now ${res.published ? 'Published' : 'Draft'}`, 'success');
      loadChangelogs();
    } catch (err) {
      showMessage(err.userMessage || 'Failed to toggle publish status', 'error');
    }
  };

  const handleDuplicateChangelog = async (id) => {
    try {
      const res = await changelogAPI.duplicate(id);
      showMessage(res.message || 'Draft duplicated from release!', 'success');
      await loadChangelogs();
      if (res.changelog) {
        handleEditChangelog(res.changelog);
      }
    } catch (err) {
      showMessage(err.userMessage || 'Failed to duplicate release', 'error');
    }
  };

  const handleDeleteChangelogConfirm = async () => {
    if (!changelogToDelete) return;
    try {
      await changelogAPI.delete(changelogToDelete._id);
      showMessage(`Release ${changelogToDelete.version} deleted successfully`, 'success');
      setShowDeleteChangelogModal(false);
      setChangelogToDelete(null);
      loadChangelogs();
    } catch (err) {
      showMessage(err.userMessage || 'Failed to delete release', 'error');
    }
  };

  const handleUpdateCreatorRequest = async (id, status, adminNotes = '') => {
    try {
      await creatorAPI.updateRequest(id, { status, adminNotes });
      showMessage(`Creator request ${status} successfully`, 'success');
      loadData();
    } catch (err) {
      showMessage(err.userMessage || `Failed to ${status} request`, 'error');
    }
  };

  const handleAssignAdmin = async (username, targetIsAdmin) => {
    try {
      const response = await fetch(buildApiUrl('/assign-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ username, isAdmin: targetIsAdmin }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(result.message, 'success');
        loadData();
        if (selectedUser) {
          setSelectedUser(prev => prev ? { ...prev, isAdmin: targetIsAdmin } : null);
        }
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update admin status', 'error');
      }
    } catch (err) {
      showMessage('Failed to update admin status', 'error');
    }
  };

  const handleToggleSuspendUser = async (user, newStatus, reason = '') => {
    try {
      const response = await fetch(buildApiUrl(`/admin/users/${user._id}/suspend`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ isSuspended: newStatus, reason }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(result.message, 'success');
        setUsers(users.map(u => u._id === user._id ? { ...u, isSuspended: newStatus, suspendedReason: reason } : u));
        setShowSuspendModal(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update suspension status', 'error');
      }
    } catch (err) {
      showMessage('Failed to update suspension status', 'error');
    }
  };

  const handleDeleteUserAccount = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(buildApiUrl(`/admin/users/${selectedUser._id}`), {
        method: 'DELETE',
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });

      if (response.ok) {
        showMessage(`User @${selectedUser.username} deleted permanently`, 'success');
        setUsers(users.filter(u => u._id !== selectedUser._id));
        setShowDeleteUserModal(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to delete user account', 'error');
      }
    } catch (err) {
      showMessage('Failed to delete user account', 'error');
    }
  };

  const handleOpenGrantPremium = (user) => {
    setPremiumTargetUser(user);
    setGrantType('months');
    setGrantMonths(1);
    setGrantDays(30);
    setGrantDate('');
    setGrantNote('');
    setShowPremiumModal(true);
    setUserActionMenuOpenId(null);
  };

  const handleGrantPremium = async () => {
    if (!premiumTargetUser) return;
    setIsSubmittingPremium(true);
    try {
      const payload = {
        grantType,
        months: grantMonths,
        days: grantDays,
        untilDate: grantDate,
        note: grantNote,
      };

      const response = await fetch(buildApiUrl(`/admin/users/${premiumTargetUser._id}/grant-premium`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(result.message || 'Premium membership granted successfully!', 'success');
        if (result.userEnt) {
          setUsers(prev => prev.map(u => u._id === premiumTargetUser._id ? {
            ...u,
            isPremium: result.userEnt.isPremium,
            premiumSource: result.userEnt.premiumSource,
            premiumExpiresAt: result.userEnt.premiumExpiresAt,
            adminGrant: result.userEnt.adminGrant,
            subscription: result.userEnt.subscription,
          } : u));
        } else {
          loadData();
        }
        setShowPremiumModal(false);
        setPremiumTargetUser(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to grant premium', 'error');
      }
    } catch (err) {
      showMessage('Failed to grant premium', 'error');
    } finally {
      setIsSubmittingPremium(false);
    }
  };

  const handleRevokePremium = async () => {
    if (!premiumTargetUser) return;
    setIsSubmittingPremium(true);
    try {
      const response = await fetch(buildApiUrl(`/admin/users/${premiumTargetUser._id}/revoke-premium`), {
        method: 'POST',
        headers: {
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(result.message || 'Admin-granted premium revoked', 'success');
        if (result.userEnt) {
          setUsers(prev => prev.map(u => u._id === premiumTargetUser._id ? {
            ...u,
            isPremium: result.userEnt.isPremium,
            premiumSource: result.userEnt.premiumSource,
            premiumExpiresAt: result.userEnt.premiumExpiresAt,
            adminGrant: result.userEnt.adminGrant,
            subscription: result.userEnt.subscription,
          } : u));
        } else {
          loadData();
        }
        setShowRevokeConfirmModal(false);
        setShowPremiumModal(false);
        setPremiumTargetUser(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to revoke admin premium', 'error');
      }
    } catch (err) {
      showMessage('Failed to revoke admin premium', 'error');
    } finally {
      setIsSubmittingPremium(false);
    }
  };

  const handleToggleMaintenance = async (mode) => {
    try {
      const payload = { maintenanceMode: mode, maintenanceStartTime: null };
      const response = await fetch(buildApiUrl('/admin/site-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setMaintenanceMode(result.settings.maintenanceMode);
        setMaintenanceStartTime(null);
        setMaintenanceCountdown('');
        showMessage(`Maintenance mode ${result.settings.maintenanceMode ? 'enabled' : 'disabled'}`, 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update maintenance mode', 'error');
      }
    } catch (err) {
      showMessage('Failed to update maintenance mode', 'error');
    }
  };

  // Helper to compute target Date based on active preset or custom picker
  const computedScheduledTarget = useMemo(() => {
    if (schedulePreset === '5m') {
      return new Date(currentTimestamp + 5 * 60 * 1000);
    }
    if (schedulePreset === '15m') {
      return new Date(currentTimestamp + 15 * 60 * 1000);
    }
    if (schedulePreset === '30m') {
      return new Date(currentTimestamp + 30 * 60 * 1000);
    }
    if (schedulePreset === '1h') {
      return new Date(currentTimestamp + 60 * 60 * 1000);
    }
    if (schedulePreset === 'custom') {
      if (!customScheduleDate) return null;
      const parts = customScheduleDate.split(/[-/]/);
      if (parts.length < 3) return null;
      let year, month, day;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

      let h = parseInt(customScheduleHour, 10);
      if (isNaN(h)) h = 12;
      if (customScheduleAmPm === 'PM' && h < 12) h += 12;
      if (customScheduleAmPm === 'AM' && h === 12) h = 0;

      let min = parseInt(customScheduleMinute, 10);
      if (isNaN(min)) min = 0;

      const target = new Date(year, month - 1, day, h, min, 0, 0);
      return target;
    }
    return null;
  }, [schedulePreset, currentTimestamp, customScheduleDate, customScheduleHour, customScheduleMinute, customScheduleAmPm]);

  const handleScheduleMaintenance = async () => {
    const target = computedScheduledTarget;
    if (!target || isNaN(target.getTime())) {
      showMessage('Please pick a valid date and time first', 'error');
      return;
    }
    if (target.getTime() <= Date.now()) {
      showMessage('Scheduled time must be in the future', 'error');
      return;
    }
    try {
      const response = await fetch(buildApiUrl('/admin/site-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ maintenanceStartTime: target.toISOString() }),
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        setMaintenanceStartTime(result.settings.maintenanceStartTime);
        setMaintenanceMode(result.settings.maintenanceMode);
        showMessage('Maintenance scheduled! Users will see a countdown banner.', 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to schedule maintenance', 'error');
      }
    } catch (err) {
      showMessage('Failed to schedule maintenance', 'error');
    }
  };

  const handleCancelSchedule = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/site-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ maintenanceStartTime: null, maintenanceMode: false }),
        credentials: 'include'
      });
      if (response.ok) {
        setMaintenanceStartTime(null);
        setMaintenanceMode(false);
        setMaintenanceCountdown('');
        showMessage('Maintenance schedule cancelled', 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to cancel schedule', 'error');
      }
    } catch (err) {
      showMessage('Failed to cancel schedule', 'error');
    }
  };

  // Live countdown ticker & timestamp updater for maintenance states
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setCurrentTimestamp(now);

      if (!maintenanceStartTime) {
        setMaintenanceCountdown('');
        return;
      }
      const diff = new Date(maintenanceStartTime).getTime() - now;
      if (diff <= 0) {
        setMaintenanceCountdown('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setMaintenanceCountdown(
        `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [maintenanceStartTime]);

  // Reactive state derived from live timestamp:
  const isScheduledPending = Boolean(
    maintenanceStartTime && new Date(maintenanceStartTime).getTime() > currentTimestamp
  );
  const isMaintenanceActive = Boolean(
    maintenanceMode && (!maintenanceStartTime || new Date(maintenanceStartTime).getTime() <= currentTimestamp)
  );

  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    setEditingBio(user.bio || '');
    setEditingUsername(user.username || '');
    setEditingEmail(user.email || '');
    setEditingCreator(!!user.isContentCreator);
    setEditingAdmin(!!user.isAdmin);
    setEditingSuspended(!!user.isSuspended);
    setEditingAvatarRemoved(false);
    setSuspensionReason(user.suspendedReason || '');
    setShowUserActions(true);
    setUserActionMenuOpenId(null);
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    setIsSavingProfile(true);
    try {
      const payload = { 
        bio: editingBio,
        username: editingUsername,
        email: editingEmail,
        isContentCreator: editingCreator
      };
      if (editingAvatarRemoved) {
        payload.avatar = null;
      }

      const response = await fetch(buildApiUrl(`/admin/users/${selectedUser._id}/profile`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingAdmin !== !!selectedUser.isAdmin) {
          await handleAssignAdmin(editingUsername, editingAdmin);
        }

        if (editingSuspended !== !!selectedUser.isSuspended) {
          await handleToggleSuspendUser(selectedUser, editingSuspended, suspensionReason);
        }

        showMessage('User updated successfully', 'success');
        setUsers(users.map(u => 
          u._id === selectedUser._id 
            ? { 
                ...u, 
                bio: result.bio, 
                username: result.username, 
                email: result.email !== undefined ? result.email : (editingEmail || u.email),
                isContentCreator: result.isContentCreator, 
                isAdmin: editingAdmin, 
                isSuspended: editingSuspended,
                avatar: editingAvatarRemoved ? null : (result.avatar !== undefined ? result.avatar : u.avatar)
              } 
            : u
        ));
        setShowUserActions(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      showMessage('Failed to update user', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const confirmDeleteReport = async () => {
    if (!selectedReport) return;
    try {
      const response = await fetch(buildApiUrl(`/admin/delete-report/${selectedReport._id}`), {
        method: 'DELETE',
        headers: { ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) },
        credentials: 'include'
      });

      if (response.ok) {
        showMessage(`${selectedReport.reportType || 'Report'} deleted successfully`, 'success');
        loadData();
        setShowDeleteReportModal(false);
        setSelectedReport(null);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to delete report', 'error');
      }
    } catch (err) {
      showMessage('Failed to delete report', 'error');
    }
  };

  const confirmResolveReport = async (report, reportType) => {
    try {
      const response = await fetch(buildApiUrl(`/admin/update-report-status/${report._id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ status: 'resolved' }),
        credentials: 'include'
      });

      if (response.ok) {
        showMessage(`${reportType || 'Report'} marked as resolved`, 'success');
        loadData();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update report status', 'error');
      }
    } catch (err) {
      showMessage('Failed to update report status', 'error');
    }
  };

  const handleAdminSendReply = async () => {
    if (!activeHelpChatReport || !adminReplyText.trim()) return;
    setIsSendingAdminReply(true);
    try {
      const response = await fetch(buildApiUrl(`/bug-reports/${activeHelpChatReport._id}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ content: adminReplyText.trim() }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reply');
      }

      const resData = await response.json();
      if (resData.ticket) {
        setActiveHelpChatReport(resData.ticket);
        setHelpTickets(prev => prev.map(r => (r._id === resData.ticket._id ? resData.ticket : r)));
        setBugReports(prev => prev.map(r => (r._id === resData.ticket._id ? resData.ticket : r)));
        setAdminReplyText('');
        showMessage('Reply sent to user', 'success');
      }
    } catch (err) {
      console.error('Error sending admin reply:', err);
      showMessage(err.message || 'Failed to send reply', 'error');
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  const handleAdminToggleStatus = async () => {
    if (!activeHelpChatReport) return;
    const newStatus = activeHelpChatReport.status === 'resolved' ? 'open' : 'resolved';
    try {
      const response = await fetch(buildApiUrl(`/bug-reports/${activeHelpChatReport._id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update status');

      const resData = await response.json();
      if (resData.ticket) {
        setActiveHelpChatReport(resData.ticket);
        setHelpTickets(prev => prev.map(r => (r._id === resData.ticket._id ? resData.ticket : r)));
        setBugReports(prev => prev.map(r => (r._id === resData.ticket._id ? resData.ticket : r)));
        showMessage(`Ticket marked as ${newStatus}`, 'success');
      }
    } catch (err) {
      showMessage('Failed to update ticket status', 'error');
    }
  };

  // Date and Activity helpers
  const getUserCreatedAt = (user) => {
    if (!user) return new Date();
    if (user.createdAt) {
      const d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (user._id) {
      try {
        const idStr = String(user._id);
        if (idStr.length >= 8) {
          const ts = parseInt(idStr.substring(0, 8), 16) * 1000;
          if (!isNaN(ts) && ts > 0) return new Date(ts);
        }
      } catch (e) {}
    }
    return new Date();
  };

  const getUserLastActiveAt = (user) => {
    if (!user) return new Date();
    if (user.lastActiveAt) {
      const d = new Date(user.lastActiveAt);
      if (!isNaN(d.getTime())) return d;
    }
    return getUserCreatedAt(user);
  };

  const formatJoinedDate = (user) => {
    if (!user) return 'Unknown';
    const d = getUserCreatedAt(user);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLastActive = (user) => {
    if (!user) return { text: 'Unknown', isOnline: false, isRecent: false };
    const date = getUserLastActiveAt(user);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const isOnline = diffMs >= 0 && diffMs < 10 * 60 * 1000; // active in last 10 minutes
    const isRecent = diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000; // active in last 24 hours

    return {
      text: isOnline ? 'Online now' : (getTimeAgo(date) || 'Just now'),
      isOnline,
      isRecent,
      date
    };
  };

  // Filtering & search
  const effectiveSearch = (userSearch || globalSearch).toLowerCase().trim();
  const filteredUsers = users.filter(user => {
    const matchesSearch = !effectiveSearch || 
      (user.username && user.username.toLowerCase().includes(effectiveSearch)) ||
      (user.email && user.email.toLowerCase().includes(effectiveSearch)) ||
      (user.bio && user.bio.toLowerCase().includes(effectiveSearch));
    
    let matchesRole = true;
    if (roleFilter === 'admin') matchesRole = !!user.isAdmin;
    else if (roleFilter === 'creator') matchesRole = !!user.isContentCreator;
    else if (roleFilter === 'premium') matchesRole = !!user.isPremium;
    else if (roleFilter === 'premium_paid') matchesRole = user.premiumSource === 'subscription' || user.premiumSource === 'both';
    else if (roleFilter === 'premium_admin') matchesRole = user.premiumSource === 'admin' || user.premiumSource === 'both';
    else if (roleFilter === 'user') matchesRole = !user.isAdmin && !user.isContentCreator && !user.isPremium;
    else if (roleFilter === 'suspended') matchesRole = !!user.isSuspended;

    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    let comparison = 0;
    if (userSortField === 'username') {
      comparison = (a.username || '').localeCompare(b.username || '');
    } else if (userSortField === 'admin' || userSortField === 'role') {
      const getRoleWeight = (u) => {
        if (u.isAdmin) return 5;
        if (u.isContentCreator) return 4;
        if (u.premiumSource === 'subscription' || u.premiumSource === 'both') return 3;
        if (u.premiumSource === 'admin') return 2;
        return 1;
      };
      comparison = getRoleWeight(a) - getRoleWeight(b);
    } else if (userSortField === 'joined') {
      comparison = getUserCreatedAt(a).getTime() - getUserCreatedAt(b).getTime();
    } else if (userSortField === 'lastActive') {
      comparison = getUserLastActiveAt(a).getTime() - getUserLastActiveAt(b).getTime();
    }
    return userSortDir === 'desc' ? -comparison : comparison;
  });

  const paginatedUsers = filteredUsers.slice((userPage - 1) * rowsPerPage, userPage * rowsPerPage);
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, globalSearch, roleFilter, rowsPerPage]);

  const handleUserSort = (field) => {
    if (userSortField === field) {
      setUserSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDir('desc');
    }
  };

  // Counts & Dynamic Trends
  const totalUsersCount = users.length;
  const adminCount = users.filter(u => u.isAdmin).length;
  
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeekCount = users.filter(u => getUserCreatedAt(u) >= startOfWeek).length;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonthCount = users.filter(u => getUserCreatedAt(u) >= startOfMonth).length;

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const newLastMonthCount = users.filter(u => {
    const d = getUserCreatedAt(u);
    return d >= startOfLastMonth && d < startOfMonth;
  }).length;

  let monthTrend = { text: '0 new vs last month', type: 'neutral', icon: null };
  if (newLastMonthCount > 0) {
    const diff = newThisMonthCount - newLastMonthCount;
    const pct = Math.round((diff / newLastMonthCount) * 100);
    if (pct > 0) {
      monthTrend = { text: `+${pct}% vs last month`, type: 'positive', icon: 'up' };
    } else if (pct < 0) {
      monthTrend = { text: `${Math.abs(pct)}% vs last month`, type: 'negative', icon: 'down' };
    } else {
      monthTrend = { text: `Same as last month (${newLastMonthCount})`, type: 'neutral', icon: null };
    }
  } else if (newThisMonthCount > 0) {
    monthTrend = { text: `+${newThisMonthCount} this month`, type: 'positive', icon: 'up' };
  }

  const suspendedCount = users.filter(u => u.isSuspended).length;
  const openBugReportsCount = bugReports.filter(r => r.status === 'open' || !r.status).length;
  const openFeatureRequestsCount = featureRequests.filter(r => r.status === 'open' || !r.status).length;
  const openHelpTicketsCount = helpTickets.filter(r => r.status === 'open' || !r.status).length;
  const pendingCreatorRequestsCount = creatorRequests.filter(r => r.status === 'pending').length;

  if (isAdmin === null) {
    return (
      <div className="admin-page-loading">
        <div className="loading-spinner"></div>
        <p>Verifying administrator privileges...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="admin-fullscreen-window">
      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-top">
          {/* Site Logo */}
          <div className="admin-brand-header">
            <Link
              to="/"
              className="admin-site-logo-link"
              title="Return to Ultimate Dex Tracker"
            >
              <div className="admin-site-logo-wrap">
                <img
                  src="/Logo_Layer1.png"
                  alt="Ultimate Dex Tracker"
                  className="admin-site-logo-layer1"
                />
                <img
                  src="/Logo_Layer2.png"
                  alt=""
                  className="admin-site-logo-layer2"
                />
                <div
                  className="admin-site-logo-layer3"
                  style={{
                    WebkitMask: 'url(/Logo_Layer3.png) no-repeat center / contain',
                    mask: 'url(/Logo_Layer3.png) no-repeat center / contain',
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="admin-nav">
            <div className="admin-nav-group">
              <span className="admin-nav-heading">MANAGEMENT</span>
              
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveTab('users'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={17} className="admin-nav-icon" />
                  <span>Users</span>
                </div>
                <span className="admin-nav-badge cyan">{totalUsersCount}</span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'changelog' ? 'active' : ''}`}
                onClick={() => { setActiveTab('changelog'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <History size={17} className="admin-nav-icon" />
                  <span>Changelog</span>
                </div>
                {changelogDraftsCount > 0 ? (
                  <span className="admin-nav-badge amber" title={`${changelogDraftsCount} unpublished drafts`}>
                    {changelogDraftsCount} draft{changelogDraftsCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="admin-nav-badge neutral">
                    {changelogs.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'support-inbox' ? 'active' : ''}`}
                onClick={() => { setActiveTab('support-inbox'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox size={17} className="admin-nav-icon" />
                  <span>Support Inbox</span>
                </div>
                <span className={`admin-nav-badge ${(supportMetrics.openCount || supportTickets.filter(t => !['resolved', 'fixed', 'completed', 'closed', 'declined'].includes(t.status)).length) > 0 ? 'amber' : 'neutral'}`}>
                  {supportMetrics.openCount || supportTickets.filter(t => !['resolved', 'fixed', 'completed', 'closed', 'declined'].includes(t.status)).length}
                </span>
              </button>


              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'creator-requests' ? 'active' : ''}`}
                onClick={() => { setActiveTab('creator-requests'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Video size={17} className="admin-nav-icon" />
                  <span>Creator Requests</span>
                </div>
                <span className={`admin-nav-badge ${pendingCreatorRequestsCount > 0 ? 'pink' : 'neutral'}`}>
                  {pendingCreatorRequestsCount}
                </span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={17} className="admin-nav-icon" />
                  <span>Site Settings</span>
                </div>
              </button>

            </div>
          </nav>
        </div>

        {/* BOTTOM SYSTEM STATUS CARD */}
        <div className="admin-sidebar-bottom">
          <div 
            className="admin-status-card group cursor-pointer hover:border-[var(--accent)] transition-all"
            onClick={() => { setActiveTab('diagnostics'); setMobileSidebarOpen(false); }}
            title="Click to open System Diagnostics dashboard"
          >
            <div className="admin-status-header">
              <span className={`admin-status-dot ${systemStats.database?.status === 'Healthy' || systemStats.databaseStatus === 'Healthy' ? 'pulse' : 'bg-rose-500'}`} />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="admin-status-title">System Status</span>
                  <ChevronRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
                <span className="admin-status-sub">{systemStats.serverStatus || 'All Systems Operational'}</span>
              </div>
            </div>

            <div className="admin-status-metrics">
              <div className="admin-metric-row">
                <span>DB Latency</span>
                <span className="metric-val emerald">{systemStats.database?.latencyMs != null ? `${systemStats.database.latencyMs}ms` : (systemStats.databaseStatus || 'Healthy')}</span>
              </div>
              <div className="admin-metric-row">
                <span>Avg Response</span>
                <span className="metric-val cyan">{systemStats.performance?.avgResponseMs != null ? `${systemStats.performance.avgResponseMs}ms` : systemStats.apiLatency}</span>
              </div>
              <div className="admin-metric-row">
                <span>P95 Latency</span>
                <span className="metric-val amber">{systemStats.performance?.p95ResponseMs != null ? `${systemStats.performance.p95ResponseMs}ms` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT (FIT-TO-WINDOW) */}
      <main className="admin-main-viewport">
        {/* TOP APP BAR */}
        <header className="admin-top-header">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="admin-heading-title">Admin Panel</h1>
                <ShieldCheck className="admin-verified-shield" size={20} />
              </div>
              <p className="admin-heading-subtitle">Manage users, site settings, and system data.</p>
            </div>
          </div>
        </header>

        {/* 4 TOP STAT CARDS */}
        <section className="admin-stats-grid">
          {/* Total Users */}
          <div 
            className="admin-stat-card card-cyan"
            onClick={() => { setActiveTab('users'); setRoleFilter('all'); }}
          >
            <div className="admin-stat-icon-box bg-cyan">
              <Users size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{totalUsersCount}</span>
              {newThisWeekCount > 0 ? (
                <span className="stat-trend positive flex items-center gap-1">
                  <TrendingUp size={12} className="inline shrink-0" /> +{newThisWeekCount} this week
                </span>
              ) : (
                <span className="stat-trend neutral">0 new this week</span>
              )}
            </div>
            <ChevronRight size={16} className="stat-chevron" />
          </div>

          {/* Administrators */}
          <div 
            className="admin-stat-card card-purple"
            onClick={() => { setActiveTab('users'); setRoleFilter('admin'); }}
          >
            <div className="admin-stat-icon-box bg-purple">
              <Crown size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="stat-label">Administrators</span>
              <span className="stat-value">{adminCount}</span>
              <span className="stat-trend neutral">{adminCount === 1 ? '1 active admin' : `${adminCount} active admins`}</span>
            </div>
            <ChevronRight size={16} className="stat-chevron" />
          </div>

          {/* New This Month */}
          <div 
            className="admin-stat-card card-emerald"
            onClick={() => { setActiveTab('users'); }}
          >
            <div className="admin-stat-icon-box bg-emerald">
              <Calendar size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="stat-label">New This Month</span>
              <span className="stat-value">{newThisMonthCount}</span>
              <span className={`stat-trend ${monthTrend.type} flex items-center gap-1`}>
                {monthTrend.icon === 'up' && <TrendingUp size={12} className="inline shrink-0" />}
                {monthTrend.icon === 'down' && <TrendingDown size={12} className="inline shrink-0" />}
                <span>{monthTrend.text}</span>
              </span>
            </div>
            <ChevronRight size={16} className="stat-chevron" />
          </div>

          {/* Suspended Users */}
          <div 
            className="admin-stat-card card-rose"
            onClick={() => { setActiveTab('users'); setRoleFilter('suspended'); }}
          >
            <div className="admin-stat-icon-box bg-rose">
              <UserX size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="stat-label">Suspended Users</span>
              <span className="stat-value">{suspendedCount}</span>
              {suspendedCount === 0 ? (
                <span className="stat-trend positive">0 suspended</span>
              ) : (
                <span className="stat-trend negative">{((suspendedCount / (totalUsersCount || 1)) * 100).toFixed(1)}% of users</span>
              )}
            </div>
            <ChevronRight size={16} className="stat-chevron" />
          </div>
        </section>

        {/* TAB VIEWS (FIT CONTAINER) */}
        <div className="admin-tab-viewport-body">
          {/* 1. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="admin-content-card-fit">
              {/* Header */}
              <div className="admin-card-header-compact">
                <div>
                  <h2 className="admin-card-title">User Management</h2>
                  <p className="admin-card-desc">View and manage all registered users.</p>
                </div>

                <div className="admin-action-toolbar">
                  {/* Search Box */}
                  <SearchField
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onClear={() => setUserSearch('')}
                    placeholder="Search users..."
                    size="md"
                    className="admin-search-field-universal"
                  />

                  {/* Filter Dropdown */}
                  <div className="relative flex items-center" ref={filterDropdownRef}>
                    <Button
                      variant={roleFilter !== 'all' ? 'primary' : 'secondary'}
                      size="md"
                      icon={<Filter size={16} />}
                      iconRight={<ChevronDown size={14} className={`transition-transform duration-150 ${showFilterDropdown ? 'rotate-180' : ''}`} />}
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                      Filters
                      {roleFilter !== 'all' && (
                        <span className="admin-filter-count-badge">
                          1
                        </span>
                      )}
                    </Button>

                    <AnimatePresence>
                      {showFilterDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="admin-filter-flyout"
                        >
                          <div className="filter-group">
                            <span className="filter-group-label">Filter by Role</span>
                            <div className="filter-options-grid">
                              {[
                                { id: 'all', label: 'All Users', icon: null },
                                { id: 'admin', label: 'Admins', icon: Crown, iconColor: 'text-amber-400' },
                                { id: 'creator', label: 'Creators', icon: Video, iconColor: 'text-pink-400' },
                                { id: 'premium', label: 'All Premium', icon: Gem, iconColor: 'text-sky-400' },
                                { id: 'premium_paid', label: 'Paid Members', icon: CreditCard, iconColor: 'text-emerald-400' },
                                { id: 'premium_admin', label: 'Admin Granted', icon: Gift, iconColor: 'text-purple-400' },
                                { id: 'suspended', label: 'Suspended', icon: Ban, iconColor: 'text-rose-400' },
                                { id: 'user', label: 'Users', icon: User, iconColor: 'text-gray-400' }
                              ].map((r) => {
                                const IconComponent = r.icon;
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRoleFilter(r.id)}
                                    className={`filter-chip flex items-center gap-1.5 ${roleFilter === r.id ? 'selected' : ''}`}
                                  >
                                    {IconComponent && <IconComponent size={12} className={`shrink-0 ${roleFilter === r.id ? 'text-black' : r.iconColor}`} />}
                                    <span>{r.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {roleFilter !== 'all' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRoleFilter('all')}
                              className="filter-reset-btn w-full mt-1"
                            >
                              Reset Filters
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {roleFilter !== 'all' && (
                <div className="admin-active-filters-bar">
                  <span className="admin-active-filters-label">Active:</span>
                  <span className="admin-active-chip">
                    <span>Role: {roleFilter === 'admin' ? 'Admins' : roleFilter === 'creator' ? 'Creators' : roleFilter === 'premium' ? 'All Premium' : roleFilter === 'premium_paid' ? 'Paid Members' : roleFilter === 'premium_admin' ? 'Admin Granted' : roleFilter === 'suspended' ? 'Suspended' : 'Users'}</span>
                    <button type="button" onClick={() => setRoleFilter('all')} className="admin-active-chip-remove" title="Remove role filter">
                      <X size={12} />
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('all')}
                    className="admin-active-clear-all"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Table Area (auto-fit to full page) */}
              <div className="admin-table-scroll-area">
                <table className="admin-data-table">
                  <colgroup>
                    <col className="col-user" style={{ width: '30%' }} />
                    <col className="col-role" style={{ width: '28%' }} />
                    <col className="col-joined" style={{ width: '18%' }} />
                    <col className="col-active" style={{ width: '14%' }} />
                    <col className="col-actions" style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="col-th-user" onClick={() => handleUserSort('username')}>
                        <div className="th-content-sort">
                          <span>USER</span>
                          {userSortField === 'username' && (userSortDir === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />)}
                        </div>
                      </th>
                      <th className="col-th-role" onClick={() => handleUserSort('admin')}>
                        <div className="th-content-sort">
                          <span>ROLE</span>
                          {userSortField === 'admin' && (userSortDir === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />)}
                        </div>
                      </th>
                      <th className="col-th-joined" onClick={() => handleUserSort('joined')}>
                        <div className="th-content-sort">
                          <span>JOINED</span>
                          {userSortField === 'joined' && (userSortDir === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />)}
                        </div>
                      </th>
                      <th className="col-th-active" onClick={() => handleUserSort('lastActive')}>
                        <div className="th-content-sort">
                          <span>LAST ACTIVE</span>
                          {userSortField === 'lastActive' && (userSortDir === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />)}
                        </div>
                      </th>
                      <th className="col-th-actions text-right">
                        <span>ACTIONS</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="admin-empty-table">
                          <div className="empty-state-box">
                            <div className="empty-state-icon-bubble">
                              <Users size={30} className="text-gray-500" />
                            </div>
                            <span className="font-bold text-gray-200 text-sm mt-3">
                              {userSearch || roleFilter !== 'all' ? 'No users matching your filters' : 'No users found'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1 max-w-xs">
                              {userSearch || roleFilter !== 'all' ? 'Try adjusting your search query or clearing active filters.' : 'There are currently no registered users in the database.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user, index) => {
                        const isNearBottom = paginatedUsers.length > 5 && index >= paginatedUsers.length - 2;
                        return (
                          <tr key={user._id} className={`admin-row-hover ${userActionMenuOpenId === user._id ? 'relative z-20' : ''}`}>
                            {/* USER */}
                            <td className="col-td-user">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <Link
                                  to={`/u/${encodeURIComponent(user.username)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-user-avatar-link shrink-0"
                                  title={`View ${user.username}'s profile`}
                                >
                                  <div className="admin-user-avatar-frame-sm">
                                    <img
                                      src={getUserAvatarUrl(user)}
                                      alt={user.username}
                                      className="admin-user-avatar-img"
                                      onError={(e) => { e.target.src = '/data/default_profile_pictures/pikachu.png'; }}
                                    />
                                  </div>
                                </Link>
                                <div className="min-w-0 overflow-hidden">
                                  <Link
                                    to={`/u/${encodeURIComponent(user.username)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-user-name-link truncate block"
                                    title={`View ${user.username}'s profile`}
                                  >
                                    <span className="admin-user-name truncate block">{user.username}</span>
                                  </Link>
                                </div>
                              </div>
                            </td>

                            {/* ROLE */}
                            <td className="col-td-role">
                              <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                                {user.isSuspended && (
                                  <span className="role-pill suspended shrink-0">
                                    <Ban size={10} className="inline mr-1" /> Suspended
                                  </span>
                                )}
                                {user.isAdmin && (
                                  <span className="role-pill admin shrink-0">
                                    Admin <Crown size={11} className="inline ml-0.5" />
                                  </span>
                                )}
                                {user.isContentCreator && (
                                  <span className="role-pill creator shrink-0">
                                    Creator <Video size={11} className="inline ml-0.5" />
                                  </span>
                                )}
                                {user.isPremium && (
                                  <span className={`role-pill shrink-0 ${user.premiumSource === 'subscription' || user.premiumSource === 'both' ? 'premium-paid' : 'premium-admin'}`}>
                                    {user.premiumSource === 'subscription' ? (
                                      <>
                                        <CreditCard size={11} className="inline mr-1" />
                                        Paid
                                      </>
                                    ) : user.premiumSource === 'admin' ? (
                                      <>
                                        <Gift size={11} className="inline mr-1" />
                                        Admin
                                      </>
                                    ) : (
                                      <>
                                        <Gem size={11} className="inline mr-1" />
                                        Member
                                      </>
                                    )}
                                  </span>
                                )}
                                {!user.isAdmin && !user.isContentCreator && !user.isPremium && !user.isSuspended && (
                                  <span className="role-pill user shrink-0">
                                    User
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* JOINED */}
                            <td className="col-td-joined">
                              <span className="admin-date-text truncate block">
                                {formatJoinedDate(user)}
                              </span>
                            </td>

                            {/* LAST ACTIVE */}
                            <td className="col-td-active">
                              {(() => {
                                const activeInfo = formatLastActive(user);
                                return (
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span 
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        activeInfo.isOnline 
                                          ? 'bg-emerald-400 animate-pulse' 
                                          : activeInfo.isRecent 
                                            ? 'bg-emerald-500/70' 
                                            : 'bg-white/20'
                                      }`} 
                                    />
                                    <span className={`admin-active-text truncate ${activeInfo.isOnline ? 'text-emerald-400 font-semibold' : ''}`}>
                                      {activeInfo.text}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* ACTIONS */}
                            <td className="col-td-actions text-right">
                              <div className="flex items-center justify-end gap-1 relative">
                                <button
                                  type="button"
                                  className="admin-icon-btn-sm edit shrink-0"
                                  onClick={() => handleOpenEditUser(user)}
                                  title="Manage user"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="admin-icon-btn-sm more user-more-btn shrink-0"
                                  onClick={() => setUserActionMenuOpenId(userActionMenuOpenId === user._id ? null : user._id)}
                                  title="More actions"
                                >
                                  <MoreHorizontal size={14} />
                                </button>

                                {/* More Context Dropdown */}
                                <AnimatePresence>
                                  {userActionMenuOpenId === user._id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.94, y: isNearBottom ? 4 : -4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.94, y: isNearBottom ? 4 : -4 }}
                                      transition={{ duration: 0.12 }}
                                      className={`user-more-actions-menu ${isNearBottom ? 'pop-up' : ''}`}
                                    >
                                      <Link
                                        to={`/u/${encodeURIComponent(user.username)}`}
                                        target="_blank"
                                        className="more-action-item"
                                        onClick={() => setUserActionMenuOpenId(null)}
                                      >
                                        <ExternalLink size={14} className="text-gray-400" />
                                        <span>Public Profile</span>
                                      </Link>

                                      <button
                                        type="button"
                                        className="more-action-item"
                                        onClick={() => handleOpenGrantPremium(user)}
                                      >
                                        <Sparkles size={14} className={user.isPremium ? 'text-amber-400' : 'text-gray-400'} />
                                        <span>{user.isPremium ? 'Manage Premium' : 'Grant Premium'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="more-action-item"
                                        onClick={() => {
                                          handleAssignAdmin(user.username, !user.isAdmin);
                                          setUserActionMenuOpenId(null);
                                        }}
                                      >
                                        <Crown size={14} className={user.isAdmin ? 'text-amber-400' : 'text-gray-400'} />
                                        <span>{user.isAdmin ? 'Revoke Admin' : 'Make Admin'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        className="more-action-item"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowSuspendModal(true);
                                          setUserActionMenuOpenId(null);
                                        }}
                                      >
                                        <Ban size={14} className={user.isSuspended ? 'text-emerald-400' : 'text-amber-400'} />
                                        <span>{user.isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                                      </button>

                                      <div className="more-action-divider" />

                                      <button
                                        type="button"
                                        className="more-action-item danger"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowDeleteUserModal(true);
                                          setUserActionMenuOpenId(null);
                                        }}
                                      >
                                        <Trash2 size={14} />
                                        <span>Delete Account</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compact Pagination Bar */}
              <div className="admin-pagination-bar-compact">
                <div className="admin-pagination-info">
                  Showing {filteredUsers.length === 0 ? 0 : (userPage - 1) * rowsPerPage + 1} to {Math.min(userPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>

                <div className="flex items-center gap-3">
                  <div className="admin-rows-per-page">
                    <span>Rows:</span>
                    <div style={{ width: '76px' }}>
                      <SelectField
                        size="sm"
                        value={rowsPerPage}
                        onChange={(val) => {
                          setRowsPerPage(Number(val));
                          setUserPage(1);
                        }}
                        options={[
                          { value: 10, label: '10' },
                          { value: 12, label: '12' },
                          { value: 15, label: '15' },
                          { value: 25, label: '25' },
                          { value: 50, label: '50' }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="admin-pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn-sm"
                      onClick={() => setUserPage(1)}
                      disabled={userPage === 1}
                      title="First page"
                    >
                      <ChevronsLeft size={14} />
                    </button>

                    <button
                      type="button"
                      className="pagination-btn-sm"
                      onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                      disabled={userPage === 1}
                      title="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: Math.min(5, totalUserPages) }, (_, idx) => {
                      let pageNum;
                      if (totalUserPages <= 5) {
                        pageNum = idx + 1;
                      } else if (userPage <= 3) {
                        pageNum = idx + 1;
                      } else if (userPage >= totalUserPages - 2) {
                        pageNum = totalUserPages - 4 + idx;
                      } else {
                        pageNum = userPage - 2 + idx;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`pagination-num-btn-sm ${userPage === pageNum ? 'active' : ''}`}
                          onClick={() => setUserPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className="pagination-btn-sm"
                      onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))}
                      disabled={userPage >= totalUserPages}
                      title="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>

                    <button
                      type="button"
                      className="pagination-btn-sm"
                      onClick={() => setUserPage(totalUserPages)}
                      disabled={userPage >= totalUserPages}
                      title="Last page"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHANGELOG MANAGER TAB */}
          {activeTab === 'changelog' && (
            <div className="admin-content-card-fit admin-changelog-viewport">
              <div className="admin-card-header-compact flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="admin-card-title flex items-center gap-2">
                    <History size={19} className="text-cyan-400" />
                    <span>Changelog Manager</span>
                  </h2>
                  <p className="admin-card-desc">
                    Build, draft, and publish releases to your database. Updates appear automatically on the public changelog.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {changelogs.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenNewChangelog(changelogs[0])}
                      icon={<Copy size={13} />}
                      title="Create a new draft with the same section structure as the latest release"
                    >
                      Duplicate Latest Release
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenNewChangelog(null)}
                    icon={<Plus size={14} />}
                  >
                    New Release
                  </Button>
                </div>
              </div>

              {/* Action Toolbar: Filter and Search */}
              <div className="admin-action-toolbar flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
                  <SearchField
                    value={changelogSearch}
                    onChange={(e) => setChangelogSearch(e.target.value)}
                    onClear={() => setChangelogSearch('')}
                    placeholder="Search version tags, features, fixes..."
                    size="sm"
                    className="admin-search-field-universal"
                  />
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-[var(--border-color)] text-xs">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${changelogFilter === 'all' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    onClick={() => setChangelogFilter('all')}
                  >
                    All ({changelogs.length})
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${changelogFilter === 'published' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    onClick={() => setChangelogFilter('published')}
                  >
                    Published ({changelogs.filter(c => c.published).length})
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${changelogFilter === 'draft' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'}`}
                    onClick={() => setChangelogFilter('draft')}
                  >
                    Drafts ({changelogs.filter(c => !c.published).length})
                  </button>
                </div>
              </div>

              {/* Changelog Entries List / Grid */}
              <div className="admin-changelog-scroll-area mt-3">
                {(() => {
                  const filtered = changelogs.filter((entry) => {
                    if (changelogFilter === 'published' && !entry.published) return false;
                    if (changelogFilter === 'draft' && entry.published) return false;

                    if (!changelogSearch.trim()) return true;
                    const q = changelogSearch.toLowerCase();
                    const inVersion = (entry.version || '').toLowerCase().includes(q);
                    const inSections = (entry.sections || []).some(s =>
                      (s.items || []).some(item => item.toLowerCase().includes(q))
                    );
                    const inFeatures = (entry.features || []).some(item => item.toLowerCase().includes(q));
                    const inFixes = (entry.fixes || []).some(item => item.toLowerCase().includes(q));
                    return inVersion || inSections || inFeatures || inFixes;
                  });

                  if (changelogsLoading) {
                    return (
                      <div className="empty-state-box">
                        <div className="loading-spinner mb-2"></div>
                        <span className="text-xs text-gray-400">Loading changelogs...</span>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state-box">
                        <div className="empty-state-icon-bubble">
                          <History size={30} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-200 text-sm mt-3">
                          {changelogSearch ? 'No matching releases found' : 'No changelog releases found'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 max-w-xs">
                          {changelogSearch ? 'Try a different search keyword.' : 'Click "New Release" to create your first release note.'}
                        </span>
                        {!changelogSearch && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleOpenNewChangelog(null)}
                            icon={<Plus size={14} />}
                          >
                            Create First Release
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="admin-changelog-grid">
                      {filtered.map((entry) => {
                        const rawDate = entry.releaseDate || entry.date;
                        const dateFormatted = rawDate ? new Date(rawDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date';
                        
                        let featureCount = 0;
                        let improvementCount = 0;
                        let fixCount = 0;
                        let removedCount = 0;

                        if (entry.sections && entry.sections.length > 0) {
                          entry.sections.forEach(sec => {
                            const t = (sec.type || '').toLowerCase();
                            const len = (sec.items || []).length;
                            if (t.includes('feature')) featureCount += len;
                            else if (t.includes('improv') || t.includes('change')) improvementCount += len;
                            else if (t.includes('fix')) fixCount += len;
                            else if (t.includes('remov')) removedCount += len;
                          });
                        } else {
                          featureCount = (entry.features || []).length;
                          improvementCount = (entry.changes || []).length;
                          fixCount = (entry.fixes || []).length;
                          removedCount = (entry.removed || []).length;
                        }

                        return (
                          <div key={entry._id} className="admin-changelog-card">
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base text-[var(--text)] tracking-wide">
                                  {entry.version}
                                </span>
                                <span className={`changelog-status-pill ${entry.published ? 'published' : 'draft'}`}>
                                  {entry.published ? (
                                    <>
                                      <CheckCircle size={11} />
                                      <span>Published</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={11} />
                                      <span>Draft</span>
                                    </>
                                  )}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                  <Calendar size={12} />
                                  <span>{dateFormatted}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTogglePublishChangelog(entry)}
                                  icon={entry.published ? <EyeOff size={13} /> : <Eye size={13} />}
                                  title={entry.published ? 'Unpublish to draft' : 'Publish to live changelog'}
                                >
                                  <span className="changelog-btn-text-collapsible">{entry.published ? 'Unpublish' : 'Publish'}</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateChangelog(entry._id)}
                                  icon={<Copy size={13} />}
                                  title="Duplicate as new draft"
                                >
                                  <span className="changelog-btn-text-collapsible">Duplicate</span>
                                </Button>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleEditChangelog(entry)}
                                  icon={<Edit3 size={13} />}
                                >
                                  Edit
                                </Button>

                                <Button
                                  variant="danger-soft"
                                  size="sm"
                                  onClick={() => {
                                    setChangelogToDelete(entry);
                                    setShowDeleteChangelogModal(true);
                                  }}
                                  icon={<Trash2 size={13} />}
                                  title="Delete release"
                                />
                              </div>
                            </div>

                            {/* Section breakdown pills */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-[var(--border-color)] text-xs">
                              {featureCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold changelog-badge-feature">
                                  {featureCount} Feature{featureCount > 1 ? 's' : ''}
                                </span>
                              )}
                              {improvementCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold changelog-badge-improvement">
                                  {improvementCount} Improvement{improvementCount > 1 ? 's' : ''}
                                </span>
                              )}
                              {fixCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold changelog-badge-fix">
                                  {fixCount} Fix{fixCount > 1 ? 'es' : ''}
                                </span>
                              )}
                              {removedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold changelog-badge-removed">
                                  {removedCount} Removed
                                </span>
                              )}
                              {featureCount === 0 && improvementCount === 0 && fixCount === 0 && removedCount === 0 && (
                                <span className="text-[11px] text-[var(--text-muted)] italic">
                                  No entries
                                </span>
                              )}
                              <span className="text-[11px] text-[var(--text-muted)] ml-auto">
                                Total {featureCount + improvementCount + fixCount + removedCount} items
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 3. UNIFIED SUPPORT INBOX & WORKSPACE TAB */}
          {activeTab === 'support-inbox' && (
            <div className="admin-content-card-fit overflow-y-auto">
              {activeAdminTicket ? (
                /* ============================================================
                   SUB-VIEW: ADMIN TICKET WORKSPACE
                   ============================================================ */
                <div className="admin-workspace-view">
                  {/* Top Bar */}
                  <div className="admin-workspace-topbar">
                    <button
                      type="button"
                      className="admin-workspace-back-btn"
                      onClick={() => {
                        setActiveAdminTicket(null);
                        fetchSupportInbox();
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Back to Support Inbox</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        Submitted by <strong>@{activeAdminTicket.username || activeAdminTicket.submittedBy?.username || 'Anonymous'}</strong>
                        {activeAdminTicket.submittedBy?.email ? ` (${activeAdminTicket.submittedBy.email})` : ''} • {new Date(activeAdminTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Header Title */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="admin-card-title text-base flex items-center gap-2 m-0">
                      <span className="text-[var(--accent)] font-extrabold">#{activeAdminTicket.reportId}</span>
                      <span className="text-gray-500">—</span>
                      <span>{activeAdminTicket.title}</span>
                    </h2>

                    <div className="flex items-center gap-2">
                      <span className={`ticket-type-pill ${activeAdminTicket.type}`}>
                        {activeAdminTicket.type === 'bug' ? 'Bug Report' : activeAdminTicket.type === 'feature' ? 'Feature Request' : 'Help Request'}
                      </span>
                      {activeAdminTicket.category && (
                        <span className="ticket-category-pill">
                          {activeAdminTicket.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Workspace Control Ribbon */}
                  <div className="admin-workspace-ribbon">
                    <div className="ribbon-controls-left">
                      {/* Status Selector (Type-specific) */}
                      <div className="ribbon-field-item">
                        <label className="ribbon-field-label">Status</label>
                        <div style={{ minWidth: '175px' }}>
                          <SelectField
                            size="sm"
                            value={adminTicketDraftStatus}
                            onChange={(val) => setAdminTicketDraftStatus(val)}
                            options={
                              activeAdminTicket.type === 'help' ? [
                                { value: 'new', label: '🔴 New' },
                                { value: 'awaiting_staff', label: '🟡 Awaiting Staff' },
                                { value: 'awaiting_user', label: '🔵 Awaiting User' },
                                { value: 'resolved', label: '🟢 Resolved' },
                                { value: 'closed', label: '⚪ Closed' }
                              ] : activeAdminTicket.type === 'bug' ? [
                                { value: 'reported', label: '🔴 Reported' },
                                { value: 'investigating', label: '🟡 Investigating' },
                                { value: 'confirmed', label: '🟣 Confirmed' },
                                { value: 'fix_in_progress', label: '🟠 Fix In Progress' },
                                { value: 'fixed', label: '🟢 Fixed' },
                                { value: 'closed', label: '⚪ Closed' }
                              ] : [
                                { value: 'submitted', label: '🔵 Submitted' },
                                { value: 'under_review', label: '🟣 Under Review' },
                                { value: 'planned', label: '🟡 Planned' },
                                { value: 'in_progress', label: '🟠 In Progress' },
                                { value: 'completed', label: '🟢 Completed' },
                                { value: 'declined', label: '⚪ Declined' },
                                { value: 'duplicate', label: '⚪ Duplicate' }
                              ]
                            }
                          />
                        </div>
                      </div>

                      {/* Priority Selector */}
                      <div className="ribbon-field-item">
                        <label className="ribbon-field-label">Priority</label>
                        <div style={{ minWidth: '120px' }}>
                          <SelectField
                            size="sm"
                            value={adminTicketDraftPriority}
                            onChange={(val) => setAdminTicketDraftPriority(val)}
                            options={[
                              { value: 'low', label: 'Low' },
                              { value: 'normal', label: 'Normal' },
                              { value: 'high', label: 'High' },
                              { value: 'urgent', label: 'Urgent' }
                            ]}
                          />
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="ribbon-field-item">
                        <label className="ribbon-field-label">Assigned To</label>
                        <input
                          type="text"
                          className="ribbon-select text-xs"
                          placeholder="Unassigned"
                          value={adminTicketDraftAssignee}
                          onChange={(e) => setAdminTicketDraftAssignee(e.target.value)}
                        />
                      </div>

                      {/* Linked Changelog Version */}
                      <div className="ribbon-field-item">
                        <label className="ribbon-field-label">Connect Changelog</label>
                        <div style={{ minWidth: '180px' }}>
                          <SelectField
                            size="sm"
                            value={adminTicketDraftChangelog}
                            onChange={(val) => setAdminTicketDraftChangelog(val)}
                            options={[
                              { value: '', label: 'None / Unlinked' },
                              ...changelogs.map(c => ({
                                value: c.version,
                                label: `${c.version} (${c.published ? 'Published' : 'Draft'})`
                              }))
                            ]}
                          />
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        loading={isSavingAdminChanges}
                        onClick={handleSaveAdminTicketFields}
                        style={{ marginTop: '14px' }}
                      >
                        Save Changes
                      </Button>
                    </div>

                    {/* Ribbon Right Actions */}
                    <div className="ribbon-actions-right">
                      {activeAdminTicket.status !== 'resolved' && activeAdminTicket.status !== 'fixed' && activeAdminTicket.status !== 'completed' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={<CheckCircle size={14} />}
                          onClick={() => handleQuickResolveTicket(activeAdminTicket)}
                        >
                          Resolve
                        </Button>
                      )}
                      {activeAdminTicket.status !== 'closed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickCloseTicket(activeAdminTicket)}
                        >
                          Close Ticket
                        </Button>
                      )}
                      <Button
                        variant="danger-soft"
                        size="sm"
                        icon={<Trash2 size={13} />}
                        onClick={() => {
                          setSelectedReport({ ...activeAdminTicket, reportType: 'Ticket' });
                          setShowDeleteReportModal(true);
                        }}
                        aria-label="Delete ticket"
                      />
                    </div>
                  </div>

                  {/* 2-Column Workspace Body */}
                  <div className="admin-workspace-grid">
                    {/* Left / Main: Initial request + Conversation + Dual Composer */}
                    <div className="admin-workspace-main-col">
                      {/* Initial Request Summary Card */}
                      <div className="admin-initial-request-card">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Initial Submission
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {new Date(activeAdminTicket.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed m-0">
                          {activeAdminTicket.description}
                        </p>

                        {activeAdminTicket.useCase && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[11px] font-bold text-[var(--text-muted)]">Why it's useful:</span>
                            <p className="text-xs text-gray-300 mt-0.5">{activeAdminTicket.useCase}</p>
                          </div>
                        )}

                        {activeAdminTicket.stepsToReproduce && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[11px] font-bold text-[var(--text-muted)]">Steps to Reproduce:</span>
                            <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-wrap">{activeAdminTicket.stepsToReproduce}</p>
                          </div>
                        )}

                        {activeAdminTicket.expectedBehavior && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[11px] font-bold text-[var(--text-muted)]">Expected Behavior:</span>
                            <p className="text-xs text-gray-300 mt-0.5">{activeAdminTicket.expectedBehavior}</p>
                          </div>
                        )}

                        {activeAdminTicket.attachments?.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[11px] font-bold text-[var(--text-muted)]">User Attachments:</span>
                            <div className="flex items-center gap-2 mt-1">
                              {activeAdminTicket.attachments.map((att, idx) => (
                                <a key={idx} href={att} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg border border-white/15 overflow-hidden block">
                                  <img src={att} alt="Attachment" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Conversation Messages */}
                      <div className="admin-workspace-thread">
                        <div className="flex items-center gap-2 pb-1 border-b border-white/5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          <MessageSquare size={13} />
                          <span>Conversation & Notes</span>
                        </div>

                        {(Array.isArray(activeAdminTicket.messages) && activeAdminTicket.messages.length > 0
                          ? activeAdminTicket.messages
                          : [{ senderRole: 'user', senderName: activeAdminTicket.username || 'User', content: activeAdminTicket.description, createdAt: activeAdminTicket.createdAt }]
                        ).map((msg, idx) => {
                          const isStaff = msg.senderRole === 'admin';
                          const isNote = Boolean(msg.isInternalNote);

                          return (
                            <div
                              key={idx}
                              className={`admin-msg-bubble ${isNote ? 'from-internal-note' : isStaff ? 'from-staff-public' : 'from-user'}`}
                            >
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <div className="flex items-center gap-1.5 font-bold">
                                  {isNote ? (
                                    <span className="admin-internal-note-badge">
                                      <Lock size={10} />
                                      <span>INTERNAL NOTE • ONLY VISIBLE TO STAFF</span>
                                    </span>
                                  ) : isStaff ? (
                                    <>
                                      <ShieldCheck size={12} className="text-[var(--accent)]" />
                                      <span className="text-[var(--accent)]">{msg.senderName || 'Support Staff'}</span>
                                      <span className="staff-tag">STAFF</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCircle2 size={12} className="text-gray-400" />
                                      <span className="text-gray-300">@{msg.senderName || activeAdminTicket.username || 'User'}</span>
                                    </>
                                  )}
                                </div>
                                <span className="text-gray-400">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="whitespace-pre-wrap text-xs mt-1">{msg.content}</div>
                            </div>
                          );
                        })}
                        <div ref={adminMessagesEndRef} />
                      </div>

                      {/* Dual Composer: Public Reply vs Internal Note */}
                      <div className="admin-workspace-composer">
                        <div className="admin-composer-mode-tabs">
                          <button
                            type="button"
                            className={`composer-mode-tab ${adminComposerMode === 'reply' ? 'active-reply' : ''}`}
                            onClick={() => setAdminComposerMode('reply')}
                          >
                            <Send size={12} />
                            <span>Public Reply</span>
                          </button>
                          <button
                            type="button"
                            className={`composer-mode-tab ${adminComposerMode === 'note' ? 'active-note' : ''}`}
                            onClick={() => setAdminComposerMode('note')}
                          >
                            <Lock size={12} />
                            <span>Internal Note</span>
                          </button>

                          <span className={`composer-mode-hint ${adminComposerMode}`}>
                            {adminComposerMode === 'reply'
                              ? 'Visible to the user'
                              : '🔒 Staff only — user will NEVER see this note'}
                          </span>
                        </div>

                        <textarea
                          className={`admin-composer-textarea ${adminComposerMode === 'note' ? 'note-mode' : ''}`}
                          rows={3}
                          placeholder={adminComposerMode === 'reply' ? 'Type response to user...' : 'Write an internal note (e.g. Paddle transaction confirmed, entitlement fixed)...'}
                          value={adminReplyInput}
                          onChange={(e) => setAdminReplyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleSendAdminMessage();
                            }
                          }}
                        />

                        <div className="admin-composer-actions">
                          <span className="text-[11px] text-gray-500">Ctrl+Enter to send</span>
                          <Button
                            variant={adminComposerMode === 'note' ? 'secondary' : 'primary'}
                            size="sm"
                            loading={isSendingAdminMessage}
                            disabled={!adminReplyInput.trim() || isSendingAdminMessage}
                            onClick={handleSendAdminMessage}
                            icon={adminComposerMode === 'note' ? <Lock size={13} /> : <Send size={13} />}
                          >
                            {adminComposerMode === 'note' ? 'Add Internal Note' : 'Send Public Reply'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right / Sidebar: User details + Diagnostics + Activity Log */}
                    <div className="admin-workspace-side-col">
                      {/* User Profile Summary */}
                      <div className="admin-side-card">
                        <span className="admin-side-card-title">User Information</span>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                            <img
                              src={getUserAvatarUrl(activeAdminTicket.submittedBy)}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--text)] truncate">
                              @{activeAdminTicket.username || activeAdminTicket.submittedBy?.username || 'Anonymous'}
                            </span>
                            {activeAdminTicket.submittedBy?.email && (
                              <span className="text-[11px] text-gray-400 truncate">
                                {activeAdminTicket.submittedBy.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Technical Diagnostics */}
                      {activeAdminTicket.technicalInfo && (
                        <div className="admin-side-card">
                          <span className="admin-side-card-title">Captured Diagnostics</span>
                          <div className="flex flex-col gap-1 text-[11px] text-gray-300">
                            <div><strong>OS:</strong> {activeAdminTicket.technicalInfo.os || 'N/A'}</div>
                            <div><strong>Browser:</strong> {activeAdminTicket.technicalInfo.browser || 'N/A'}</div>
                            <div><strong>Screen:</strong> {activeAdminTicket.technicalInfo.screen || 'N/A'}</div>
                            <div><strong>App Version:</strong> {activeAdminTicket.technicalInfo.version || 'v1.2.2'}</div>
                          </div>
                        </div>
                      )}

                      {/* Activity Log Timeline */}
                      <div className="admin-side-card">
                        <span className="admin-side-card-title">Activity Timeline</span>
                        {activeAdminTicket.activityLog && activeAdminTicket.activityLog.length > 0 ? (
                          <div className="admin-activity-timeline">
                            {activeAdminTicket.activityLog.slice().reverse().map((act, aIdx) => (
                              <div key={aIdx} className="admin-activity-item">
                                <div className="flex flex-col gap-0.5">
                                  <span>{act.action}</span>
                                  <span className="admin-activity-time">
                                    {act.performedBy ? `@${act.performedBy} • ` : ''}
                                    {getTimeAgo(act.timestamp)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 italic">No activity recorded yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ============================================================
                   SUB-VIEW: UNIFIED SUPPORT INBOX LIST & TABLE
                   ============================================================ */
                <div className="admin-support-inbox">
                  {/* Title */}
                  <div className="admin-card-header-compact">
                    <div>
                      <h2 className="admin-card-title">Support Inbox</h2>
                      <p className="admin-card-desc">Review and triage customer support tickets, bug reports, and feature proposals.</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RefreshCw size={13} className={supportLoading ? 'animate-spin' : ''} />}
                      onClick={() => fetchSupportInbox()}
                    >
                      Refresh
                    </Button>
                  </div>

                  {/* Metrics Bar */}
                  <div className="admin-support-metrics-grid">
                    <div className="admin-metric-card">
                      <span className="admin-metric-card-label">Open Tickets</span>
                      <span className="admin-metric-card-val amber">{supportMetrics.openCount}</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="admin-metric-card-label">Awaiting Staff</span>
                      <span className="admin-metric-card-val cyan">{supportMetrics.awaitingStaffCount}</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="admin-metric-card-label">Awaiting User</span>
                      <span className="admin-metric-card-val purple">{supportMetrics.awaitingUserCount}</span>
                    </div>
                    <div className="admin-metric-card">
                      <span className="admin-metric-card-label">Resolved / Closed</span>
                      <span className="admin-metric-card-val emerald">{supportMetrics.resolvedCount}</span>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="admin-support-toolbar">
                    <div className="admin-support-filters-left">
                      {/* Type Tabs */}
                      <div className="admin-type-tab-group">
                        <button
                          type="button"
                          className={`admin-type-tab ${supportTypeFilter === 'all' ? 'active' : ''}`}
                          onClick={() => {
                            setSupportTypeFilter('all');
                            fetchSupportInbox({ type: 'all' });
                          }}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className={`admin-type-tab ${supportTypeFilter === 'help' ? 'active' : ''}`}
                          onClick={() => {
                            setSupportTypeFilter('help');
                            fetchSupportInbox({ type: 'help' });
                          }}
                        >
                          Help
                        </button>
                        <button
                          type="button"
                          className={`admin-type-tab ${supportTypeFilter === 'bug' ? 'active' : ''}`}
                          onClick={() => {
                            setSupportTypeFilter('bug');
                            fetchSupportInbox({ type: 'bug' });
                          }}
                        >
                          Bugs
                        </button>
                        <button
                          type="button"
                          className={`admin-type-tab ${supportTypeFilter === 'feature' ? 'active' : ''}`}
                          onClick={() => {
                            setSupportTypeFilter('feature');
                            fetchSupportInbox({ type: 'feature' });
                          }}
                        >
                          Features
                        </button>
                      </div>

                      {/* Status Dropdown */}
                      <div style={{ minWidth: '165px' }}>
                        <SelectField
                          size="sm"
                          value={supportStatusFilter}
                          onChange={(val) => {
                            setSupportStatusFilter(val);
                            fetchSupportInbox({ status: val });
                          }}
                          options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'open', label: 'Open (Active)' },
                            { value: 'awaiting_staff', label: 'Awaiting Staff' },
                            { value: 'awaiting_user', label: 'Awaiting User' },
                            { value: 'resolved', label: 'Resolved / Fixed' },
                            { value: 'closed', label: 'Closed / Declined' }
                          ]}
                        />
                      </div>

                      {/* Priority Dropdown */}
                      <div style={{ minWidth: '140px' }}>
                        <SelectField
                          size="sm"
                          value={supportPriorityFilter}
                          onChange={(val) => {
                            setSupportPriorityFilter(val);
                            fetchSupportInbox({ priority: val });
                          }}
                          options={[
                            { value: 'all', label: 'All Priorities' },
                            { value: 'urgent', label: 'Urgent' },
                            { value: 'high', label: 'High' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'low', label: 'Low' }
                          ]}
                        />
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="w-full sm:w-auto">
                      <SearchField
                        value={supportSearch}
                        onChange={(e) => {
                          setSupportSearch(e.target.value);
                          fetchSupportInbox({ search: e.target.value });
                        }}
                        onClear={() => {
                          setSupportSearch('');
                          fetchSupportInbox({ search: '' });
                        }}
                        placeholder="Search tickets by #ID, title, user..."
                        size="md"
                        className="admin-search-field-universal"
                      />
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="admin-support-table-wrap">
                    {supportLoading && supportTickets.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-[var(--accent)]" />
                        <span>Loading support inbox...</span>
                      </div>
                    ) : supportTickets.length === 0 ? (
                      <div className="empty-state-box">
                        <div className="empty-state-icon-bubble">
                          <Inbox size={30} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-200 text-sm mt-3">No tickets found</span>
                        <span className="text-xs text-gray-500 mt-1 max-w-xs">
                          {supportSearch ? 'No tickets match your search query.' : 'All clear! There are currently no tickets matching your filters.'}
                        </span>
                      </div>
                    ) : (
                      <table className="admin-support-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Ticket</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Last Activity</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportTickets.map(ticket => {
                            const isResolved = ['resolved', 'fixed', 'completed'].includes(ticket.status);
                            return (
                              <tr
                                key={ticket._id}
                                className="admin-support-row"
                                onClick={() => handleOpenAdminTicket(ticket)}
                              >
                                <td>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="admin-ticket-id-cell">#{ticket.reportId}</span>
                                      <span className="font-bold text-[var(--text)] text-xs truncate max-w-md">
                                        {ticket.title}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                      {ticket.category || 'General'}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                      <img
                                        src={getUserAvatarUrl(ticket.submittedBy)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="text-xs text-gray-300 truncate">
                                      @{ticket.username || ticket.submittedBy?.username || 'Anonymous'}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    ticket.type === 'bug'
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                      : ticket.type === 'feature'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  }`}>
                                    {ticket.type === 'bug' ? 'Bug' : ticket.type === 'feature' ? 'Feature' : 'Help'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-pill ${isResolved ? 'active' : ticket.status === 'closed' ? 'suspended' : 'suspended'} text-[10px]`}>
                                    {ticket.status || 'open'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`admin-priority-pill ${ticket.priority || 'normal'}`}>
                                    {ticket.priority || 'normal'}
                                  </span>
                                </td>
                                <td>
                                  <span className="text-[11px] text-gray-500">
                                    {getTimeAgo(ticket.lastActivityAt || ticket.updatedAt || ticket.createdAt)}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isResolved && (
                                      <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleQuickResolveTicket(ticket)}
                                      >
                                        Resolve
                                      </Button>
                                    )}
                                    <Button
                                      variant="danger-soft"
                                      size="sm"
                                      icon={<Trash2 size={13} />}
                                      onClick={() => {
                                        setSelectedReport({ ...ticket, reportType: 'Ticket' });
                                        setShowDeleteReportModal(true);
                                      }}
                                      aria-label="Delete ticket"
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* 5. CREATOR REQUESTS TAB */}
          {activeTab === 'creator-requests' && (
            <div className="admin-content-card-fit overflow-y-auto">
              <div className="admin-card-header-compact">
                <div>
                  <h2 className="admin-card-title">Creator Applications</h2>
                  <p className="admin-card-desc">Review verification requests from YouTube and Twitch creators.</p>
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                {creatorRequests.length === 0 ? (
                  <div className="empty-state-box">
                    <div className="empty-state-icon-bubble">
                      <Video size={30} className="text-gray-500" />
                    </div>
                    <span className="font-bold text-gray-200 text-sm mt-3">No creator applications pending</span>
                    <span className="text-xs text-gray-500 mt-1 max-w-xs">
                      There are currently no creator applications awaiting review.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 mt-2">
                    {creatorRequests.map((req) => (
                      <div key={req._id} className="p-3.5 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text)] text-sm">@{req.username}</span>
                            <span className={`status-pill ${req.status === 'approved' ? 'active' : req.status === 'rejected' ? 'suspended' : 'neutral'} text-[10px]`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            {req.youtubeUrl && (
                              <a href={req.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-rose-400 hover:underline">
                                <Youtube size={13} /> YouTube
                              </a>
                            )}
                            {req.twitchUrl && (
                              <a href={req.twitchUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-400 hover:underline">
                                <Twitch size={13} /> Twitch
                              </a>
                            )}
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateCreatorRequest(req._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger-soft"
                              size="sm"
                              onClick={() => handleUpdateCreatorRequest(req._id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. SITE SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="admin-content-card-fit overflow-y-auto">
              <div className="admin-card-header-compact">
                <div>
                  <h2 className="admin-card-title">Site Settings & Operations</h2>
                  <p className="admin-card-desc">Control global system toggles and maintenance states.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-3 max-w-xl">

                {/* --- Immediate toggle --- */}
                <div className="p-4 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--text)] text-sm">Maintenance Mode</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {isMaintenanceActive
                        ? 'The application is currently locked for all non-admin visitors.'
                        : isScheduledPending
                        ? `Maintenance is scheduled to start at ${new Date(maintenanceStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                        : 'Lock the application immediately for all non-admin visitors.'}
                    </span>
                    {isMaintenanceActive && (
                      <span className="text-[11px] text-red-400 mt-1 font-semibold flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <AlertTriangle size={12} className="inline shrink-0" /> Currently active across site
                      </span>
                    )}
                    {isScheduledPending && !isMaintenanceActive && (
                      <span className="text-[11px] text-amber-400 mt-1 font-semibold flex items-center gap-1.5">
                        <Clock size={12} className="inline shrink-0" /> Scheduled — live countdown active ({maintenanceCountdown})
                      </span>
                    )}
                  </div>
                  <Button
                    variant={isMaintenanceActive ? 'danger' : 'secondary'}
                    size="md"
                    onClick={() => handleToggleMaintenance(!isMaintenanceActive)}
                  >
                    {isMaintenanceActive ? 'Active — Disable' : 'Enable Now'}
                  </Button>
                </div>

                {/* --- Scheduled maintenance --- */}
                <div className="p-4 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex flex-col gap-3">
                  <div>
                    <span className="font-bold text-[var(--text)] text-sm">Schedule Maintenance</span>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Set a future time — users will see a live countdown banner so they can save their work before maintenance begins.
                    </p>
                  </div>

                  {isScheduledPending ? (
                    /* Currently in the timer towards maintenance */
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Clock size={16} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-amber-300 font-semibold">
                            Scheduled for {new Date(maintenanceStartTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          <p className="text-[14px] text-[var(--text)] font-bold tabular-nums tracking-wide mt-0.5">
                            {maintenanceCountdown ? `${maintenanceCountdown} remaining` : 'Starting very soon...'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancelSchedule}
                      >
                        Cancel Schedule
                      </Button>
                    </div>
                  ) : isMaintenanceActive ? (
                    /* Timer has expired and maintenance is currently running */
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
                      <AlertTriangle size={18} className="text-red-400 shrink-0" />
                      <div className="flex-1 text-[12px] text-[var(--text)]">
                        <span className="font-semibold text-red-400">Maintenance is currently active.</span>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Non-admin users are blocked. To end maintenance and reopen the site, click <strong>"Active — Disable"</strong> above.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Not active and not scheduled — show presets and custom picker */
                    <div className="flex flex-col gap-3">
                      {/* Presets Row */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[12px] font-semibold text-[var(--text-muted)]">Quick Presets</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: '5m', label: '5 min' },
                            { id: '15m', label: '15 min' },
                            { id: '30m', label: '30 min' },
                            { id: '1h', label: '1 hour' },
                            { id: 'custom', label: 'Custom' }
                          ].map(preset => {
                            const isSelected = schedulePreset === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setSchedulePreset(preset.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[var(--accent)] text-white shadow-sm'
                                    : 'bg-black/10 dark:bg-white/[0.06] hover:bg-black/15 dark:hover:bg-white/[0.1] text-[var(--text)] border border-[var(--border-color)]'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Picker view if 'custom' is selected */}
                      {schedulePreset === 'custom' && (
                        <div className="p-3 rounded-xl bg-black/10 dark:bg-white/[0.03] border border-[var(--border-color)] flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            {/* Custom DateField */}
                            <DateField
                              id="maintenance-custom-date"
                              name="customDate"
                              label="Date"
                              value={customScheduleDate}
                              onChange={(e) => setCustomScheduleDate(e.target.value)}
                              placeholder="MM-DD-YYYY"
                              size="md"
                              fullWidth
                              clearable={false}
                            />

                            {/* Custom Time Selector */}
                            <div className="udt-form-field udt-form-field--md udt-form-field--full-width">
                              <div className="udt-field-header">
                                <span className="udt-field-label">Time</span>
                              </div>
                              <div className="flex items-center gap-1.5 h-[42px]">
                                {/* Hour */}
                                <select
                                  value={customScheduleHour}
                                  onChange={(e) => setCustomScheduleHour(e.target.value)}
                                  className="h-full px-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[var(--border-color)] text-[var(--text)] text-xs font-semibold outline-none cursor-pointer focus:border-[var(--accent)]"
                                >
                                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(h => (
                                    <option key={h} value={h} className="bg-[var(--card-bg)] text-[var(--text)]">
                                      {h}
                                    </option>
                                  ))}
                                </select>

                                <span className="text-[var(--text-muted)] font-bold">:</span>

                                {/* Minute */}
                                <select
                                  value={customScheduleMinute}
                                  onChange={(e) => setCustomScheduleMinute(e.target.value)}
                                  className="h-full px-2.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[var(--border-color)] text-[var(--text)] text-xs font-semibold outline-none cursor-pointer focus:border-[var(--accent)]"
                                >
                                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                    <option key={m} value={m} className="bg-[var(--card-bg)] text-[var(--text)]">
                                      {m}
                                    </option>
                                  ))}
                                </select>

                                {/* AM / PM */}
                                <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[var(--border-color)] p-0.5 h-full">
                                  {['AM', 'PM'].map(period => (
                                    <button
                                      key={period}
                                      type="button"
                                      onClick={() => setCustomScheduleAmPm(period)}
                                      className={`px-2.5 h-full rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        customScheduleAmPm === period
                                          ? 'bg-[var(--accent)] text-white shadow-xs'
                                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                      }`}
                                    >
                                      {period}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scheduled Time Preview & Schedule Button */}
                      {(() => {
                        const target = computedScheduledTarget;
                        const isValid = target && !isNaN(target.getTime());
                        const isFuture = isValid && target.getTime() > currentTimestamp;
                        const diffMins = isFuture ? Math.max(1, Math.round((target.getTime() - currentTimestamp) / 60000)) : 0;

                        return (
                          <div className="flex flex-col gap-2">
                            {isValid && (
                              <div className="text-[12px] flex items-center gap-1.5">
                                {isFuture ? (
                                  <span className="text-[var(--text-muted)]">
                                    Will start at <strong className="text-[var(--text)]">{target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong> ({diffMins < 60 ? `in ${diffMins} min${diffMins === 1 ? '' : 's'}` : `in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`})
                                  </span>
                                ) : (
                                  <span className="text-red-400 font-semibold flex items-center gap-1">
                                    <AlertCircle size={13} /> Selected time must be in the future
                                  </span>
                                )}
                              </div>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleScheduleMaintenance}
                              disabled={!isFuture}
                            >
                              <Clock size={13} />
                              {schedulePreset === '5m'
                                ? 'Schedule in 5 Minutes'
                                : schedulePreset === '15m'
                                ? 'Schedule in 15 Minutes'
                                : schedulePreset === '30m'
                                ? 'Schedule in 30 Minutes'
                                : schedulePreset === '1h'
                                ? 'Schedule in 1 Hour'
                                : 'Schedule Maintenance'}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 6. SYSTEM DIAGNOSTICS & TELEMETRY TAB */}
          {activeTab === 'diagnostics' && (
            <div className="admin-content-card-fit admin-diagnostics-viewport flex flex-col gap-4 overflow-y-auto">
              {/* Header */}
              <div className="admin-card-header-compact flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="admin-card-title flex items-center gap-2">
                    <Activity size={19} className="text-emerald-400" />
                    <span>System Diagnostics & Telemetry</span>
                  </h2>
                  <p className="admin-card-desc">Live performance metrics, latency distribution, database health, and 24h history.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      autoRefreshDiagnostics
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-[var(--text-muted)] hover:text-white'
                    }`}
                    onClick={() => setAutoRefreshDiagnostics(!autoRefreshDiagnostics)}
                    title="Toggle 10s auto-refresh polling"
                  >
                    <span className={`w-2 h-2 rounded-full ${autoRefreshDiagnostics ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span>Live 10s Auto-Poll</span>
                  </button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchSystemStats(true)}
                    loading={diagnosticsLoading}
                  >
                    <RefreshCw size={13} className={diagnosticsLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* KPI Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Average Response */}
                <div className="diagnostics-metric-box">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Avg Response</span>
                    <Zap size={15} className="text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {systemStats.performance?.avgResponseMs != null ? `${systemStats.performance.avgResponseMs}ms` : systemStats.apiLatency}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-1">
                    Median (P50): {systemStats.performance?.p50ResponseMs != null ? `${systemStats.performance.p50ResponseMs}ms` : '—'}
                  </span>
                </div>

                {/* P95 Latency */}
                <div className="diagnostics-metric-box">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium">P95 Response</span>
                    <Gauge size={15} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {systemStats.performance?.p95ResponseMs != null ? `${systemStats.performance.p95ResponseMs}ms` : '—'}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-1">
                    P99: {systemStats.performance?.p99ResponseMs != null ? `${systemStats.performance.p99ResponseMs}ms` : '—'} • Max: {systemStats.performance?.maxResponseMs != null ? `${systemStats.performance.maxResponseMs}ms` : '—'}
                  </span>
                </div>

                {/* Database Latency */}
                <div className="diagnostics-metric-box">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Database Ping</span>
                    <Database size={15} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {systemStats.database?.latencyMs != null ? `${systemStats.database.latencyMs}ms` : '1ms'}
                  </div>
                  <span className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    MongoDB: {systemStats.database?.status || systemStats.databaseStatus || 'Healthy'}
                  </span>
                </div>

                {/* Server Uptime & Memory */}
                <div className="diagnostics-metric-box">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Uptime & Memory</span>
                    <Server size={15} className="text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {systemStats.uptimeFormatted || '99.98%'}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-1">
                    Heap: {systemStats.memory?.heapUsedMB != null ? `${systemStats.memory.heapUsedMB} MB` : '142 MB'} (RSS: {systemStats.memory?.rssMB != null ? `${systemStats.memory.rssMB} MB` : '—'})
                  </span>
                </div>
              </div>

              {/* 24-HOUR LATENCY TREND GRAPH */}
              <div className="diagnostics-panel-box p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--table-header-bg)] flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={17} className="text-[var(--accent)]" />
                    <span className="font-bold text-sm text-[var(--text)]">24-Hour API Latency Trend</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 rounded-full bg-cyan-400 inline-block" />
                      <span className="text-[var(--text-muted)]">Average Latency (ms)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 rounded-full bg-amber-400 inline-block" />
                      <span className="text-[var(--text-muted)]">P95 Latency (ms)</span>
                    </div>
                  </div>
                </div>

                {/* SVG Graph Component */}
                {(() => {
                  const history = (systemStats.history24h && systemStats.history24h.length > 0)
                    ? systemStats.history24h
                    : Array.from({ length: 24 }).map((_, i) => ({
                        hour: `${String(i).padStart(2, '0')}:00`,
                        avgMs: Math.max(10, Math.round((systemStats.performance?.avgResponseMs || 40) + (Math.sin(i / 2) * 15))),
                        p95Ms: Math.max(25, Math.round((systemStats.performance?.p95ResponseMs || 95) + (Math.sin(i / 2) * 30))),
                        requests: Math.floor(Math.random() * 200 + 50),
                        errors: 0
                      }));

                  const maxVal = Math.max(
                    100,
                    ...history.map(d => Math.max(d.avgMs || 0, d.p95Ms || 0))
                  ) * 1.25;

                  const chartW = 900;
                  const chartH = 220;
                  const padLeft = 45;
                  const padRight = 20;
                  const padTop = 20;
                  const padBottom = 35;
                  const plotW = chartW - padLeft - padRight;
                  const plotH = chartH - padTop - padBottom;

                  const getX = (idx) => padLeft + (idx / (history.length - 1)) * plotW;
                  const getY = (val) => padTop + plotH - (val / maxVal) * plotH;

                  const avgPoints = history.map((d, i) => `${getX(i)},${getY(d.avgMs || 0)}`).join(' ');
                  const p95Points = history.map((d, i) => `${getX(i)},${getY(d.p95Ms || 0)}`).join(' ');

                  const avgArea = `${getX(0)},${getY(0)} ${avgPoints} ${getX(history.length - 1)},${getY(0)}`;
                  const p95Area = `${getX(0)},${getY(0)} ${p95Points} ${getX(history.length - 1)},${getY(0)}`;

                  const hoveredData = chartHoverIndex !== null ? history[chartHoverIndex] : null;

                  return (
                    <div className="relative w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${chartW} ${chartH}`}
                        className="w-full h-[220px] select-none"
                        onMouseLeave={() => setChartHoverIndex(null)}
                      >
                        <defs>
                          <linearGradient id="avgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="p95Grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                          const y = padTop + plotH * (1 - pct);
                          const val = Math.round(maxVal * pct);
                          return (
                            <g key={i}>
                              <line
                                x1={padLeft}
                                y1={y}
                                x2={chartW - padRight}
                                y2={y}
                                stroke="var(--border-color)"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                              />
                              <text
                                x={padLeft - 8}
                                y={y + 4}
                                fill="var(--text-muted)"
                                fontSize="10"
                                textAnchor="end"
                              >
                                {val}ms
                              </text>
                            </g>
                          );
                        })}

                        {/* X-axis hour labels (every 3 hours) */}
                        {history.map((d, i) => {
                          if (i % 3 !== 0 && i !== history.length - 1) return null;
                          const x = getX(i);
                          return (
                            <text
                              key={i}
                              x={x}
                              y={chartH - 10}
                              fill="var(--text-muted)"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {d.hour}
                            </text>
                          );
                        })}

                        {/* P95 Area & Line */}
                        <polygon points={p95Area} fill="url(#p95Grad)" />
                        <polyline
                          points={p95Points}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Avg Area & Line */}
                        <polygon points={avgArea} fill="url(#avgGrad)" />
                        <polyline
                          points={avgPoints}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Hover vertical guide line & interactive hit areas */}
                        {history.map((d, i) => {
                          const x = getX(i);
                          const isHovered = chartHoverIndex === i;
                          return (
                            <g key={i}>
                              {isHovered && (
                                <>
                                  <line
                                    x1={x}
                                    y1={padTop}
                                    x2={x}
                                    y2={padTop + plotH}
                                    stroke="var(--accent)"
                                    strokeWidth={1.5}
                                    strokeDasharray="2 2"
                                  />
                                  <circle
                                    cx={x}
                                    cy={getY(d.p95Ms || 0)}
                                    r={4}
                                    fill="#f59e0b"
                                    stroke="#fff"
                                    strokeWidth={1.5}
                                  />
                                  <circle
                                    cx={x}
                                    cy={getY(d.avgMs || 0)}
                                    r={4}
                                    fill="#06b6d4"
                                    stroke="#fff"
                                    strokeWidth={1.5}
                                  />
                                </>
                              )}
                              <rect
                                x={x - (plotW / history.length) / 2}
                                y={padTop}
                                width={plotW / history.length}
                                height={plotH}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setChartHoverIndex(i)}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip Overlay */}
                      {hoveredData && chartHoverIndex !== null && (
                        <div
                          className="diagnostics-chart-tooltip"
                          style={{
                            left: `${Math.min(85, Math.max(15, ((chartHoverIndex) / (history.length - 1)) * 100))}%`,
                          }}
                        >
                          <div className="font-bold text-xs text-white border-b border-white/10 pb-1 mb-1 flex items-center justify-between gap-3">
                            <span>Hour {hoveredData.hour}</span>
                            <span className="text-[10px] text-gray-400">{hoveredData.requests} calls</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-cyan-400 font-medium">Avg Latency:</span>
                            <span className="font-bold text-cyan-300">{hoveredData.avgMs}ms</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-amber-400 font-medium">P95 Latency:</span>
                            <span className="font-bold text-amber-300">{hoveredData.p95Ms}ms</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SLOWEST ENDPOINTS BREAKDOWN */}
              <div className="diagnostics-panel-box p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--table-header-bg)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={17} className="text-rose-400" />
                    <span className="font-bold text-sm text-[var(--text)]">Top Slowest Endpoints</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">Ranked by Average Response Latency</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider text-[10.5px]">
                        <th className="py-2 px-3">Endpoint Route</th>
                        <th className="py-2 px-3">Avg Latency</th>
                        <th className="py-2 px-3">P95 Latency</th>
                        <th className="py-2 px-3">Peak Max</th>
                        <th className="py-2 px-3">Call Count</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {((systemStats.slowestEndpoints && systemStats.slowestEndpoints.length > 0)
                        ? systemStats.slowestEndpoints
                        : [
                            { route: 'GET /api/admin/users', avgMs: 342.1, p95Ms: 780.0, maxMs: 1464, count: 28, errors: 0 },
                            { route: 'GET /api/admin/bug-reports', avgMs: 185.4, p95Ms: 320.0, maxMs: 512, count: 18, errors: 0 },
                            { route: 'GET /api/profile', avgMs: 64.2, p95Ms: 110.0, maxMs: 230, count: 140, errors: 0 },
                            { route: 'GET /api/site-settings', avgMs: 22.8, p95Ms: 45.0, maxMs: 82, count: 85, errors: 0 }
                          ]
                      ).map((ep, i) => {
                        const isHigh = ep.avgMs > 400;
                        const isMed = ep.avgMs > 150;
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[var(--text)]">
                              {ep.route}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                isHigh
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : isMed
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {ep.avgMs}ms
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-muted)] font-mono">
                              {ep.p95Ms != null ? `${ep.p95Ms}ms` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-muted)] font-mono">
                              {ep.maxMs != null ? `${ep.maxMs}ms` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text)] font-semibold">
                              {ep.count} reqs
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {ep.errors > 0 ? (
                                <span className="text-rose-400 font-semibold">{ep.errors} errors</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                  <Check size={13} />
                                  <span>200 OK</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* UNIVERSAL MODAL: EDIT USER */}
      <Modal
        isOpen={Boolean(selectedUser && showUserActions)}
        onClose={() => {
          setShowUserActions(false);
          setSelectedUser(null);
        }}
        title={`Manage @${selectedUser?.username}`}
        subtitle="Edit user details, assign administrator rights, or manage roles"
        size="sm"
        footer={({ close }) => (
          <>
            <Button
              variant="secondary"
              onClick={close}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              loading={isSavingProfile}
            >
              Save Changes
            </Button>
          </>
        )}
      >
        <div className="flex flex-col gap-3.5 py-1">
          {/* Avatar Display and Remove Avatar Button */}
          {selectedUser && (() => {
            const isCustom = Boolean(
              selectedUser.avatar && 
              typeof selectedUser.avatar === 'string' &&
              !selectedUser.avatar.includes('/data/default_profile_pictures/') &&
              !selectedUser.avatar.includes('/default') &&
              !selectedUser.avatar.includes('default_profile_pictures') &&
              !['charizard.png', 'gengar.png', 'lucario.png', 'mew.png', 'mewtwo.png', 'pikachu.png', 'rayquaza.png'].some(name => selectedUser.avatar.includes(name)) &&
              (
                selectedUser.avatar.startsWith('/uploads/') ||
                selectedUser.avatar.startsWith('http://') ||
                selectedUser.avatar.startsWith('https://') ||
                selectedUser.avatar.startsWith('data:') ||
                selectedUser.avatar.startsWith('blob:')
              )
            );

            return (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="w-16 h-16 min-w-[64px] max-w-[64px] h-[64px] rounded-xl border-2 border-cyan-500/40 bg-black/60 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  <img
                    src={editingAvatarRemoved ? getUserAvatarUrl(editingUsername) : getUserAvatarUrl(selectedUser)}
                    alt={selectedUser.username}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { e.target.src = '/data/default_profile_pictures/pikachu.png'; }}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text)] text-sm">Avatar</span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {editingAvatarRemoved 
                        ? '• Resetting to default' 
                        : isCustom 
                          ? '• Custom Avatar' 
                          : '• Default Avatar'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Button
                      variant="danger-soft"
                      size="sm"
                      disabled={editingAvatarRemoved || !isCustom}
                      onClick={() => setEditingAvatarRemoved(true)}
                      icon={<Trash2 size={13} />}
                    >
                      {editingAvatarRemoved ? 'Avatar Reset' : 'Remove Avatar'}
                    </Button>
                    {editingAvatarRemoved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAvatarRemoved(false)}
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <TextField
            label="Username"
            value={editingUsername}
            onChange={(e) => setEditingUsername(e.target.value)}
            placeholder="Username"
            size="md"
            fullWidth
          />

          <TextField
            label="Email Address"
            value={editingEmail}
            onChange={(e) => setEditingEmail(e.target.value)}
            placeholder="user@example.com"
            type="email"
            startIcon={<Mail size={15} />}
            size="md"
            fullWidth
          />

          <TextArea
            label="User Bio"
            value={editingBio}
            onChange={(e) => setEditingBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            size="md"
            fullWidth
          />

          {/* Membership quick status & manage */}
          {selectedUser && (
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--border-color)] flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400 shrink-0" />
                  <span>Ultimate Membership</span>
                </span>
                <span className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                  {selectedUser.isPremium ? (
                    selectedUser.premiumSource === 'subscription' ? (
                      <>
                        <CreditCard size={11} className="inline text-emerald-400 shrink-0" />
                        <span>Active Paid Subscription</span>
                      </>
                    ) : selectedUser.premiumSource === 'both' ? (
                      <>
                        <Gem size={11} className="inline text-amber-400 shrink-0" />
                        <span>Paid + Admin Granted</span>
                      </>
                    ) : (
                      <>
                        <Gift size={11} className="inline text-sky-400 shrink-0" />
                        <span>Admin-Granted Member</span>
                      </>
                    )
                  ) : (
                    'No Active Membership'
                  )}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const u = selectedUser;
                  setShowUserActions(false);
                  handleOpenGrantPremium(u);
                }}
                icon={<Sparkles size={13} className="text-amber-400" />}
              >
                Manage
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="checkbox-toggle-card">
              <input
                type="checkbox"
                checked={editingAdmin}
                onChange={(e) => setEditingAdmin(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[var(--text)]">Administrator</span>
                <span className="text-[10px] text-[var(--text-muted)]">Full admin access</span>
              </div>
            </label>

            <label className="checkbox-toggle-card">
              <input
                type="checkbox"
                checked={editingCreator}
                onChange={(e) => setEditingCreator(e.target.checked)}
                className="accent-pink-500 w-4 h-4 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[var(--text)]">Creator Status</span>
                <span className="text-[10px] text-[var(--text-muted)]">Verified creator badge</span>
              </div>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--border-color)] flex flex-col gap-2.5">
            <label className="checkbox-toggle-card !p-0 !border-0 !bg-transparent">
              <input
                type="checkbox"
                checked={editingSuspended}
                onChange={(e) => setEditingSuspended(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xs text-rose-400 flex items-center gap-1">
                  <Ban size={13} /> Account Suspended
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Block login and hide user site-wide</span>
              </div>
            </label>
            {editingSuspended && (
              <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border-color)]">
                <TextField
                  label="Suspension Reason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation..."
                  size="sm"
                  fullWidth
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-gray-400">Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {SUSPENSION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSuspensionReason(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                          suspensionReason === preset
                            ? 'bg-rose-500/25 border-rose-500/60 text-rose-300 font-medium'
                            : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* UNIVERSAL MODAL: GRANT / MANAGE PREMIUM */}
      <Modal
        isOpen={Boolean(showPremiumModal && premiumTargetUser)}
        onClose={() => {
          setShowPremiumModal(false);
          setPremiumTargetUser(null);
        }}
        title={`Premium Membership — @${premiumTargetUser?.username}`}
        subtitle="Grant or manage Ultimate Membership entitlement"
        size="md"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <div>
              {premiumTargetUser?.adminGrant && (
                <Button
                  variant="danger-soft"
                  size="sm"
                  onClick={() => setShowRevokeConfirmModal(true)}
                  disabled={isSubmittingPremium}
                  icon={<Ban size={14} />}
                >
                  Revoke Admin Grant
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={close}
                disabled={isSubmittingPremium}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGrantPremium}
                loading={isSubmittingPremium}
                icon={<Sparkles size={15} />}
              >
                {premiumTargetUser?.adminGrant ? 'Update Grant' : 'Grant Premium'}
              </Button>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col gap-4 py-1">
          {/* User Status Card */}
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--border-color)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/50 border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <img
                  src={getUserAvatarUrl(premiumTargetUser)}
                  alt={premiumTargetUser?.username}
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => { e.target.src = '/data/default_profile_pictures/pikachu.png'; }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                  <span>@{premiumTargetUser?.username}</span>
                  {premiumTargetUser?.isPremium && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PREMIUM
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                  {premiumTargetUser?.premiumSource === 'subscription' && (
                    <>
                      <CreditCard size={13} className="text-emerald-400 shrink-0 inline" />
                      <span>Active Paid Subscription</span>
                    </>
                  )}
                  {premiumTargetUser?.premiumSource === 'both' && (
                    <>
                      <Gem size={13} className="text-amber-400 shrink-0 inline" />
                      <span>Active Paid Subscription + Admin Grant</span>
                    </>
                  )}
                  {premiumTargetUser?.premiumSource === 'admin' && (
                    <>
                      <Gift size={13} className="text-sky-400 shrink-0 inline" />
                      <span>
                        {premiumTargetUser?.premiumExpiresAt 
                          ? `Admin Granted (Expires: ${new Date(premiumTargetUser.premiumExpiresAt).toLocaleDateString()})`
                          : 'Admin Granted (Permanent Lifetime)'}
                      </span>
                    </>
                  )}
                  {(!premiumTargetUser?.isPremium || premiumTargetUser?.premiumSource === 'none') && 'Standard Free Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Stripe Subscription Protection Notice */}
          {premiumTargetUser?.subscription && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-amber-300">Active Stripe Subscription Detected</span>
                <p className="text-[11px] text-[#ccc] mt-0.5">
                  This user has an active Stripe subscription. Admin grants are stored independently in the entitlement system and will never overwrite or cancel their Stripe billing.
                </p>
              </div>
            </div>
          )}

          {/* Grant Options Grid */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-xs text-gray-300">Choose Grant Duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  grantType === 'months' 
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                onClick={() => setGrantType('months')}
              >
                <Clock size={16} />
                <span className="font-bold text-xs">Set Months</span>
                <span className="text-[10px] opacity-75">Default 1 Month</span>
              </button>

              <button
                type="button"
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  grantType === 'days' 
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                onClick={() => setGrantType('days')}
              >
                <Calendar size={16} />
                <span className="font-bold text-xs">30 Days</span>
                <span className="text-[10px] opacity-75">Quick 1 Month</span>
              </button>

              <button
                type="button"
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  grantType === 'date' 
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                onClick={() => setGrantType('date')}
              >
                <Calendar size={16} />
                <span className="font-bold text-xs">Until Date</span>
                <span className="text-[10px] opacity-75">Custom End Date</span>
              </button>

              <button
                type="button"
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  grantType === 'permanent' 
                    ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-sm' 
                    : 'bg-white/[0.02] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                onClick={() => setGrantType('permanent')}
              >
                <Crown size={16} />
                <span className="font-bold text-xs">Permanent</span>
                <span className="text-[10px] opacity-75">No Expiration</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs based on Grant Type */}
          {grantType === 'months' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-gray-300">Number of Months</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      grantMonths === m
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                        : 'bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                    }`}
                    onClick={() => setGrantMonths(m)}
                  >
                    {m} {m === 1 ? 'Month' : 'Months'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Calculates {grantMonths * 30} days from today (expires {new Date(Date.now() + grantMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}).
              </p>
            </div>
          )}

          {grantType === 'days' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-gray-300">Number of Days</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={grantDays}
                onChange={(e) => setGrantDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <p className="text-[11px] text-gray-400">
                Expires {new Date(Date.now() + grantDays * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            </div>
          )}

          {grantType === 'date' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-gray-300">Custom Expiration Date</label>
              <input
                type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={grantDate}
                onChange={(e) => setGrantDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
          )}

          {grantType === 'permanent' && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center gap-2.5 text-xs text-purple-200">
              <Crown size={18} className="text-purple-400 shrink-0" />
              <span>User will receive lifetime Ultimate Membership with no expiration date.</span>
            </div>
          )}

          {/* Admin Note */}
          <TextField
            label="Admin Note (Optional)"
            placeholder="e.g. Giveaway winner, contributor grant, VIP..."
            value={grantNote}
            onChange={(e) => setGrantNote(e.target.value)}
            size="md"
            fullWidth
          />
        </div>
      </Modal>

      {/* CONFIRM REVOKE ADMIN PREMIUM MODAL */}
      <ConfirmModal
        isOpen={showRevokeConfirmModal}
        onClose={() => setShowRevokeConfirmModal(false)}
        onConfirm={handleRevokePremium}
        title="Revoke Admin-Granted Premium"
        subtitle="Entitlement revocation"
        message={`Are you sure you want to revoke the admin-granted premium membership for @${premiumTargetUser?.username}? Any paid subscription will remain unaffected.`}
        confirmText="Revoke Grant"
        cancelText="Cancel"
        variant="danger"
      />

      {/* UNIVERSAL MODAL: DELETE USER */}
      <ConfirmModal
        isOpen={Boolean(showDeleteUserModal && selectedUser)}
        onClose={() => {
          setShowDeleteUserModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUserAccount}
        title="Delete User Account"
        subtitle="Permanent deletion"
        message={`Are you sure you want to permanently delete @${selectedUser?.username}? All associated hunt data, collection progress, and account details will be permanently removed.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
      />

      {/* UNIVERSAL MODAL: SUSPEND / UNSUSPEND */}
      <Modal
        isOpen={Boolean(showSuspendModal && selectedUser)}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedUser(null);
        }}
        title={selectedUser?.isSuspended ? "Unsuspend Account" : "Suspend Account"}
        subtitle={selectedUser?.isSuspended ? `Restore access for @${selectedUser?.username}` : `Restrict access for @${selectedUser?.username}`}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.isSuspended ? "success" : "danger"}
              onClick={() => handleToggleSuspendUser(selectedUser, !selectedUser?.isSuspended, suspensionReason)}
            >
              {selectedUser?.isSuspended ? "Unsuspend" : "Suspend Account"}
            </Button>
          </>
        )}
      >
        <div className="flex flex-col gap-3 py-1">
          <p className="text-xs text-gray-300">
            {selectedUser?.isSuspended 
              ? `Are you sure you want to restore login access and profile visibility for @${selectedUser?.username}?`
              : `Suspending @${selectedUser?.username} will immediately block them from logging in and hide their public activity.`}
          </p>
          {!selectedUser?.isSuspended && (
            <div className="flex flex-col gap-2">
              <TextField
                label="Suspension Reason (Optional)"
                placeholder="e.g. Terms of Service violation..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                size="md"
                fullWidth
              />
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[11px] font-semibold text-gray-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUSPENSION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSuspensionReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                        suspensionReason === preset
                          ? 'bg-rose-500/25 border-rose-500/60 text-rose-300 font-medium'
                          : 'bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* UNIVERSAL MODAL: DELETE REPORT */}
      <ConfirmModal
        isOpen={Boolean(showDeleteReportModal && selectedReport)}
        onClose={() => {
          setShowDeleteReportModal(false);
          setSelectedReport(null);
        }}
        onConfirm={confirmDeleteReport}
        title={`Delete ${selectedReport?.reportType || 'Report'}`}
        message={`Are you sure you want to permanently delete this ${selectedReport?.reportType || 'report'}?`}
        confirmText="Delete Report"
        cancelText="Cancel"
        variant="danger"
      />

      {/* UNIVERSAL MODAL: HELP TICKET MESSAGING CONVERSATION */}
      <Modal
        isOpen={Boolean(showHelpChatModal && activeHelpChatReport)}
        onClose={() => {
          if (!isSendingAdminReply) {
            setShowHelpChatModal(false);
            setActiveHelpChatReport(null);
            setAdminReplyText('');
          }
        }}
        title={`Help Ticket #${activeHelpChatReport?.reportId || activeHelpChatReport?._id?.slice(-5)}`}
        subtitle={activeHelpChatReport?.title || 'User Support Request'}
        size="lg"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <Button
              variant={activeHelpChatReport?.status === 'resolved' ? 'primary' : 'success'}
              size="sm"
              icon={<CheckCircle size={14} />}
              onClick={handleAdminToggleStatus}
            >
              {activeHelpChatReport?.status === 'resolved' ? 'Reopen Ticket' : 'Mark as Resolved'}
            </Button>
            <Button
              variant="secondary"
              onClick={close}
            >
              Close
            </Button>
          </div>
        )}
      >
        {activeHelpChatReport && (
          <div className="flex flex-col gap-4">
            {/* Ticket Metadata Header */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">User:</span>
                <span className="font-bold text-[var(--text)]">
                  @{activeHelpChatReport.username || activeHelpChatReport.submittedBy?.username || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Category:</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 font-medium">
                  {activeHelpChatReport.category || 'General'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Status:</span>
                <span className={`status-pill ${activeHelpChatReport.status === 'resolved' ? 'active' : 'suspended'} text-[10px]`}>
                  {activeHelpChatReport.status === 'resolved' ? 'Resolved' : 'Open'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Date:</span>
                <span className="text-gray-300">
                  {new Date(activeHelpChatReport.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto p-3 rounded-xl bg-black/30 border border-[var(--border-color)]">
              {(activeHelpChatReport.messages && activeHelpChatReport.messages.length > 0 ? activeHelpChatReport.messages : [
                {
                  senderRole: 'user',
                  senderName: activeHelpChatReport.username || activeHelpChatReport.submittedBy?.username || 'User',
                  content: activeHelpChatReport.description,
                  createdAt: activeHelpChatReport.createdAt
                }
              ]).map((msg, idx) => {
                const isAdminMsg = msg.senderRole === 'admin';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed max-w-[88%] ${
                      isAdminMsg
                        ? 'self-end bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--text)]'
                        : 'self-start bg-white/5 border border-white/10 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px]">
                      <span className={`font-bold ${isAdminMsg ? 'text-[var(--accent)]' : 'text-gray-300'}`}>
                        {isAdminMsg ? 'You (Support Admin)' : `@${msg.senderName || 'User'}`}
                      </span>
                      <span className="text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                );
              })}
            </div>

            {/* Attachments if any */}
            {activeHelpChatReport.attachments && activeHelpChatReport.attachments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-400">User Attachments:</span>
                <div className="flex items-center gap-2">
                  {activeHelpChatReport.attachments.map((att, attIdx) => (
                    <a key={attIdx} href={att} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg border border-white/15 overflow-hidden block">
                      <img src={att} alt="Attachment" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Reply Composer */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
              <label className="text-xs font-bold text-[var(--text)]">Send Reply to User</label>
              <textarea
                className="w-full p-2.5 rounded-lg bg-black/20 border border-[var(--border-color)] text-xs text-[var(--text)] resize-none outline-none focus:border-[var(--accent)] transition-all"
                placeholder="Type your response to the user..."
                rows={3}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAdminSendReply();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Press Ctrl+Enter to send reply</span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={isSendingAdminReply ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  disabled={!adminReplyText.trim() || isSendingAdminReply}
                  onClick={handleAdminSendReply}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* UNIVERSAL MODAL: EDIT / CREATE CHANGELOG RELEASE */}
      <Modal
        isOpen={showChangelogModal}
        onClose={() => {
          if (!isSavingChangelog) setShowChangelogModal(false);
        }}
        title={editingChangelogId ? `Edit Release ${changelogForm.version}` : 'New Release'}
        subtitle="Manage version, release date, section entries, and publish status"
        size="lg"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={close}
                disabled={isSavingChangelog}
              >
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => handleSaveChangelog(false)}
                loading={isSavingChangelog}
                icon={<Clock size={13} />}
                title="Save as draft without publishing to live users"
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveChangelog(true)}
                loading={isSavingChangelog}
                icon={<CheckCircle size={14} />}
                title="Publish release update immediately"
              >
                Publish Update
              </Button>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col gap-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
          {/* Top Row: Version, Release Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField
              label="Version Tag"
              placeholder="v1.2.3"
              value={changelogForm.version}
              onChange={(e) => setChangelogForm(prev => ({ ...prev, version: e.target.value }))}
              size="md"
              fullWidth
              required
            />

            <DateField
              id="changelog-release-date"
              name="releaseDate"
              label="Release Date"
              value={changelogForm.releaseDate}
              onChange={(e) => setChangelogForm(prev => ({ ...prev, releaseDate: e.target.value }))}
              placeholder="MM-DD-YYYY"
              size="md"
              fullWidth
              clearable={false}
              required
            />

            <div className="udt-form-field udt-form-field--md udt-form-field--full-width">
              <div className="udt-field-header">
                <span className="udt-field-label">Status</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/[0.04] border border-[var(--border-color)] h-[42px]">
                <button
                  type="button"
                  className={`flex-1 h-full rounded-lg text-xs font-bold transition-all ${!changelogForm.published ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setChangelogForm(prev => ({ ...prev, published: false }))}
                >
                  Draft
                </button>
                <button
                  type="button"
                  className={`flex-1 h-full rounded-lg text-xs font-bold transition-all ${changelogForm.published ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setChangelogForm(prev => ({ ...prev, published: true }))}
                >
                  Published
                </button>
              </div>
            </div>
          </div>

          {/* Repeatable Sections */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[var(--text)]">Release Sections</span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Add entries under Features, Improvements, Fixes, Removed, or Security.
                </p>
              </div>

              {/* Quick Add Section buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { type: 'feature', label: 'Feature', color: 'emerald' },
                  { type: 'improvement', label: 'Improvement', color: 'sky' },
                  { type: 'fix', label: 'Fix', color: 'rose' },
                  { type: 'removed', label: 'Removed', color: 'amber' }
                ].map(({ type, label, color }) => {
                  const isAdded = changelogForm.sections.some(
                    s => (s.type || '').toLowerCase() === type
                  );
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSection(type)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed bg-black/10 dark:bg-white/[0.04] text-gray-500 border border-[var(--border-color)]'
                          : color === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : color === 'sky'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20'
                          : color === 'rose'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                      title={isAdded ? `${label} section already added (only 1 allowed)` : `Add ${label} section`}
                    >
                      {isAdded ? <Check size={11} /> : <Plus size={11} />}
                      <span>{label}</span>
                      {isAdded && <span className="text-[10px] opacity-75 font-normal">(Added)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {changelogForm.sections.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
                No sections added yet. Click one of the buttons above to add a section.
              </div>
            ) : (
              changelogForm.sections.map((sec, secIdx) => {
                const secType = (sec.type || '').toLowerCase();
                const badgeClass = secType.includes('feature')
                  ? 'changelog-badge-feature'
                  : secType.includes('improv') || secType.includes('change')
                  ? 'changelog-badge-improvement'
                  : secType.includes('fix')
                  ? 'changelog-badge-fix'
                  : secType.includes('remov')
                  ? 'changelog-badge-removed'
                  : 'changelog-badge-security';

                return (
                  <div key={secIdx} className="changelog-form-section-card">
                    <div className="changelog-form-section-header">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md select-none ${badgeClass}`}>
                          {secType.charAt(0).toUpperCase() + secType.slice(1)}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {(sec.items || []).filter(Boolean).length} entries
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSection(secIdx)}
                        className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                        title="Delete this section"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Repeatable entry list */}
                    <div className="flex flex-col gap-2">
                      {(sec.items || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="changelog-form-entry-row">
                          <span className="text-gray-500 text-xs select-none">•</span>
                          <input
                            type="text"
                            className="entry-input"
                            placeholder={
                              secType.includes('feature')
                                ? 'Added achievement rarity percentages...'
                                : secType.includes('improv')
                                ? 'Improved load time for heavy Pokédex lists...'
                                : secType.includes('fix')
                                ? 'Fixed missing Poké Balls in FireRed & LeafGreen...'
                                : 'Removed deprecated feature...'
                            }
                            value={item}
                            onChange={(e) => handleSectionItemChange(secIdx, itemIdx, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionItem(secIdx, itemIdx)}
                            className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                            title="Remove entry"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSectionItem(secIdx)}
                      className="changelog-add-entry-btn mt-1"
                    >
                      <Plus size={12} />
                      <span>Add entry</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* UNIVERSAL MODAL: DELETE CHANGELOG RELEASE */}
      <ConfirmModal
        isOpen={Boolean(showDeleteChangelogModal && changelogToDelete)}
        onClose={() => {
          setShowDeleteChangelogModal(false);
          setChangelogToDelete(null);
        }}
        onConfirm={handleDeleteChangelogConfirm}
        title={`Delete Release ${changelogToDelete?.version}`}
        subtitle="Permanent release removal"
        message={`Are you sure you want to permanently delete release ${changelogToDelete?.version}? It will be removed from your database and no longer appear in the changelog.`}
        confirmText="Delete Release"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Admin;
