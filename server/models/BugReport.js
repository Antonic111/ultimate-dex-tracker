import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
  reportId: {
    type: Number,
    required: true
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
    maxlength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['bug', 'feature'],
    default: 'bug'
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous submissions
  }
}, {
  timestamps: true
});

// Index for efficient querying
bugReportSchema.index({ status: 1, submittedAt: -1 });
bugReportSchema.index({ reportId: 1, type: 1 }, { unique: true });


export default mongoose.model('BugReport', bugReportSchema);
