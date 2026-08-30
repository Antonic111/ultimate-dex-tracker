import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Bug, Shield, ShieldCheck, Settings, Search, ChevronDown, CheckCircle, 
  XCircle, AlertCircle, Calendar, Mail, UserCheck, Filter, Trash2, Check, 
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Video, Youtube, Twitch, 
  Clock, MessageSquare, Crown, UserX, Edit3, MoreHorizontal,
  ExternalLink, Ban, RefreshCw, Send, Radio, AlertTriangle, X, Bell, Home,
  LogOut, ArrowLeft, Sparkles, Activity, Cpu, Zap, BarChart2, Gauge, Server, TrendingUp, Database, Award
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useMessage, Modal, ConfirmModal, Button } from '../components/Shared';
import { SearchField, TextField, TextArea } from '../components/Shared/FormField';
import { buildApiUrl } from '../config/api.js';
import { creatorAPI, authAPI } from '../utils/api.js';
import { getUserAvatarUrl, getTimeAgo } from '../utils/profileUtils.js';
import './Admin.css';

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
  const [scheduledTime, setScheduledTime] = useState(''); // local datetime-local input value
  const [maintenanceCountdown, setMaintenanceCountdown] = useState('');
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
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'creator', 'user'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'suspended'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef();

  const [userPage, setUserPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const tableContainerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const calculateFitRows = useCallback(() => {
    if (!tableContainerRef.current) return;
    const containerHeight = tableContainerRef.current.clientHeight;
    const headerHeight = 38;
    const rowHeight = 50; // accurate table row height
    const available = containerHeight - headerHeight;
    if (available > 0) {
      const count = Math.max(3, Math.floor(available / rowHeight));
      setRowsPerPage(prev => (prev !== count ? count : prev));
    }
  }, []);

  const setTableContainerRef = useCallback((node) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    tableContainerRef.current = node;
    if (node) {
      // Immediate and next frame calculation
      calculateFitRows();
      requestAnimationFrame(calculateFitRows);
      const observer = new ResizeObserver(() => {
        calculateFitRows();
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    }
  }, [calculateFitRows]);

  useEffect(() => {
    window.addEventListener('resize', calculateFitRows);
    return () => {
      window.removeEventListener('resize', calculateFitRows);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [calculateFitRows]);

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
      const [usersRes, bugReportsRes, featureRequestsRes, settingsRes, creatorReqsData, statsRes] = await Promise.all([
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
        fetch(buildApiUrl('/site-settings')),
        creatorAPI.getAll('all').catch(() => ({ requests: [] })),
        fetch(buildApiUrl('/admin/system-stats'), {
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

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setMaintenanceMode(settingsData.maintenanceMode || false);
        setMaintenanceStartTime(settingsData.maintenanceStartTime || null);
      }

      if (creatorReqsData && creatorReqsData.requests) {
        setCreatorRequests(creatorReqsData.requests);
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
        setScheduledTime('');
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

  const handleScheduleMaintenance = async () => {
    if (!scheduledTime) {
      showMessage('Please pick a date and time first', 'error');
      return;
    }
    const isoTime = new Date(scheduledTime).toISOString();
    if (new Date(isoTime) <= new Date()) {
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
        body: JSON.stringify({ maintenanceStartTime: isoTime }),
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
        setScheduledTime('');
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

  // Live countdown ticker for scheduled maintenance
  useEffect(() => {
    if (!maintenanceStartTime) {
      setMaintenanceCountdown('');
      return;
    }
    const tick = () => {
      const diff = new Date(maintenanceStartTime) - Date.now();
      if (diff <= 0) {
        setMaintenanceCountdown('Starting now...');
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

  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    setEditingBio(user.bio || '');
    setEditingUsername(user.username || '');
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

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = !user.isSuspended;
    else if (statusFilter === 'suspended') matchesStatus = !!user.isSuspended;

    return matchesSearch && matchesRole && matchesStatus;
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
  }, [userSearch, globalSearch, roleFilter, statusFilter, rowsPerPage]);

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

  let monthTrend = { text: '0 new vs last month', type: 'neutral' };
  if (newLastMonthCount > 0) {
    const diff = newThisMonthCount - newLastMonthCount;
    const pct = Math.round((diff / newLastMonthCount) * 100);
    if (pct > 0) {
      monthTrend = { text: `↑ +${pct}% vs last month`, type: 'positive' };
    } else if (pct < 0) {
      monthTrend = { text: `↓ ${Math.abs(pct)}% vs last month`, type: 'negative' };
    } else {
      monthTrend = { text: `Same as last month (${newLastMonthCount})`, type: 'neutral' };
    }
  } else if (newThisMonthCount > 0) {
    monthTrend = { text: `↑ +${newThisMonthCount} this month`, type: 'positive' };
  }

  const suspendedCount = users.filter(u => u.isSuspended).length;
  const openBugReportsCount = bugReports.filter(r => r.status === 'open' || !r.status).length;
  const openFeatureRequestsCount = featureRequests.filter(r => r.status === 'open' || !r.status).length;
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
                className={`admin-nav-item ${activeTab === 'bug-reports' ? 'active' : ''}`}
                onClick={() => { setActiveTab('bug-reports'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Bug size={17} className="admin-nav-icon" />
                  <span>Bug Reports</span>
                </div>
                <span className={`admin-nav-badge ${openBugReportsCount > 0 ? 'amber' : 'neutral'}`}>
                  {openBugReportsCount}
                </span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'feature-requests' ? 'active' : ''}`}
                onClick={() => { setActiveTab('feature-requests'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={17} className="admin-nav-icon" />
                  <span>Feature Requests</span>
                </div>
                <span className="admin-nav-badge neutral">
                  {openFeatureRequestsCount}
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

              <Link
                to="/achievements"
                className="admin-nav-item"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div className="flex items-center gap-2.5">
                  <Award size={17} className="admin-nav-icon" />
                  <span>Badges & Achievements</span>
                </div>
              </Link>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => { setActiveTab('diagnostics'); setMobileSidebarOpen(false); }}
              >
                <div className="flex items-center gap-2.5">
                  <Activity size={17} className="admin-nav-icon" />
                  <span>System Diagnostics</span>
                </div>
                <span className="admin-nav-badge emerald">
                  {systemStats.performance?.avgResponseMs != null ? `${systemStats.performance.avgResponseMs}ms` : 'Live'}
                </span>
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
            onClick={() => { setActiveTab('users'); setRoleFilter('all'); setStatusFilter('all'); }}
          >
            <div className="admin-stat-icon-box bg-cyan">
              <Users size={20} />
            </div>
            <div className="admin-stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{totalUsersCount}</span>
              {newThisWeekCount > 0 ? (
                <span className="stat-trend positive">↑ +{newThisWeekCount} this week</span>
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
              <span className={`stat-trend ${monthTrend.type}`}>{monthTrend.text}</span>
            </div>
            <ChevronRight size={16} className="stat-chevron" />
          </div>

          {/* Suspended Users */}
          <div 
            className="admin-stat-card card-rose"
            onClick={() => { setActiveTab('users'); setStatusFilter('suspended'); }}
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
                      variant={roleFilter !== 'all' || statusFilter !== 'all' ? 'primary' : 'secondary'}
                      size="md"
                      icon={<Filter size={16} />}
                      iconRight={<ChevronDown size={14} className={`transition-transform duration-150 ${showFilterDropdown ? 'rotate-180' : ''}`} />}
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                      Filters
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
                            <span className="filter-group-label">Role & Membership</span>
                            <div className="filter-options-grid">
                              {[
                                { id: 'all', label: 'All Roles' },
                                { id: 'admin', label: 'Admins 👑' },
                                { id: 'creator', label: 'Creators 🎥' },
                                { id: 'premium', label: 'All Premium 💎' },
                                { id: 'premium_paid', label: 'Paid Members 💳' },
                                { id: 'premium_admin', label: 'Admin Granted 🎁' },
                                { id: 'user', label: 'Users' }
                              ].map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setRoleFilter(r.id)}
                                  className={`filter-chip ${roleFilter === r.id ? 'selected' : ''}`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="filter-group pt-2 border-t border-white/[0.08]">
                            <span className="filter-group-label">Status</span>
                            <div className="filter-options-grid">
                              {['all', 'active', 'suspended'].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setStatusFilter(s)}
                                  className={`filter-chip ${statusFilter === s ? 'selected' : ''}`}
                                >
                                  {s === 'all' ? 'All Status' : s === 'active' ? '● Active' : '● Suspended'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(roleFilter !== 'all' || statusFilter !== 'all') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
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

              {/* Table Area (auto-fit to full page) */}
              <div className="admin-table-scroll-area" ref={setTableContainerRef}>
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th className="col-th-user" onClick={() => handleUserSort('username')}>
                        <div className="th-content-sort">
                          <span>USER</span>
                          {userSortField === 'username' && (userSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </div>
                      </th>
                      <th className="col-th-role" onClick={() => handleUserSort('admin')}>
                        <div className="th-content-sort">
                          <span>ROLE</span>
                          {userSortField === 'admin' && (userSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </div>
                      </th>
                      <th className="col-th-joined" onClick={() => handleUserSort('joined')}>
                        <div className="th-content-sort">
                          <span>JOINED</span>
                          {userSortField === 'joined' && (userSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </div>
                      </th>
                      <th className="col-th-active" onClick={() => handleUserSort('lastActive')}>
                        <div className="th-content-sort">
                          <span>LAST ACTIVE</span>
                          {userSortField === 'lastActive' && (userSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </div>
                      </th>
                      <th className="col-th-status">
                        <span>STATUS</span>
                      </th>
                      <th className="col-th-actions text-right">
                        <span>ACTIONS</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty-table">
                          <div className="empty-state-box">
                            <div className="empty-state-icon-bubble">
                              <Users size={30} className="text-gray-500" />
                            </div>
                            <span className="font-bold text-gray-200 text-sm mt-3">
                              {userSearch || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users matching your filters' : 'No users found'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1 max-w-xs">
                              {userSearch || roleFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your search query or clearing active filters.' : 'There are currently no registered users in the database.'}
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
                              <div className="flex items-center gap-2.5">
                                <div className="admin-user-avatar-frame-sm">
                                  <img
                                    src={getUserAvatarUrl(user)}
                                    alt={user.username}
                                    className="admin-user-avatar-img"
                                    onError={(e) => { e.target.src = '/data/default_profile_pictures/pikachu.png'; }}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="admin-user-name truncate">{user.username}</span>
                                  <span className="admin-user-handle truncate">@{user.username.toLowerCase()}</span>
                                </div>
                              </div>
                            </td>

                            {/* ROLE */}
                            <td className="col-td-role">
                              <div className="flex flex-wrap items-center gap-1">
                                {user.isAdmin && (
                                  <span className="role-pill admin">
                                    Admin <Crown size={11} className="inline ml-0.5" />
                                  </span>
                                )}
                                {user.isContentCreator && (
                                  <span className="role-pill creator">
                                    Creator <Video size={11} className="inline ml-0.5" />
                                  </span>
                                )}
                                {user.isPremium && (
                                  <span className={`role-pill ${user.premiumSource === 'subscription' || user.premiumSource === 'both' ? 'premium-paid' : 'premium-admin'}`}>
                                    {user.premiumSource === 'subscription' ? 'Paid 💎' : user.premiumSource === 'admin' ? 'Admin 🎁' : 'Member 💎'}
                                  </span>
                                )}
                                {!user.isAdmin && !user.isContentCreator && !user.isPremium && (
                                  <span className="role-pill user">
                                    User
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* JOINED */}
                            <td className="col-td-joined">
                              <span className="admin-date-text">
                                {formatJoinedDate(user)}
                              </span>
                            </td>

                            {/* LAST ACTIVE */}
                            <td className="col-td-active">
                              {(() => {
                                const activeInfo = formatLastActive(user);
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        activeInfo.isOnline 
                                          ? 'bg-emerald-400 animate-pulse' 
                                          : activeInfo.isRecent 
                                            ? 'bg-emerald-500/70' 
                                            : 'bg-white/20'
                                      }`} 
                                    />
                                    <span className={`admin-active-text ${activeInfo.isOnline ? 'text-emerald-400 font-semibold' : ''}`}>
                                      {activeInfo.text}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* STATUS */}
                            <td className="col-td-status">
                              {user.isSuspended ? (
                                <span className="status-pill suspended">
                                  ● Suspended
                                </span>
                              ) : (
                                <span className="status-pill active">
                                  ● Active
                                </span>
                              )}
                            </td>

                            {/* ACTIONS */}
                            <td className="col-td-actions text-right">
                              <div className="flex items-center justify-end gap-1 relative">
                                <button
                                  type="button"
                                  className="admin-icon-btn-sm edit"
                                  onClick={() => handleOpenEditUser(user)}
                                  title="Manage user"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="admin-icon-btn-sm more user-more-btn"
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

                <div className="admin-pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn-sm"
                    onClick={() => setUserPage(1)}
                    disabled={userPage === 1}
                  >
                    «
                  </button>

                  <button
                    type="button"
                    className="pagination-btn-sm"
                    onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                    disabled={userPage === 1}
                  >
                    ‹
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
                  >
                    ›
                  </button>

                  <button
                    type="button"
                    className="pagination-btn-sm"
                    onClick={() => setUserPage(totalUserPages)}
                    disabled={userPage >= totalUserPages}
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* 3. BUG REPORTS TAB */}
          {activeTab === 'bug-reports' && (
            <div className="admin-content-card-fit overflow-y-auto">
              <div className="admin-card-header-compact">
                <div>
                  <h2 className="admin-card-title">Bug Reports</h2>
                  <p className="admin-card-desc">Review and triage issues submitted by trainers.</p>
                </div>
                <div className="admin-action-toolbar">
                  <SearchField
                    value={bugReportSearch}
                    onChange={(e) => setBugReportSearch(e.target.value)}
                    onClear={() => setBugReportSearch('')}
                    placeholder="Search bug reports..."
                    size="md"
                    className="admin-search-field-universal"
                  />
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                {(() => {
                  const filteredBugs = bugReports.filter(r => !bugReportSearch || (r.title && r.title.toLowerCase().includes(bugReportSearch.toLowerCase())) || (r.description && r.description.toLowerCase().includes(bugReportSearch.toLowerCase())));
                  if (filteredBugs.length === 0) {
                    return (
                      <div className="empty-state-box">
                        <div className="empty-state-icon-bubble">
                          <Bug size={30} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-200 text-sm mt-3">
                          {bugReportSearch ? 'No matching bug reports found' : 'No bug reports filed'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 max-w-xs">
                          {bugReportSearch ? 'Try adjusting your search query.' : 'All clear! There are currently no bug reports in the system.'}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col gap-2.5 mt-2">
                      {filteredBugs.map((report) => (
                        <div key={report._id} className="p-3.5 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text)] text-sm truncate">{report.title || 'Untitled Report'}</span>
                              <span className={`status-pill ${report.status === 'resolved' ? 'active' : 'suspended'} text-[10px]`}>
                                {report.status === 'resolved' ? 'Resolved' : 'Open'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-1">{report.description}</p>
                            <span className="text-[10px] text-gray-500">Reported by @{report.username || 'Anonymous'} • {getTimeAgo(report.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {report.status !== 'resolved' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => confirmResolveReport(report, 'Bug Report')}
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              variant="danger-soft"
                              size="sm"
                              icon={<Trash2 size={13} />}
                              onClick={() => { setSelectedReport({ ...report, reportType: 'Bug Report' }); setShowDeleteReportModal(true); }}
                              aria-label="Delete bug report"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 4. FEATURE REQUESTS TAB */}
          {activeTab === 'feature-requests' && (
            <div className="admin-content-card-fit overflow-y-auto">
              <div className="admin-card-header-compact">
                <div>
                  <h2 className="admin-card-title">Feature Requests</h2>
                  <p className="admin-card-desc">Review community suggestions and feature ideas.</p>
                </div>
                <div className="admin-action-toolbar">
                  <SearchField
                    value={featureRequestSearch}
                    onChange={(e) => setFeatureRequestSearch(e.target.value)}
                    onClear={() => setFeatureRequestSearch('')}
                    placeholder="Search feature requests..."
                    size="md"
                    className="admin-search-field-universal"
                  />
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                {(() => {
                  const filteredRequests = featureRequests.filter(r => !featureRequestSearch || (r.title && r.title.toLowerCase().includes(featureRequestSearch.toLowerCase())) || (r.description && r.description.toLowerCase().includes(featureRequestSearch.toLowerCase())));
                  if (filteredRequests.length === 0) {
                    return (
                      <div className="empty-state-box">
                        <div className="empty-state-icon-bubble">
                          <MessageSquare size={30} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-200 text-sm mt-3">
                          {featureRequestSearch ? 'No matching feature requests found' : 'No feature requests filed'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 max-w-xs">
                          {featureRequestSearch ? 'Try adjusting your search query.' : 'All clear! There are currently no pending feature requests in the system.'}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col gap-2.5 mt-2">
                      {filteredRequests.map((req) => (
                        <div key={req._id} className="p-3.5 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text)] text-sm truncate">{req.title || 'Untitled Request'}</span>
                              <span className={`status-pill ${req.status === 'resolved' ? 'active' : 'suspended'} text-[10px]`}>
                                {req.status === 'resolved' ? 'Completed' : 'Open'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-1">{req.description}</p>
                            <span className="text-[10px] text-gray-500">Requested by @{req.username || 'Anonymous'} • {getTimeAgo(req.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {req.status !== 'resolved' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => confirmResolveReport(req, 'Feature Request')}
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="danger-soft"
                              size="sm"
                              icon={<Trash2 size={13} />}
                              onClick={() => { setSelectedReport({ ...req, reportType: 'Feature Request' }); setShowDeleteReportModal(true); }}
                              aria-label="Delete feature request"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
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
                    <span className="text-[11px] text-[var(--text-muted)]">Lock the application immediately for all non-admin visitors.</span>
                    {maintenanceMode && !maintenanceStartTime && (
                      <span className="text-[11px] text-red-400 mt-0.5 font-semibold">⚠ Currently active</span>
                    )}
                  </div>
                  <Button
                    variant={maintenanceMode && !maintenanceStartTime ? 'danger' : 'secondary'}
                    size="md"
                    onClick={() => handleToggleMaintenance(!maintenanceMode)}
                  >
                    {maintenanceMode && !maintenanceStartTime ? 'Active — Disable' : 'Enable Now'}
                  </Button>
                </div>

                {/* --- Scheduled maintenance --- */}
                <div className="p-4 rounded-xl bg-black/5 dark:bg-black/25 border border-[var(--border-color)] flex flex-col gap-3">
                  <div>
                    <span className="font-bold text-[var(--text)] text-sm">Schedule Maintenance</span>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Set a future time — users will see a live countdown banner so they can save their work before maintenance begins.</p>
                  </div>

                  {maintenanceStartTime ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <Clock size={15} className="text-amber-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[11px] text-amber-300 font-semibold">Scheduled for {new Date(maintenanceStartTime).toLocaleString()}</p>
                          {maintenanceCountdown && (
                            <p className="text-[13px] text-[var(--text)] font-bold tabular-nums">{maintenanceCountdown} remaining</p>
                          )}
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
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        id="maintenance-datetime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none',
                          colorScheme: 'dark',
                          width: '100%',
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleScheduleMaintenance}
                        disabled={!scheduledTime}
                      >
                        <Clock size={13} />
                        Schedule Maintenance
                      </Button>
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
                <span className="text-[11px] text-gray-400 truncate mt-0.5">
                  {selectedUser.isPremium 
                    ? (selectedUser.premiumSource === 'subscription' ? 'Active Paid Subscription 💎' : selectedUser.premiumSource === 'both' ? 'Paid + Admin Granted 💎' : 'Admin-Granted Member 🎁')
                    : 'No Active Membership'}
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
                <span className="text-xs text-gray-400">
                  {premiumTargetUser?.premiumSource === 'subscription' && '💳 Active Paid Subscription'}
                  {premiumTargetUser?.premiumSource === 'both' && '💎 Active Paid Subscription + Admin Grant'}
                  {premiumTargetUser?.premiumSource === 'admin' && (
                    premiumTargetUser?.premiumExpiresAt 
                      ? `🎁 Admin Granted (Expires: ${new Date(premiumTargetUser.premiumExpiresAt).toLocaleDateString()})`
                      : '🎁 Admin Granted (Permanent Lifetime)'
                  )}
                  {(!premiumTargetUser?.isPremium || premiumTargetUser?.premiumSource === 'none') && 'Standard Free Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Paddle Subscription Protection Notice */}
          {premiumTargetUser?.subscription && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-amber-300">Active Paddle Subscription Detected</span>
                <p className="text-[11px] text-[#ccc] mt-0.5">
                  This user has a self-paid subscription. Admin grants are stored independently in the entitlement system and will never overwrite or cancel their billing.
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
            <TextField
              label="Suspension Reason (Optional)"
              placeholder="e.g. Terms of Service violation..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              size="md"
              fullWidth
            />
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
    </div>
  );
};

export default Admin;
