import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { validateContent } from "../contentFilter.js";

const router = express.Router();

// GET /api/notifications — Fetch notifications for current user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("readNotifications deletedNotifications isAdmin").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const deletedIds = new Set(user.deletedNotifications || []);
    const readIds = new Set(user.readNotifications || []);

    const allNotifs = await Notification.find({
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch live author profile info for announcements
    const creatorUsernames = [...new Set(allNotifs.map(n => n.createdBy).filter(Boolean))];
    const creators = await User.find({ username: { $in: creatorUsernames } }).select("username avatar profileTrainer").lean();
    const creatorMap = new Map(creators.map(c => [c.username.toLowerCase(), c]));

    const userNotifs = allNotifs
      .filter(n => !deletedIds.has(String(n._id)))
      .map(n => {
        const creator = n.createdBy ? creatorMap.get(n.createdBy.toLowerCase()) : null;
        return {
          ...n,
          id: String(n._id),
          read: readIds.has(String(n._id)),
          creatorAvatar: n.creatorAvatar || creator?.avatar || null,
          creatorTrainer: n.creatorTrainer || creator?.profileTrainer || null
        };
      });

    const unreadCount = userNotifs.filter(n => !n.read).length;

    res.json({
      notifications: userNotifs,
      unreadCount
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read — Toggle or set read status
router.patch("/:id/read", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { read = true } = req.body || {};

    const update = read
      ? { $addToSet: { readNotifications: String(id) } }
      : { $pull: { readNotifications: String(id) } };

    await User.updateOne({ _id: req.userId }, update);
    res.json({ success: true, id, read });
  } catch (err) {
    console.error("Error updating notification read status:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// POST /api/notifications/read-all — Mark all notifications as read
router.post("/read-all", authenticateUser, async (req, res) => {
  try {
    const allNotifs = await Notification.find({}, { _id: 1 }).lean();
    const allIds = allNotifs.map(n => String(n._id));

    await User.updateOne(
      { _id: req.userId },
      { $addToSet: { readNotifications: { $each: allIds } } }
    );

    res.json({ success: true, count: allIds.length });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id — Hide/delete notification for user
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    await User.updateOne(
      { _id: req.userId },
      {
        $addToSet: { deletedNotifications: String(id) },
        $pull: { readNotifications: String(id) }
      }
    );

    res.json({ success: true, id });
  } catch (err) {
    console.error("Error deleting notification for user:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// POST /api/notifications/delete-all — Hide/delete all notifications for user
router.post("/delete-all", authenticateUser, async (req, res) => {
  try {
    const allNotifs = await Notification.find({}, { _id: 1 }).lean();
    const allIds = allNotifs.map(n => String(n._id));

    await User.updateOne(
      { _id: req.userId },
      {
        $addToSet: { deletedNotifications: { $each: allIds } },
        $pullAll: { readNotifications: allIds }
      }
    );

    res.json({ success: true, count: allIds.length });
  } catch (err) {
    console.error("Error deleting all notifications:", err);
    res.status(500).json({ error: "Failed to delete all notifications" });
  }
});

// POST /api/notifications/announcement — Admin broadcast announcement
router.post("/announcement", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("username isAdmin profileTrainer avatar").lean();
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const { title, message, priority = "normal", type = "announcement", link = "" } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    // Check content filter
    const titleVal = validateContent(cleanTitle, "Announcement Title");
    if (!titleVal.isValid) return res.status(400).json({ error: titleVal.error });

    const msgVal = validateContent(cleanMessage, "Announcement Message");
    if (!msgVal.isValid) return res.status(400).json({ error: msgVal.error });

    const newNotif = new Notification({
      title: cleanTitle,
      message: cleanMessage,
      priority: ["normal", "important", "alert"].includes(priority) ? priority : "normal",
      type: ["announcement", "system", "event", "update"].includes(type) ? type : "announcement",
      link: String(link || "").trim(),
      createdBy: user.username || "Admin",
      creatorTrainer: user.profileTrainer || null,
      creatorAvatar: user.avatar || null,
      createdAt: new Date()
    });

    await newNotif.save();

    res.status(201).json({
      success: true,
      notification: {
        ...newNotif.toObject(),
        id: String(newNotif._id),
        read: false
      }
    });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// DELETE /api/notifications/admin/:id — Admin permanent delete announcement
router.delete("/admin/:id", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("isAdmin").lean();
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const { id } = req.params;
    await Notification.findByIdAndDelete(id);

    res.json({ success: true, id });
  } catch (err) {
    console.error("Error permanently deleting notification:", err);
    res.status(500).json({ error: "Failed to permanently delete notification" });
  }
});

export default router;
