import jwt from 'jsonwebtoken';
import express from 'express';
import BugReport from '../models/BugReport.js';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';
import { sanitizeInput } from '../sanitizeInput.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// Soft auth helper to capture logged-in user if available without blocking guests
function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) {
      // ignore
    }
  }
  next();
}

// Rate limiting for submissions
const bugReportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many submissions, please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Calculate next global ticket sequence (#1, #2, #3, ...) across all ticket types
async function getNextGlobalReportId() {
  const latest = await BugReport.findOne({}, { reportId: 1 }, { sort: { reportId: -1 } });
  if (!latest || typeof latest.reportId !== 'number' || latest.reportId < 1) {
    return 1;
  }
  return latest.reportId + 1;
}

// Helper: Strip internal notes for non-admin viewers
function sanitizeTicketForUser(ticketDoc, isAdmin) {
  if (!ticketDoc) return null;
  const obj = typeof ticketDoc.toObject === 'function' ? ticketDoc.toObject() : { ...ticketDoc };
  if (!isAdmin) {
    if (Array.isArray(obj.messages)) {
      obj.messages = obj.messages.filter(m => !m.isInternalNote);
    }
    // Delete admin-only internal fields
    delete obj.adminNotes;
  }
  return obj;
}

// Helper: Check if requesting user is admin
async function checkIsAdmin(userId) {
  if (!userId) return false;
  try {
    const u = await User.findById(userId).select('isAdmin role');
    return Boolean(u && (u.isAdmin || u.role === 'admin'));
  } catch (e) {
    return false;
  }
}

// -------------------------------------------------------------
// GET /api/bug-reports/my - User's personal ticket inbox
// -------------------------------------------------------------
router.get('/my', authenticateUser, async (req, res) => {
  try {
    const isAdmin = await checkIsAdmin(req.userId);
    const reports = await BugReport.find({ submittedBy: req.userId })
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .limit(60)
      .lean();

    const sanitized = reports.map(r => sanitizeTicketForUser(r, isAdmin));
    res.json({ reports: sanitized });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// -------------------------------------------------------------
// GET /api/bug-reports/:id - Fetch single ticket with messages
// -------------------------------------------------------------
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = await checkIsAdmin(req.userId);

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { reportId: Number(id) };
    const ticket = await BugReport.findOne(query)
      .populate('submittedBy', 'username avatarUrl')
      .populate('assignedTo', 'username avatarUrl');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const isOwner = ticket.submittedBy && String(ticket.submittedBy._id || ticket.submittedBy) === String(req.userId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ticket: sanitizeTicketForUser(ticket, isAdmin) });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// -------------------------------------------------------------
// POST /api/bug-reports - Submit new ticket (Help, Bug, Feature)
// -------------------------------------------------------------
router.post('/', bugReportRateLimit, optionalAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type = 'help', 
      category, 
      stepsToReproduce = '',
      expectedBehavior = '',
      useCase = '',
      attachments = [],
      technicalInfo = null
    } = req.body;

    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const validTypes = ['help', 'bug', 'feature'];
    const ticketType = validTypes.includes(type) ? type : 'help';

    // Sanitize text inputs
    const cleanTitle = sanitizeInput(title.trim()).sanitized.slice(0, 200);
    const cleanDescription = sanitizeInput(description.trim()).sanitized.slice(0, 3000);
    const cleanSteps = stepsToReproduce ? sanitizeInput(stepsToReproduce.trim()).sanitized.slice(0, 3000) : '';
    const cleanExpected = expectedBehavior ? sanitizeInput(expectedBehavior.trim()).sanitized.slice(0, 3000) : '';
    const cleanUseCase = useCase ? sanitizeInput(useCase.trim()).sanitized.slice(0, 3000) : '';

    // Assign type-specific initial status
    let initialStatus = 'awaiting_staff';
    if (ticketType === 'bug') initialStatus = 'reported';
    if (ticketType === 'feature') initialStatus = 'submitted';

    // Category fallbacks
    let cleanCategory = (category || '').trim();
    if (!cleanCategory) {
      cleanCategory = ticketType === 'help' ? 'Billing & Membership' : ticketType === 'bug' ? 'Dex & Tracking' : 'General Suggestion';
    }

    // Lookup user display name
    let senderName = 'User';
    let userDoc = null;
    if (req.userId) {
      userDoc = await User.findById(req.userId).select('username');
      if (userDoc?.username) senderName = userDoc.username;
    }

    const nextReportId = await getNextGlobalReportId();

    // Initial message seeded into conversation thread
    const initialMessage = {
      sender: req.userId || undefined,
      senderRole: 'user',
      senderName,
      content: cleanDescription,
      attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
      isInternalNote: false,
      createdAt: new Date()
    };

    const initialActivity = {
      actor: req.userId || undefined,
      actorName: senderName,
      action: 'created_ticket',
      details: `Ticket #${nextReportId} created`,
      createdAt: new Date()
    };

    const bugReport = new BugReport({
      reportId: nextReportId,
      title: cleanTitle,
      description: cleanDescription,
      type: ticketType,
      status: initialStatus,
      priority: 'normal',
      category: cleanCategory.slice(0, 100),
      stepsToReproduce: cleanSteps,
      expectedBehavior: cleanExpected,
      useCase: cleanUseCase,
      attachments: Array.isArray(attachments) ? attachments.slice(0, 3) : [],
      technicalInfo: technicalInfo && typeof technicalInfo === 'object' ? technicalInfo : undefined,
      submittedBy: req.userId || undefined,
      submittedAt: new Date(),
      lastActivityAt: new Date(),
      messages: [initialMessage],
      activityLog: [initialActivity]
    });

    await bugReport.save();

    res.status(201).json({
      message: `Ticket #${nextReportId} submitted successfully!`,
      ticket: sanitizeTicketForUser(bugReport, false)
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to submit ticket. Please try again.' });
  }
});

// -------------------------------------------------------------
// POST /api/bug-reports/:id/messages - Post reply or internal note
// -------------------------------------------------------------
router.post('/:id/messages', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachments = [], isInternalNote = false } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const report = await BugReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const currentUser = await User.findById(req.userId).select('username isAdmin role');
    const isAdmin = Boolean(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
    const isOwner = report.submittedBy && String(report.submittedBy) === String(req.userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized to reply to this ticket' });
    }

    // Only admins may create internal notes
    const internalNoteFlag = Boolean(isAdmin && isInternalNote);

    // If ticket is closed, prevent regular users from messaging
    if (report.status === 'closed' && !isAdmin) {
      return res.status(400).json({ error: 'This ticket is closed.' });
    }

    const cleanMsg = sanitizeInput(content.trim()).sanitized.slice(0, 4000);
    const cleanAttachments = Array.isArray(attachments) ? attachments.slice(0, 3) : [];

    const newMessage = {
      sender: req.userId,
      senderRole: isAdmin ? 'admin' : 'user',
      senderName: isAdmin ? (currentUser.username || 'Support Staff') : (currentUser.username || 'You'),
      content: cleanMsg,
      attachments: cleanAttachments,
      isInternalNote: internalNoteFlag,
      createdAt: new Date()
    };

    if (!Array.isArray(report.messages)) {
      report.messages = [];
    }
    report.messages.push(newMessage);
    report.lastActivityAt = new Date();

    // Workflow status transitions on public reply
    if (!internalNoteFlag) {
      if (isAdmin) {
        // Staff replied: set to awaiting_user if help request, or update activity
        if (report.type === 'help' && report.status !== 'resolved' && report.status !== 'closed') {
          report.status = 'awaiting_user';
        }
      } else {
        // User replied: set to awaiting_staff
        if (report.type === 'help' && report.status !== 'closed') {
          report.status = 'awaiting_staff';
        }
      }
    }

    // Add activity log
    if (!Array.isArray(report.activityLog)) {
      report.activityLog = [];
    }
    report.activityLog.push({
      actor: req.userId,
      actorName: currentUser.username || (isAdmin ? 'Support Staff' : 'User'),
      action: internalNoteFlag ? 'added_internal_note' : 'added_reply',
      details: internalNoteFlag ? 'Added an internal note' : 'Sent a reply to the user',
      createdAt: new Date()
    });

    await report.save();

    res.json({
      message: internalNoteFlag ? 'Internal note added' : 'Reply sent successfully',
      ticket: sanitizeTicketForUser(report, isAdmin),
      newMessage
    });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// -------------------------------------------------------------
// PATCH /api/bug-reports/:id/status - Status transitions
// -------------------------------------------------------------
router.patch('/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await BugReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const currentUser = await User.findById(req.userId).select('username isAdmin role');
    const isAdmin = Boolean(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
    const isOwner = report.submittedBy && String(report.submittedBy) === String(req.userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // User can only mark as 'resolved' or reopen as 'awaiting_staff'
    if (!isAdmin) {
      if (!['resolved', 'awaiting_staff', 'open'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status transition' });
      }
    }

    const previousStatus = report.status;
    report.status = status;
    report.lastActivityAt = new Date();

    if (status === 'resolved') {
      report.resolvedAt = new Date();
    } else if (status === 'closed') {
      report.closedAt = new Date();
    }

    if (!Array.isArray(report.activityLog)) {
      report.activityLog = [];
    }
    report.activityLog.push({
      actor: req.userId,
      actorName: currentUser.username || (isAdmin ? 'Admin' : 'User'),
      action: 'status_change',
      details: `Status changed from "${previousStatus}" to "${status}"`,
      createdAt: new Date()
    });

    await report.save();

    res.json({
      message: `Ticket marked as ${status}`,
      ticket: sanitizeTicketForUser(report, isAdmin)
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// -------------------------------------------------------------
// PATCH /api/bug-reports/:id/admin - Admin management updates
// (Priority, Assignee, Changelog linking, Status)
// -------------------------------------------------------------
router.patch('/:id/admin', authenticateUser, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('username isAdmin role');
    const isAdmin = Boolean(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { priority, status, assignedTo, linkedChangelogVersion, adminNotes } = req.body;

    const report = await BugReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const changes = [];

    if (status && status !== report.status) {
      changes.push(`Status: ${report.status} → ${status}`);
      report.status = status;
      if (status === 'resolved') report.resolvedAt = new Date();
      if (status === 'closed') report.closedAt = new Date();
    }

    if (priority && priority !== report.priority) {
      changes.push(`Priority: ${report.priority} → ${priority}`);
      report.priority = priority;
    }

    if (assignedTo !== undefined) {
      report.assignedTo = assignedTo || null;
      changes.push(assignedTo ? 'Reassigned ticket' : 'Unassigned ticket');
    }

    if (linkedChangelogVersion !== undefined) {
      report.linkedChangelogVersion = linkedChangelogVersion || null;
      changes.push(`Connected to Changelog ${linkedChangelogVersion || 'None'}`);
    }

    if (adminNotes !== undefined) {
      report.adminNotes = sanitizeInput(adminNotes).sanitized;
    }

    report.lastActivityAt = new Date();

    if (changes.length > 0) {
      if (!Array.isArray(report.activityLog)) report.activityLog = [];
      report.activityLog.push({
        actor: req.userId,
        actorName: currentUser.username || 'Admin',
        action: 'admin_update',
        details: changes.join(', '),
        createdAt: new Date()
      });
    }

    await report.save();

    const populated = await BugReport.findById(report._id)
      .populate('submittedBy', 'username avatarUrl')
      .populate('assignedTo', 'username avatarUrl');

    res.json({
      message: 'Ticket updated successfully',
      ticket: populated
    });
  } catch (error) {
    console.error('Error updating ticket metadata:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

export default router;
