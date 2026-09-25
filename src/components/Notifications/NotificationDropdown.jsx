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
  Globe,
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { notificationsAPI } from "../../utils/api";
import { getUserAvatarUrl } from "../../utils/profileUtils";
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
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'
  const [showAdminComposer, setShowAdminComposer] = useState(false);

  // Responsive Mobile Detection (screen width <= 1024px or mobile userAgent)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      if (showMessage) showMessage("All notifications marked as read.", "success");
    } catch (err) {
      console.error("Failed to mark all read:", err);
      if (showMessage) showMessage("Failed to update notifications.", "error");
    }
  };

  // Delete all notifications for current user
  const handleDeleteAll = async () => {
    if (!notifications.length) return;
    try {
      await notificationsAPI.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      if (showMessage) showMessage("All notifications cleared.", "info");
    } catch (err) {
      console.error("Failed to delete all:", err);
      if (showMessage) showMessage("Failed to clear notifications.", "error");
    }
  };

  // Toggle single notification read status
  const handleToggleRead = async (id, currentReadStatus) => {
    try {
      const newStatus = !currentReadStatus;
      await notificationsAPI.markAsRead(id, newStatus);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: newStatus } : n))
      );
      setUnreadCount(prev => (newStatus ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error("Failed to toggle read status:", err);
    }
  };

  // Delete single notification for current user
  const handleDeleteNotification = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Admin delete globally for everyone
  const handleAdminDeleteGlobal = async (id) => {
    if (!window.confirm("Delete this notification GLOBALLY for all users?")) return;
    try {
      await notificationsAPI.adminDeleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (showMessage) showMessage("Notification globally removed.", "success");
    } catch (err) {
      console.error("Failed to admin delete notification:", err);
      if (showMessage) showMessage(err.message || "Failed to delete notification.", "error");
    }
  };

  // Handle Admin Sending Announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!composerForm.title.trim() || !composerForm.message.trim()) return;

    try {
      setIsSending(true);
      await notificationsAPI.postAdminAnnouncement({
        title: composerForm.title.trim(),
        message: composerForm.message.trim(),
        priority: composerForm.priority,
        type: composerForm.type,
        link: composerForm.link.trim() || null
      });

      if (showMessage) showMessage("Announcement broadcasted successfully!", "success");
      setComposerForm({
        title: "",
        message: "",
        priority: "normal",
        type: "announcement",
        link: ""
      });
      setShowAdminComposer(false);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to broadcast announcement:", err);
      if (showMessage) showMessage(err.message || "Failed to broadcast announcement.", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Filter & Sort list
  const displayedNotifications = notifications
    .filter(n => {
      if (activeTab === "unread") return !n.read;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getTypeIcon = (type, priority) => {
    const style = { width: "26px", height: "26px", minWidth: "26px", minHeight: "26px" };
    if (priority === "alert") return <AlertTriangle size={26} style={style} className="text-red-400 shrink-0" />;
    if (priority === "important") return <Megaphone size={26} style={style} className="text-amber-400 shrink-0" />;
    if (type === "event") return <Sparkles size={26} style={style} className="text-[var(--accent)] shrink-0" />;
    if (type === "system") return <Info size={26} style={style} className="text-blue-400 shrink-0" />;
    return <Megaphone size={26} style={style} className="text-[var(--accent)] shrink-0" />;
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
        className={`w-full h-full rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95 outline-none focus:outline-none focus-visible:outline-none focus:border-[var(--accent)] flex-shrink-0 ${isOpen
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

      {/* Flyout Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              backgroundColor: 'var(--dropdown-bg, rgba(20, 20, 23, 0.98))',
              borderColor: 'var(--dropdown-border, rgba(255, 255, 255, 0.12))',
              maxHeight: 'calc(100dvh - 100px)',
              WebkitOverflowScrolling: 'touch'
            }}
            className="fixed top-[84px] left-3 right-3 sm:absolute sm:top-[calc(100%+14px)] sm:left-auto sm:right-0 sm:w-[420px] sm:max-h-[620px] rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-[9999] flex flex-col overflow-hidden text-left"
          >
            {/* Top Glow Accent Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-75 shrink-0" />

            {showAdminComposer ? (
              /* ADMIN COMPOSER VIEW */
              <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                {/* Composer Header */}
                <div className="p-3.5 px-4 border-b border-[var(--border-color)] flex items-center justify-between bg-black/10 dark:bg-black/20 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAdminComposer(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                      title="Back to notifications"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span className="font-extrabold text-[var(--text)] text-sm tracking-wide">
                      Broadcast Announcement
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminComposer(false);
                      setIsOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
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
                    inputClassName="custom-scrollbar resize-none text-xs h-[90px] overflow-y-auto"
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
                      fullWidth
                    />
                  </div>

                  {/* Natural flow Action Buttons */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06] mt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdminComposer(false)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSending || !composerForm.title.trim() || !composerForm.message.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-black bg-[var(--accent)] hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
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
                {/* Header (Top Bar) */}
                <div className="p-3.5 px-4 border-b border-[var(--border-color)] flex items-center justify-between bg-black/10 dark:bg-black/20 shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
                      <Bell size={18} className="text-[var(--accent)]" />
                    </div>
                    <span className="font-extrabold text-[var(--text)] text-sm tracking-wide whitespace-nowrap">
                      Notifications
                    </span>
                  </div>

                  {/* Quick Actions in Header */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user?.isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowAdminComposer(true)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 shadow-sm shrink-0"
                        title="Compose Server Announcement"
                      >
                        <Plus size={14} strokeWidth={3} />
                        <span>Announce</span>
                      </button>
                    )}

                    {notifications.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={unreadCount === 0}
                          className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] text-[var(--text-muted)] hover:text-[var(--text)] transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                          title="Mark all as read"
                        >
                          <Check size={18} strokeWidth={2.5} />
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteAll}
                          className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.04] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition flex items-center justify-center cursor-pointer shrink-0"
                          title="Clear all notifications"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabs & Sort Bar */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between px-4 pt-3 border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.01]">
                    {/* Clean Underline Tabs */}
                    <div className="flex items-center gap-4 -mb-[1px]">
                      <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`pb-2 px-1 text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center border-b-2 ${
                          activeTab === "all"
                            ? "text-[var(--accent)]"
                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                        style={{
                          borderBottomColor: activeTab === "all" ? "var(--accent)" : "transparent"
                        }}
                      >
                        <span>All ({notifications.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("unread")}
                        className={`pb-2 px-1 text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 border-b-2 ${
                          activeTab === "unread"
                            ? "text-[var(--accent)]"
                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                        style={{
                          borderBottomColor: activeTab === "unread" ? "var(--accent)" : "transparent"
                        }}
                      >
                        <span>Unread</span>
                        {unreadCount > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                        )}
                      </button>
                    </div>

                    {/* Newest / Oldest Sorter Toggle */}
                    <button
                      type="button"
                      onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                      className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] pb-2 transition cursor-pointer px-1"
                      title="Toggle sorting order"
                    >
                      <ArrowUpDown size={12} />
                      <span className="capitalize">{sortOrder}</span>
                    </button>
                  </div>
                )}

                {/* Notifications List Body */}
                <div className="p-3 overflow-y-auto max-h-[440px] space-y-2.5 custom-scrollbar flex-1">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                      <span className="text-xs text-[var(--text-muted)] font-medium">Loading notifications...</span>
                    </div>
                  ) : displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                        <CheckCheck size={22} className="opacity-50" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text)]">
                        {activeTab === "unread" ? "No unread notifications" : "You're all caught up!"}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] max-w-[240px] mt-1">
                        {activeTab === "unread"
                          ? "All notifications have been marked as read."
                          : "Server announcements and alerts will appear right here."}
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map((notif) => {
                      const isUnread = !notif.read;
                      const isAlert = notif.priority === "alert";
                      const isImportant = notif.priority === "important";

                      let cardBorderLeftColor = 'var(--accent)';
                      let iconBoxStyle = {
                        borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
                        backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)'
                      };
                      let badgeStyle = {
                        borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
                        backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                        color: 'var(--accent)'
                      };
                      let badgeLabel = notif.type === "event" ? "EVENT" : "ANNOUNCEMENT";

                      if (isAlert) {
                        cardBorderLeftColor = '#ef4444';
                        iconBoxStyle = {
                          borderColor: 'rgba(239, 68, 68, 0.45)',
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#f87171'
                        };
                        badgeStyle = {
                          borderColor: 'rgba(239, 68, 68, 0.45)',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171'
                        };
                        badgeLabel = "CRITICAL ALERT";
                      } else if (isImportant) {
                        cardBorderLeftColor = '#f59e0b';
                        iconBoxStyle = {
                          borderColor: 'rgba(245, 158, 11, 0.45)',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#fbbf24'
                        };
                        badgeStyle = {
                          borderColor: 'rgba(245, 158, 11, 0.45)',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#fde68a'
                        };
                        badgeLabel = "IMPORTANT";
                      }

                      return (
                        <div
                          key={notif.id}
                          style={{ borderLeftColor: cardBorderLeftColor, borderLeftWidth: '3px' }}
                          className="rounded-xl p-3.5 transition-all duration-200 border border-[var(--border-color)] bg-black/[0.15] dark:bg-white/[0.025] hover:bg-black/[0.25] dark:hover:bg-white/[0.045] flex flex-col gap-2.5 relative text-left"
                        >
                          {/* Card Top Row: Icon + Badge + Timestamp & Unread Dot */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              {/* Square Icon Box */}
                              <div
                                style={iconBoxStyle}
                                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
                              >
                                {getTypeIcon(notif.type, notif.priority)}
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span
                                  style={badgeStyle}
                                  className="px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider rounded-md border w-fit"
                                >
                                  {badgeLabel}
                                </span>
                              </div>
                            </div>

                            {/* Timestamp & Unread Indicator */}
                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                {formatTimestamp(notif.createdAt)}
                              </span>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] shrink-0" />
                              )}
                            </div>
                          </div>

                          {/* Card Title */}
                          <h4 className={`text-sm font-extrabold leading-snug tracking-tight ${
                            isUnread ? "text-[var(--text)]" : "text-[var(--text)]/85"
                          }`}>
                            {notif.title}
                          </h4>

                          {/* Card Message Body */}
                          <p className="text-xs text-[var(--text)]/80 whitespace-pre-wrap leading-relaxed break-words font-normal">
                            {notif.message}
                          </p>

                          {/* Optional Action URL Link */}
                          {notif.link && (
                            <div className="pt-0.5">
                              {notif.link.startsWith("/") ? (
                                <Link
                                  to={notif.link}
                                  onClick={() => setIsOpen(false)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
                                >
                                  <span>View details</span>
                                  <ExternalLink size={12} />
                                </Link>
                              ) : (
                                <a
                                  href={notif.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
                                >
                                  <span>Open link</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Card Footer: Author on Left + Action Buttons on Right */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] mt-0.5">
                            {/* Author */}
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center shrink-0 shadow-sm">
                                <img
                                  src={
                                    (notif.createdBy && user?.username && notif.createdBy.toLowerCase() === user.username.toLowerCase())
                                      ? getUserAvatarUrl(user)
                                      : (notif.creatorAvatar
                                          ? getUserAvatarUrl(notif.creatorAvatar)
                                          : (notif.creatorTrainer
                                              ? (notif.creatorTrainer.startsWith('/') ? notif.creatorTrainer : `/data/trainer_sprites/${notif.creatorTrainer}`)
                                              : getUserAvatarUrl(notif.createdBy || "Antonic")))
                                  }
                                  alt={notif.createdBy || "Author"}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <span className="hidden text-[9px] font-bold text-purple-300">
                                  {notif.createdBy ? notif.createdBy.charAt(0).toUpperCase() : "A"}
                                </span>
                              </div>
                              <span className="font-semibold text-[11.5px]">From {notif.createdBy || "Antonic"}</span>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Toggle Read */}
                              <button
                                type="button"
                                onClick={() => handleToggleRead(notif.id, notif.read)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                  notif.read
                                    ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
                                    : "text-[var(--accent)] hover:bg-[var(--accent)]/20 bg-[var(--accent)]/10"
                                }`}
                                title={notif.read ? "Mark as unread" : "Mark as read"}
                              >
                                <Check size={18} strokeWidth={notif.read ? 2 : 2.5} />
                              </button>

                              {/* Delete for me */}
                              <button
                                type="button"
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition cursor-pointer"
                                title="Delete for me"
                              >
                                <Trash2 size={18} />
                              </button>

                              {/* Admin Globe Delete */}
                              {user?.isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminDeleteGlobal(notif.id)}
                                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 flex items-center justify-center transition cursor-pointer"
                                  title="Admin: Delete globally for everyone"
                                >
                                  <Globe size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Footer Bar */}
                {notifications.length > 0 && (
                  <div className="p-3 px-4 border-t border-[var(--border-color)] flex items-center justify-between bg-black/10 dark:bg-black/20 shrink-0 text-xs text-[var(--text-muted)] font-medium">
                    <span>
                      {displayedNotifications.length} of {notifications.length} notification{notifications.length === 1 ? "" : "s"}
                    </span>

                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] text-[var(--text)] transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold text-xs"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Mark all as read</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
