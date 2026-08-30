import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Megaphone,
  Sparkles,
  Info,
  AlertTriangle,
  ExternalLink,
  Plus,
  X,
  Check,
  Loader2,
  Clock,
  ArrowLeft,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { notificationsAPI } from "../../utils/api";
import { Link } from "react-router-dom";
import { TextField, TextArea, SelectField } from "../Shared/FormField";

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal Priority" },
  { value: "important", label: "Important", icon: <Sparkles size={13} className="text-amber-400" /> },
  { value: "alert", label: "Alert / Urgent", icon: <AlertTriangle size={13} className="text-red-400" /> }
];

export default function NotificationDropdown({ user, showMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread'
  const [showAdminComposer, setShowAdminComposer] = useState(false);

  // Admin form state
  const [composerForm, setComposerForm] = useState({
    title: "",
    message: "",
    priority: "normal",
    type: "announcement",
    link: ""
  });
  const [isSending, setIsSending] = useState(false);

  const containerRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.username) return;
    try {
      setIsLoading(true);
      const res = await notificationsAPI.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchNotifications();
      // Poll every 60 seconds for new announcements
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.username]);

  // Handle outside click & Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close dropdown if interacting with a portaled SelectField dropdown menu
      if (e.target?.closest && (e.target.closest('.udt-select-dropdown') || e.target.closest('.udt-select-portal') || e.target.closest('[role="listbox"]'))) {
        return;
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowAdminComposer(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowAdminComposer(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark single as read
  const handleToggleRead = async (id, currentRead) => {
    try {
      const targetRead = !currentRead;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: targetRead } : n))
      );
      setUnreadCount(prev => (targetRead ? Math.max(0, prev - 1) : prev + 1));
      await notificationsAPI.markAsRead(id, targetRead);
    } catch (err) {
      console.error("Failed to update notification read status:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await notificationsAPI.markAllAsRead();
      if (showMessage) showMessage("All notifications marked as read", "success");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete single notification (for current user)
  const handleDeleteNotification = async (id) => {
    try {
      const deletedItem = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deletedItem && !deletedItem.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await notificationsAPI.deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Admin: Delete notification globally for everyone
  const handleAdminDeleteGlobal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement globally for ALL users?")) {
      return;
    }
    try {
      const deletedItem = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deletedItem && !deletedItem.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await notificationsAPI.deleteAnnouncementAdmin(id);
      if (showMessage) showMessage("Announcement deleted globally for everyone", "success");
    } catch (err) {
      console.error("Failed to globally delete announcement:", err);
      if (showMessage) showMessage("Failed to delete announcement globally", "error");
      fetchNotifications();
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      setNotifications([]);
      setUnreadCount(0);
      await notificationsAPI.deleteAllNotifications();
      if (showMessage) showMessage("All notifications cleared", "success");
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  // Admin submit announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!composerForm.title.trim() || !composerForm.message.trim()) {
      if (showMessage) showMessage("Title and Message are required", "error");
      return;
    }

    try {
      setIsSending(true);
      const res = await notificationsAPI.sendAnnouncement({
        title: composerForm.title.trim(),
        message: composerForm.message.trim(),
        priority: composerForm.priority,
        type: composerForm.type,
        link: composerForm.link.trim()
      });

      if (res && res.success && res.notification) {
        setNotifications(prev => [res.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setComposerForm({
          title: "",
          message: "",
          priority: "normal",
          type: "announcement",
          link: ""
        });
        setShowAdminComposer(false);
        if (showMessage) showMessage("Announcement broadcasted successfully! 📢", "success");
      }
    } catch (err) {
      console.error("Failed to send announcement:", err);
      if (showMessage) showMessage(err.message || "Failed to send announcement", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Filter notifications
  const displayedNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    return true;
  });

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getPriorityBadge = (priority) => {
    if (priority === "alert") {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded-md">
          Alert
        </span>
      );
    }
    if (priority === "important") {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
          Important
        </span>
      );
    }
    return null;
  };

  const getTypeIcon = (type, priority) => {
    if (priority === "alert") return <AlertTriangle size={15} className="text-red-400" />;
    if (type === "event") return <Sparkles size={15} className="text-[var(--accent)]" />;
    if (type === "system") return <Info size={15} className="text-blue-400" />;
    return <Megaphone size={15} className="text-[var(--accent)]" />;
  };

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0"
      style={{
        position: 'relative',
        width: '28px',
        height: '28px',
        minWidth: '28px',
        minHeight: '28px',
        maxWidth: '28px',
        maxHeight: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {/* Bell Button */}
      <button
        type="button"
        data-tutorial-id="nav-notifications-btn"
        className={`w-full h-full rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95 outline-none focus:outline-none focus-visible:outline-none focus:border-[var(--accent)] flex-shrink-0 ${
          isOpen
            ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/60"
            : "bg-white/[0.07] hover:bg-white/[0.13] text-gray-200 hover:text-white border border-white/[0.12] hover:border-[var(--accent)]/50 shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]"
        }`}
        style={{
          boxSizing: 'border-box',
          width: '28px',
          height: '28px',
          minWidth: '28px',
          minHeight: '28px',
          maxWidth: '28px',
          maxHeight: '28px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          ...(isOpen ? {
            boxShadow: '0 0 16px var(--accent-glow, color-mix(in srgb, var(--accent) 35%, transparent)), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          } : {})
        }}
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications & Announcements"
        aria-label="Notifications"
      >
        <Bell size={14} className={`flex-shrink-0 ${unreadCount > 0 ? "text-[var(--accent)] animate-[wiggle_1s_ease-in-out_infinite]" : "text-gray-300"}`} />
      </button>

      {/* Unread Badge Counter — pinned to top-right corner of bell button */}
      {unreadCount > 0 && (
        <span
          className="animate-pulse"
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '15px',
            height: '15px',
            minWidth: '15px',
            minHeight: '15px',
            maxWidth: '15px',
            maxHeight: '15px',
            boxSizing: 'border-box',
            borderRadius: '9999px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            zIndex: 30,
            pointerEvents: 'none',
            border: '1.5px solid var(--header, #0a0a0a)',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.85)'
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {/* Flyout Panel Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notification-flyout-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[92px] left-3 right-3 sm:absolute sm:top-[calc(100%+16px)] sm:left-auto sm:right-0 sm:w-[420px] sm:max-w-[calc(100vw-24px)] max-h-[calc(100vh-108px)] sm:max-h-[min(650px,calc(100vh-120px))] bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] rounded-2xl shadow-[var(--dropdown-shadow),var(--dropdown-inset-shadow),0_20px_40px_rgba(0,0,0,0.6)] z-50 backdrop-blur-[16px] overflow-hidden flex flex-col"
          >
          
          {showAdminComposer ? (
            /* FULL-BOX ADMIN ANNOUNCEMENT COMPOSER VIEW */
            <div className="flex flex-col animate-fadeIn">
              {/* Header */}
              <div className="p-3.5 px-4 border-b border-white/[0.08] flex items-center justify-between bg-black/25 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminComposer(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer flex items-center justify-center"
                    title="Back to notifications"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="font-extrabold text-white text-sm tracking-wide flex items-center gap-1.5">
                    <Megaphone size={15} className="text-[var(--accent)]" /> New Server Announcement
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminComposer(false);
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSendAnnouncement} className="p-4 space-y-3.5 flex flex-col">
                <TextField
                  label="Announcement Title"
                  placeholder="e.g. Scheduled Maintenance or New Features!"
                  value={composerForm.title}
                  onChange={(e) => setComposerForm(prev => ({ ...prev, title: e?.target ? e.target.value : e }))}
                  maxLength={120}
                  showCharCount
                  size="sm"
                  controlClassName="!bg-black/40 !border-white/10 !rounded-xl hover:!border-white/20"
                  required
                  fullWidth
                />

                <TextArea
                  label="Announcement Message"
                  placeholder="Write your announcement message to all trainers..."
                  value={composerForm.message}
                  onChange={(e) => setComposerForm(prev => ({ ...prev, message: e?.target ? e.target.value : e }))}
                  maxLength={1500}
                  rows={4}
                  minRows={3}
                  showCharCount
                  size="sm"
                  controlClassName="!bg-black/40 !border-white/10 !rounded-xl hover:!border-white/20"
                  inputClassName="custom-scrollbar resize-none text-xs text-gray-200 placeholder-gray-500 h-[100px] overflow-y-auto"
                  required
                  fullWidth
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectField
                    label="Priority Level"
                    options={PRIORITY_OPTIONS}
                    value={composerForm.priority}
                    onChange={(val) => setComposerForm(prev => ({ ...prev, priority: val }))}
                    size="sm"
                    controlClassName="!bg-black/40 !border-white/10 !rounded-xl hover:!border-white/20"
                    triggerClassName="!bg-transparent"
                    dropdownClassName="!bg-[#1c1c1c]/98 !border-[#333] !backdrop-blur-xl !shadow-[0_12px_36px_rgba(0,0,0,0.85)] !rounded-xl"
                    fullWidth
                  />

                  <TextField
                    label="Action Link (Optional)"
                    placeholder="e.g. /changelog"
                    value={composerForm.link}
                    onChange={(e) => setComposerForm(prev => ({ ...prev, link: e?.target ? e.target.value : e }))}
                    startIcon={<ExternalLink size={13} />}
                    size="sm"
                    controlClassName="!bg-black/40 !border-white/10 !rounded-xl hover:!border-white/20"
                    fullWidth
                  />
                </div>

                {/* Natural flow Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06] mt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminComposer(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !composerForm.title.trim() || !composerForm.message.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-black bg-[var(--accent)] hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Megaphone size={14} />
                        <span>Broadcast to All</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* REGULAR NOTIFICATIONS LIST VIEW */
            <>
              {/* Header */}
              <div className="p-3.5 px-4 border-b border-[var(--border-color)] flex items-center justify-between bg-black/5 dark:bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[var(--text)] text-sm tracking-wide">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  {user?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowAdminComposer(true)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] text-[var(--accent)] border border-[var(--accent)]/30"
                      title="Compose Server Announcement"
                    >
                      <Plus size={13} strokeWidth={3} />
                      <span>Announce</span>
                    </button>
                  )}

                  {notifications.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/[0.08] transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Mark all as read"
                      >
                        <CheckCheck size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteAll}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        title="Clear all notifications"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.01]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      activeTab === "all"
                        ? "bg-black/10 dark:bg-white/10 text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("unread")}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "unread"
                        ? "bg-black/10 dark:bg-white/10 text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    )}
                  </button>
                </div>
              )}

              {/* Notification List Container */}
              <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[420px] divide-y divide-[var(--border-color)]">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-3 shadow-inner">
                  <Bell size={22} className="opacity-40" />
                </div>
                <p className="text-sm font-bold text-[var(--text)] mb-1">
                  {activeTab === "unread" ? "No unread notifications" : "All caught up!"}
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-[220px]">
                  {activeTab === "unread"
                    ? "You've read all your notifications and announcements."
                    : "Server announcements and alerts will appear right here."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 px-4 transition-colors group relative flex gap-3 text-left ${
                      isUnread
                        ? "bg-black/[0.02] dark:bg-white/[0.035] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        : "opacity-75 hover:opacity-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${
                        isUnread
                          ? "bg-[var(--accent)]/15 border-[var(--accent)]/30"
                          : "bg-black/5 dark:bg-white/[0.04] border-[var(--border-color)]"
                      }`}>
                        {getTypeIcon(notif.type, notif.priority)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-xs font-extrabold line-clamp-1 ${
                          isUnread ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                        }`}>
                          {notif.title}
                        </span>
                        {getPriorityBadge(notif.priority)}
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-[var(--text)]/80 whitespace-pre-wrap leading-relaxed break-words mb-2">
                        {notif.message}
                      </p>

                      {/* Optional Action Link */}
                      {notif.link && (
                        <div className="mb-2">
                          {notif.link.startsWith("/") ? (
                            <Link
                              to={notif.link}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline"
                            >
                              <span>View details</span>
                              <ExternalLink size={11} />
                            </Link>
                          ) : (
                            <a
                              href={notif.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline"
                            >
                              <span>Open link</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimestamp(notif.createdAt)}
                        </span>
                        {notif.createdBy && (
                          <>
                            <span>•</span>
                            <span>From {notif.createdBy}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hover Card Actions */}
                    <div className="absolute top-3.5 right-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(notif.id, notif.read)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          notif.read
                            ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
                            : "text-[var(--accent)] hover:bg-[var(--accent)]/20"
                        }`}
                        title={notif.read ? "Mark as unread" : "Mark as read"}
                      >
                        <Check size={14} strokeWidth={notif.read ? 2 : 3} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        title="Delete for me"
                      >
                        <Trash2 size={14} />
                      </button>

                      {user?.isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteGlobal(notif.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-600/40 border border-red-500/30 transition cursor-pointer"
                          title="Admin: Delete globally for everyone"
                        >
                          <Globe size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
