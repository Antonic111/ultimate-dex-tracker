import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
  reportId: {
    type: Number,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  type: {
    type: String,
    required: true,
    enum: ['bug', 'feature', 'help'],
    default: 'help'
  },
  status: {
    type: String,
    enum: [
      // Common / Legacy
      'open', 'resolved', 'closed',
      // Help
      'new', 'awaiting_staff', 'awaiting_user',
      // Bug
      'reported', 'investigating', 'confirmed', 'fix_in_progress', 'fixed',
      // Feature
      'submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined', 'duplicate'
    ],
    default: 'awaiting_staff'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    trim: true,
    default: 'General Support'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Bug specific
  stepsToReproduce: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  expectedBehavior: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  // Feature specific
  useCase: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  // Changelog connection
  linkedChangelogVersion: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String
  }],
  technicalInfo: {
    type: mongoose.Schema.Types.Mixed
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'user'
    },
    senderName: {
      type: String,
      default: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    attachments: [{
      type: String
    }],
    isInternalNote: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  activityLog: [{
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actorName: {
      type: String
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for fast filtering and sorted inboxes
bugReportSchema.index({ status: 1, lastActivityAt: -1 });
bugReportSchema.index({ type: 1, status: 1 });
bugReportSchema.index({ submittedBy: 1, lastActivityAt: -1 });

export default mongoose.model('BugReport', bugReportSchema);
