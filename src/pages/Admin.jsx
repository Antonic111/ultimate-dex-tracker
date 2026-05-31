import React, { useState, useEffect, useRef } from 'react';
import { Users, Bug, Shield, Settings, Search, ChevronDown, CheckCircle, XCircle, AlertCircle, Calendar, Mail, UserCheck, Filter, Trash2, Check, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Video, Youtube, Twitch, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../components/Shared/MessageContext';
import { buildApiUrl } from '../config/api.js';
import { creatorAPI } from '../utils/api.js';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [creatorRequests, setCreatorRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null); // null = checking, true = admin, false = not admin
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // User management
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userSortField, setUserSortField] = useState('joined'); // 'username', 'admin', 'joined'
  const [userSortDir, setUserSortDir] = useState('desc'); // 'asc', 'desc'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserActions, setShowUserActions] = useState(false);
  const [editingBio, setEditingBio] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [editingCreator, setEditingCreator] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Bug report management
  const [bugReportSearch, setBugReportSearch] = useState('');
  const [bugReportFilter, setBugReportFilter] = useState('open');
  const [showBugReportFilter, setShowBugReportFilter] = useState(false);
  const bugReportFilterRef = useRef();
  
  // Feature request management
  const [featureRequestSearch, setFeatureRequestSearch] = useState('');
  const [featureRequestFilter, setFeatureRequestFilter] = useState('open');
  const [showFeatureRequestFilter, setShowFeatureRequestFilter] = useState(false);
  const featureRequestFilterRef = useRef();
  
  // Creator request management
  const [creatorRequestSearch, setCreatorRequestSearch] = useState('');
  const [creatorRequestFilter, setCreatorRequestFilter] = useState('pending');
  const [showCreatorRequestFilter, setShowCreatorRequestFilter] = useState(false);
  const creatorRequestFilterRef = useRef();

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);
  const [resolveModalClosing, setResolveModalClosing] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Click outside handlers for filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bugReportFilterRef.current && !bugReportFilterRef.current.contains(event.target)) {
        setShowBugReportFilter(false);
      }
      if (featureRequestFilterRef.current && !featureRequestFilterRef.current.contains(event.target)) {
        setShowFeatureRequestFilter(false);
      }
      if (creatorRequestFilterRef.current && !creatorRequestFilterRef.current.contains(event.target)) {
        setShowCreatorRequestFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle body overflow when modals are open
  useEffect(() => {
    if (showUserActions || showDeleteModal || showResolveModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showUserActions, showDeleteModal, showResolveModal]);

  // Redirect if not admin (only after we've checked)
  useEffect(() => {
    if (isAdmin === false) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(buildApiUrl('/profile'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        credentials: 'include'
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const userData = await response.json();
          console.log('Admin check response:', userData); // Debug log
          if (userData.isAdmin) {
            setIsAdmin(true);
            loadData(); // Only load data if user is admin
          } else {
            setIsAdmin(false);
          }
        } else {
          console.error('Error: Response is not JSON');
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, bugReportsRes, featureRequestsRes, settingsRes, creatorReqsData] = await Promise.all([
        fetch(buildApiUrl('/admin/users'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/admin/bug-reports'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/admin/feature-requests'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          credentials: 'include'
        }),
        fetch(buildApiUrl('/site-settings')),
        creatorAPI.getAll('all').catch(() => ({ requests: [] }))
      ]);

      if (usersRes.ok) {
        const contentType = usersRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const usersData = await usersRes.json();
          setUsers(usersData.users);
        }
      }

      if (bugReportsRes.ok) {
        const contentType = bugReportsRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const bugReportsData = await bugReportsRes.json();
          setBugReports(bugReportsData.bugReports);
        }
      }

      if (featureRequestsRes.ok) {
        const contentType = featureRequestsRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const featureRequestsData = await featureRequestsRes.json();
          setFeatureRequests(featureRequestsData.featureRequests);
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setMaintenanceMode(settingsData.maintenanceMode || false);
      }

      if (creatorReqsData && creatorReqsData.requests) {
        setCreatorRequests(creatorReqsData.requests);
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

  const handleAssignAdmin = async (username, isAdmin) => {
    try {
      const response = await fetch(buildApiUrl('/assign-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ username, isAdmin }),
        credentials: 'include'
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          showMessage(result.message, 'success');
          loadData(); // Reload data
          setSelectedUser(null);
          setShowUserActions(false);
        } else {
          showMessage('Failed to update admin status: Invalid response', 'error');
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          showMessage(error.error, 'error');
        } else {
          showMessage('Failed to update admin status', 'error');
        }
      }
    } catch (err) {
      showMessage('Failed to update admin status', 'error');
    }
  };

  const handleToggleMaintenance = async (mode, minutesDelay = null) => {
    try {
      const payload = { maintenanceMode: mode };
      
      if (minutesDelay !== null) {
        // Calculate future time in milliseconds
        payload.maintenanceStartTime = Date.now() + (minutesDelay * 60 * 1000);
      } else {
        payload.maintenanceStartTime = null;
      }

      const response = await fetch(buildApiUrl('/admin/site-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setMaintenanceMode(result.settings.maintenanceMode);
        
        if (result.settings.maintenanceStartTime) {
          showMessage(`Maintenance mode scheduled for ${minutesDelay} minutes from now`, 'success');
        } else {
          showMessage(`Maintenance mode ${result.settings.maintenanceMode ? 'enabled' : 'disabled'}`, 'success');
        }
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update maintenance mode', 'error');
      }
    } catch (err) {
      showMessage('Failed to update maintenance mode', 'error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    let comparison = 0;
    if (userSortField === 'username') {
      comparison = a.username.localeCompare(b.username);
    } else if (userSortField === 'admin') {
      // sort admin=true before admin=false usually, so logic here:
      comparison = (a.isAdmin === b.isAdmin) ? 0 : (a.isAdmin ? -1 : 1);
    } else if (userSortField === 'joined') {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    }
    
    return userSortDir === 'desc' ? -comparison : comparison;
  });

  const handleUserSort = (field) => {
    if (userSortField === field) {
      setUserSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDir('desc');
    }
  };

  const USERS_PER_PAGE = 20;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

  useEffect(() => {
    if (selectedUser) {
      setEditingBio(selectedUser.bio || '');
      setEditingUsername(selectedUser.username || '');
      setEditingCreator(selectedUser.isContentCreator || false);
    }
  }, [selectedUser]);

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    setIsSavingProfile(true);
    try {
      const response = await fetch(buildApiUrl(`/admin/users/${selectedUser._id}/profile`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          bio: editingBio,
          username: editingUsername,
          isContentCreator: editingCreator
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(result.message, 'success');
        setUsers(users.map(u => 
          u._id === selectedUser._id ? { ...u, bio: result.bio, username: result.username, isContentCreator: result.isContentCreator } : u
        ));
        setSelectedUser({ ...selectedUser, bio: result.bio, username: result.username, isContentCreator: result.isContentCreator });
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showMessage('Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredBugReports = bugReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(bugReportSearch.toLowerCase()) ||
                         report.description.toLowerCase().includes(bugReportSearch.toLowerCase());
    const matchesFilter = bugReportFilter === 'all' || report.status === bugReportFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredFeatureRequests = featureRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(featureRequestSearch.toLowerCase()) ||
                         request.description.toLowerCase().includes(featureRequestSearch.toLowerCase());
    const matchesFilter = featureRequestFilter === 'all' || request.status === featureRequestFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredCreatorRequests = creatorRequests.filter(request => {
    const matchesSearch = request.username.toLowerCase().includes(creatorRequestSearch.toLowerCase());
    const matchesFilter = creatorRequestFilter === 'all' || request.status === creatorRequestFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteReport = (report, reportType) => {
    setSelectedReport({ ...report, reportType });
    setShowDeleteModal(true);
    setDeleteModalClosing(false);
  };

  const confirmDeleteReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(buildApiUrl(`/admin/delete-report/${selectedReport._id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        showMessage(`${selectedReport.reportType} deleted successfully`, 'success');
        loadData(); // Reload data
        setShowDeleteModal(false);
        setSelectedReport(null);
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          showMessage(error.error || 'Failed to delete report', 'error');
        } else {
          showMessage('Failed to delete report', 'error');
        }
      }
    } catch (err) {
      showMessage('Failed to delete report', 'error');
    }
  };

  const handleMarkResolved = (report, reportType) => {
    setSelectedReport({ ...report, reportType });
    setShowResolveModal(true);
    setResolveModalClosing(false);
  };

  const confirmResolveReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(buildApiUrl(`/admin/update-report-status/${selectedReport._id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status: 'resolved' }),
        credentials: 'include'
      });

      if (response.ok) {
        showMessage(`${selectedReport.reportType} marked as resolved`, 'success');
        loadData(); // Reload data
        setShowResolveModal(false);
        setSelectedReport(null);
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          showMessage(error.error || 'Failed to update report status', 'error');
        } else {
          showMessage('Failed to update report status', 'error');
        }
      }
    } catch (err) {
      showMessage('Failed to update report status', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="status-icon open" />;
      case 'resolved': return <CheckCircle className="status-icon resolved" />;
      case 'pending': return <Clock className="status-icon" style={{ color: '#f59e0b' }} />;
      case 'approved': return <CheckCircle className="status-icon" style={{ color: '#10b981' }} />;
      case 'rejected': return <XCircle className="status-icon" style={{ color: '#ef4444' }} />;
      default: return <AlertCircle className="status-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'resolved': return 'Resolved';
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getBugReportFilterLabel = () => {
    switch (bugReportFilter) {
      case 'all': return 'All Status';
      case 'open': return 'Open';
      case 'resolved': return 'Resolved';
      default: return 'All Status';
    }
  };

  const getFeatureRequestFilterLabel = () => {
    switch (featureRequestFilter) {
      case 'all': return 'All Status';
      case 'open': return 'Open';
      case 'resolved': return 'Resolved';
      default: return 'All Status';
    }
  };

  const getCreatorRequestFilterLabel = () => {
    switch (creatorRequestFilter) {
      case 'all': return 'All Status';
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'All Status';
    }
  };

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <h1>
              <Shield className="admin-header-icon" />
              Admin Panel
            </h1>
            <p>Checking permissions...</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }


  // Don't render if not admin
  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="page-title">Admin Panel</h1>


        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Users ({users.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'bug-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('bug-reports')}
          >
            <Bug size={18} />
            Bug Reports ({bugReports.filter(r => r.status === 'open').length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'feature-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('feature-requests')}
          >
            <Shield size={18} />
            Feature Requests ({featureRequests.filter(r => r.status === 'open').length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'creator-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('creator-requests')}
          >
            <Video size={18} />
            Creator Requests ({creatorRequests.filter(r => r.status === 'pending').length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Site Settings
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="search-controls">
                <div className="search-input-wrap">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="users-table">
              <div className="table-header">
                <div 
                  className="col-username" 
                  onClick={() => handleUserSort('username')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Username {userSortField === 'username' && (userSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div 
                  className="col-admin" 
                  onClick={() => handleUserSort('admin')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Admin {userSortField === 'admin' && (userSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div 
                  className="col-joined" 
                  onClick={() => handleUserSort('joined')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Joined {userSortField === 'joined' && (userSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </div>
                <div className="col-actions">Actions</div>
              </div>
              
              {paginatedUsers.map((user) => (
                <div key={user._id} className="table-row">
                  <div className="col-username">
                    <span className="username">{user.username}</span>
                  </div>
                  <div className="col-admin">
                    {user.isAdmin ? (
                      <span className="admin-badge">Admin</span>
                    ) : (
                      <span className="user-badge">User</span>
                    )}
                  </div>
                  <div className="col-joined">
                    <span className="date">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-actions">
                    <Settings 
                      size={20} 
                      className="action-icon"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserActions(!showUserActions || selectedUser?._id !== user._id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length > USERS_PER_PAGE && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <button
                  onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                  disabled={userPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: userPage === 1 ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: userPage === 1 ? 'var(--text-secondary)' : 'var(--bg-primary)',
                    cursor: userPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 'bold',
                    opacity: userPage === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  Page {userPage} of {totalUserPages}
                </span>

                <button
                  onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))}
                  disabled={userPage >= totalUserPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: userPage >= totalUserPages ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: userPage >= totalUserPages ? 'var(--text-secondary)' : 'var(--bg-primary)',
                    cursor: userPage >= totalUserPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 'bold',
                    opacity: userPage >= totalUserPages ? 0.5 : 1
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* User Actions Modal */}
            {selectedUser && showUserActions && (
              <div className="user-actions-dropdown">
                <div className="user-actions-modal">
                  <div className="user-actions-header">
                    <h3 className="modal-title">Manage <span className="username-accent">{selectedUser.username}</span></h3>
                    <button 
                      className="close-btn"
                      onClick={() => {
                        setSelectedUser(null);
                        setShowUserActions(false);
                      }}
                    >
                      <span className="sidebar-close-icon">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                          <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                          <rect x="2" y="19" width="36" height="2" fill="#232323" />
                          <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                          <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="user-actions-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Email Address</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '500', wordBreak: 'break-all' }}>{selectedUser.email || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Member Since</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>

                    <div className="action-item">
                      <label>Verification Status</label>
                      <span className={`status-badge ${selectedUser.verified ? 'verified' : 'unverified'}`}>
                        {selectedUser.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="action-item">
                      <label>Role</label>
                      <span className={`status-badge ${selectedUser.isAdmin ? 'admin' : 'user'}`}>
                        {selectedUser.isAdmin ? 'Administrator' : 'Standard User'}
                      </span>
                    </div>

                    <div className="action-item" style={{ alignItems: 'center' }}>
                      <label style={{ margin: 0 }}>Content Creator</label>
                      <input 
                        type="checkbox" 
                        checked={editingCreator} 
                        onChange={(e) => setEditingCreator(e.target.checked)} 
                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                      />
                    </div>

                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Username</label>
                        <input
                          type="text"
                          value={editingUsername}
                          onChange={(e) => setEditingUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>User Bio</label>
                        <textarea
                          value={editingBio}
                          onChange={(e) => setEditingBio(e.target.value)}
                          placeholder="Write something about this user..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '8px',
                            borderRadius: '6px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || (editingBio === (selectedUser.bio || '') && editingUsername === selectedUser.username && editingCreator === !!selectedUser.isContentCreator)}
                        style={{
                          alignSelf: 'flex-end',
                          padding: '6px 12px',
                          background: (isSavingProfile || (editingBio === (selectedUser.bio || '') && editingUsername === selectedUser.username && editingCreator === !!selectedUser.isContentCreator)) ? 'var(--bg-secondary)' : 'var(--accent)',
                          color: (isSavingProfile || (editingBio === (selectedUser.bio || '') && editingUsername === selectedUser.username && editingCreator === !!selectedUser.isContentCreator)) ? 'var(--text-secondary)' : '#1a1a1a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: (isSavingProfile || (editingBio === (selectedUser.bio || '') && editingUsername === selectedUser.username && editingCreator === !!selectedUser.isContentCreator)) ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => navigate(`/u/${selectedUser.username}`)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--accent)',
                          color: '#1a1a1a',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <UserCheck size={18} /> View Public Profile
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bug Reports Tab */}
        {activeTab === 'bug-reports' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Bug Reports</h2>
              <div className="search-controls">
                <div className="search-input-wrap">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search bug reports..."
                    value={bugReportSearch}
                    onChange={(e) => setBugReportSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className={`filter-button-wrap ${showBugReportFilter ? 'open' : ''}`} ref={bugReportFilterRef}>
                  <button
                    className="filter-button"
                    onClick={() => setShowBugReportFilter(!showBugReportFilter)}
                    aria-label="Filter bug reports"
                  >
                    <div className="filter-content">
                      <Filter size={18} />
                      <span>{getBugReportFilterLabel()}</span>
                    </div>
                    <ChevronDown 
                      className={`ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer ${showBugReportFilter ? '' : 'rotate-180'}`}
                      style={{ color: 'var(--accent)' }}
                      size={16}
                    />
                  </button>
                  
                  {showBugReportFilter && (
                    <div className="filter-dropdown">
                      <button
                        className={`filter-option ${bugReportFilter === "all" ? "active" : ""}`}
                        onClick={() => {
                          setBugReportFilter("all");
                          setShowBugReportFilter(false);
                        }}
                      >
                        All Status
                      </button>
                      <button
                        className={`filter-option ${bugReportFilter === "open" ? "active" : ""}`}
                        onClick={() => {
                          setBugReportFilter("open");
                          setShowBugReportFilter(false);
                        }}
                      >
                        Open
                      </button>
                      <button
                        className={`filter-option ${bugReportFilter === "resolved" ? "active" : ""}`}
                        onClick={() => {
                          setBugReportFilter("resolved");
                          setShowBugReportFilter(false);
                        }}
                      >
                        Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bug-reports-list">
              {filteredBugReports.length === 0 ? (
                <div className="empty-state">
                  <Bug size={48} className="empty-state-icon" />
                  <h3>No Bug Reports</h3>
                </div>
              ) : (
                filteredBugReports.map((report) => (
                  <div key={report._id} className="bug-report-card">
                    <div className="bug-report-header">
                      <div className="bug-report-meta">
                        <span className="report-id">#{report.reportId || 'N/A'}</span>
                        {getStatusIcon(report.status)}
                        <span className="status-label">{getStatusLabel(report.status)}</span>
                        <span className="date">
                          <Calendar size={14} />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        {report.submittedBy && (
                          <span className="submitter">
                            by {report.submittedBy.username}
                          </span>
                        )}
                      </div>
                      <h3 className="bug-report-title">{report.title}</h3>
                    </div>
                    <div className="bug-report-actions">
                      {report.status !== 'resolved' && (
                        <button
                          className="resolve-report-btn"
                          onClick={() => handleMarkResolved(report, 'bug report')}
                          title="Mark as resolved"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button
                        className="delete-report-btn"
                        onClick={() => handleDeleteReport(report, 'bug report')}
                        title="Delete bug report"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="bug-report-description">{report.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Feature Requests Tab */}
        {activeTab === 'feature-requests' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Feature Requests</h2>
              <div className="search-controls">
                <div className="search-input-wrap">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search feature requests..."
                    value={featureRequestSearch}
                    onChange={(e) => setFeatureRequestSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className={`filter-button-wrap ${showFeatureRequestFilter ? 'open' : ''}`} ref={featureRequestFilterRef}>
                  <button
                    className="filter-button"
                    onClick={() => setShowFeatureRequestFilter(!showFeatureRequestFilter)}
                    aria-label="Filter feature requests"
                  >
                    <div className="filter-content">
                      <Filter size={18} />
                      <span>{getFeatureRequestFilterLabel()}</span>
                    </div>
                    <ChevronDown 
                      className={`ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer ${showFeatureRequestFilter ? '' : 'rotate-180'}`}
                      style={{ color: 'var(--accent)' }}
                      size={16}
                    />
                  </button>
                  
                  {showFeatureRequestFilter && (
                    <div className="filter-dropdown">
                      <button
                        className={`filter-option ${featureRequestFilter === "all" ? "active" : ""}`}
                        onClick={() => {
                          setFeatureRequestFilter("all");
                          setShowFeatureRequestFilter(false);
                        }}
                      >
                        All Status
                      </button>
                      <button
                        className={`filter-option ${featureRequestFilter === "open" ? "active" : ""}`}
                        onClick={() => {
                          setFeatureRequestFilter("open");
                          setShowFeatureRequestFilter(false);
                        }}
                      >
                        Open
                      </button>
                      <button
                        className={`filter-option ${featureRequestFilter === "resolved" ? "active" : ""}`}
                        onClick={() => {
                          setFeatureRequestFilter("resolved");
                          setShowFeatureRequestFilter(false);
                        }}
                      >
                        Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bug-reports-list">
              {filteredFeatureRequests.length === 0 ? (
                <div className="empty-state">
                  <Shield size={48} className="empty-state-icon" />
                  <h3>No Feature Requests</h3>
                </div>
              ) : (
                filteredFeatureRequests.map((request) => (
                  <div key={request._id} className="bug-report-card">
                    <div className="bug-report-header">
                      <div className="bug-report-meta">
                        <span className="report-id">#{request.reportId || 'N/A'}</span>
                        {getStatusIcon(request.status)}
                        <span className="status-label">{getStatusLabel(request.status)}</span>
                        <span className="date">
                          <Calendar size={14} />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        {request.submittedBy && (
                          <span className="submitter">
                            by {request.submittedBy.username}
                          </span>
                        )}
                      </div>
                      <h3 className="bug-report-title">{request.title}</h3>
                    </div>
                    <div className="bug-report-actions">
                      {request.status !== 'resolved' && (
                        <button
                          className="resolve-report-btn"
                          onClick={() => handleMarkResolved(request, 'feature request')}
                          title="Mark as resolved"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button
                        className="delete-report-btn"
                        onClick={() => handleDeleteReport(request, 'feature request')}
                        title="Delete feature request"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="bug-report-description">{request.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Creator Requests Tab */}
        {activeTab === 'creator-requests' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Content Creator Requests</h2>
              <div className="search-controls">
                <div className="search-input-wrap">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={creatorRequestSearch}
                    onChange={(e) => setCreatorRequestSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className={`filter-button-wrap ${showCreatorRequestFilter ? 'open' : ''}`} ref={creatorRequestFilterRef}>
                  <button
                    className="filter-button"
                    onClick={() => setShowCreatorRequestFilter(!showCreatorRequestFilter)}
                    aria-label="Filter creator requests"
                  >
                    <div className="filter-content">
                      <Filter size={18} />
                      <span>{getCreatorRequestFilterLabel()}</span>
                    </div>
                    <ChevronDown 
                      className={`ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer ${showCreatorRequestFilter ? '' : 'rotate-180'}`}
                      style={{ color: 'var(--accent)' }}
                      size={16}
                    />
                  </button>
                  
                  {showCreatorRequestFilter && (
                    <div className="filter-dropdown">
                      <button
                        className={`filter-option ${creatorRequestFilter === "all" ? "active" : ""}`}
                        onClick={() => {
                          setCreatorRequestFilter("all");
                          setShowCreatorRequestFilter(false);
                        }}
                      >
                        All Status
                      </button>
                      <button
                        className={`filter-option ${creatorRequestFilter === "pending" ? "active" : ""}`}
                        onClick={() => {
                          setCreatorRequestFilter("pending");
                          setShowCreatorRequestFilter(false);
                        }}
                      >
                        Pending
                      </button>
                      <button
                        className={`filter-option ${creatorRequestFilter === "approved" ? "active" : ""}`}
                        onClick={() => {
                          setCreatorRequestFilter("approved");
                          setShowCreatorRequestFilter(false);
                        }}
                      >
                        Approved
                      </button>
                      <button
                        className={`filter-option ${creatorRequestFilter === "rejected" ? "active" : ""}`}
                        onClick={() => {
                          setCreatorRequestFilter("rejected");
                          setShowCreatorRequestFilter(false);
                        }}
                      >
                        Rejected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bug-reports-list">
              {filteredCreatorRequests.length === 0 ? (
                <div className="empty-state">
                  <Video size={48} className="empty-state-icon" />
                  <h3>No Creator Requests</h3>
                </div>
              ) : (
                filteredCreatorRequests.map(request => (
                  <div key={request._id} className="bug-report-card">
                    <div className="bug-report-header">
                      <div className="bug-report-meta">
                        <span className="report-id">#{request._id.substring(request._id.length - 6).toUpperCase()}</span>
                        {getStatusIcon(request.status)}
                        <span className="status-label">{getStatusLabel(request.status)}</span>
                        <span className="date">
                          <Calendar size={14} />
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="submitter">
                          by {request.username}
                        </span>
                      </div>
                    </div>
                    <div className="bug-report-actions">
                      {request.youtubeUrl && (
                        <a href={request.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', textDecoration: 'none', transition: 'all 0.2s' }} title="YouTube Channel">
                          <Youtube size={26} />
                        </a>
                      )}
                      {request.twitchUrl && (
                        <a href={request.twitchUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', textDecoration: 'none', transition: 'all 0.2s' }} title="Twitch Channel">
                          <Twitch size={26} />
                        </a>
                      )}
                      {request.status === 'pending' && (
                        <>
                          {(request.youtubeUrl || request.twitchUrl) && (
                            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
                          )}
                          <button
                            className="resolve-report-btn"
                            onClick={() => handleUpdateCreatorRequest(request._id, 'approved')}
                            title="Approve Request"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            className="delete-report-btn"
                            onClick={() => handleUpdateCreatorRequest(request._id, 'rejected')}
                            title="Reject Request"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="bug-report-description">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0 }}><strong>Content Type:</strong> {request.contentType}</p>
                        <p style={{ margin: 0 }}><strong>Subscribers:</strong> {request.subscriberCount}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Site Settings</h2>
            </div>
            
            <div className="settings-container" style={{ padding: '20px', backgroundColor: 'var(--progress-bg)', borderRadius: '12px', border: '1px solid #444', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} /> Maintenance Mode
                  </h3>
                  <p style={{ margin: '8px 0 0 0', color: 'var(--progressbar-info)', fontSize: '0.9rem' }}>
                    When active, only admins can access the site. Other users will see a maintenance screen.
                  </p>
                </div>
                
                {maintenanceMode ? (
                  <button
                    onClick={() => handleToggleMaintenance(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <XCircle size={18} />
                    Disable Maintenance
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleToggleMaintenance(true, 5)}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={18} />
                      In 5 Mins
                    </button>
                    <button
                      onClick={() => handleToggleMaintenance(true, 15)}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={18} />
                      In 15 Mins
                    </button>
                    <button
                      onClick={() => handleToggleMaintenance(true)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle size={18} />
                      Enable Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className={`fixed inset-0 z-[20000] ${deleteModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
          onClick={() => {
            setDeleteModalClosing(true);
            setTimeout(() => {
              setShowDeleteModal(false);
              setDeleteModalClosing(false);
            }, 300);
          }}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div 
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${deleteModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--accent)]">Delete {selectedReport?.reportType}</h3>
                <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-[var(--accent)]">#{selectedReport?.reportId}</span>? 
              This will permanently remove this {selectedReport?.reportType}.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalClosing(true);
                  setTimeout(() => {
                    setShowDeleteModal(false);
                    setDeleteModalClosing(false);
                  }, 300);
                }}
                className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReport}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirmation Modal */}
      {showResolveModal && (
        <div 
          className={`fixed inset-0 z-[20000] ${resolveModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
          onClick={() => {
            setResolveModalClosing(true);
            setTimeout(() => {
              setShowResolveModal(false);
              setResolveModalClosing(false);
            }, 300);
          }}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div 
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resolveModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--accent)]">Mark as Resolved</h3>
                <p className="text-sm text-[var(--progressbar-info)]">This will mark the {selectedReport?.reportType} as completed</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to mark <span className="font-semibold text-[var(--accent)]">#{selectedReport?.reportId}</span> as resolved? 
              This will mark the {selectedReport?.reportType} as completed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setResolveModalClosing(true);
                  setTimeout(() => {
                    setShowResolveModal(false);
                    setResolveModalClosing(false);
                  }, 300);
                }}
                className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolveReport}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors font-semibold"
              >
                Mark as Resolved
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
