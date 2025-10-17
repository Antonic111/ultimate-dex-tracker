import express from 'express';
import BugReport from '../models/BugReport.js';
import rateLimit from 'express-rate-limit';
import { sanitizeInput } from '../sanitizeInput.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// Rate limiting for bug report submissions
const bugReportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 bug reports per 15 minutes
  message: { error: 'Too many bug reports submitted, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Submit a new bug report
router.post('/', bugReportRateLimit, authenticateUser, async (req, res) => {
  try {
    const { title, description, type = 'bug' } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required' 
      });
    }

    // Sanitize inputs
    const titleResult = sanitizeInput(title);
    const descriptionResult = sanitizeInput(description);
    
    const sanitizedData = {
      title: titleResult.sanitized,
      description: descriptionResult.sanitized,
      type: type, // Use the type directly, don't override with 'bug'
      submittedBy: req.userId // Track which user submitted the report
    };

    // Generate reportId based on type
    const lastReport = await BugReport.findOne({ type: type }, {}, { sort: { reportId: -1 } });
    const nextReportId = lastReport ? lastReport.reportId + 1 : 1;
    
    // Create bug report
    const bugReport = new BugReport({
      ...sanitizedData,
      reportId: nextReportId
    });
    await bugReport.save();

    res.status(201).json({ 
      message: 'Bug report submitted successfully',
      id: bugReport._id 
    });

  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({ 
      error: 'Failed to submit bug report' 
    });
  }
});

// Get bug reports (admin only - you can add authentication later)
router.get('/', async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const bugReports = await BugReport.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await BugReport.countDocuments(query);

    res.json({
      bugReports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bug reports' 
    });
  }
});

// Update bug report status (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes) updateData.adminNotes = sanitizeInput(adminNotes);
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const bugReport = await BugReport.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    if (!bugReport) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json(bugReport);

  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({ 
      error: 'Failed to update bug report' 
    });
  }
});

export default router;
