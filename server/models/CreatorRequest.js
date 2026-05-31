import mongoose from 'mongoose';

const creatorRequestSchema = new mongoose.Schema({
  requestId: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  youtubeUrl: {
    type: String,
    trim: true,
    default: null
  },
  twitchUrl: {
    type: String,
    trim: true,
    default: null
  },
  contentType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subscriberCount: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

creatorRequestSchema.index({ status: 1, submittedAt: -1 });
creatorRequestSchema.index({ userId: 1 });

export default mongoose.model('CreatorRequest', creatorRequestSchema);
