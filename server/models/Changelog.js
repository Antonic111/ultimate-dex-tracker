import mongoose from 'mongoose';

const changelogSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['feature', 'improvement', 'fix', 'removed', 'security'],
    required: true,
    default: 'feature'
  },
  items: {
    type: [String],
    default: []
  }
}, { _id: false });

const changelogSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    trim: true
  },
  releaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: false,
    index: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  sections: {
    type: [changelogSectionSchema],
    default: []
  },
  createdBy: {
    type: String,
    trim: true,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for fast querying of public and admin listings
changelogSchema.index({ published: 1, releaseDate: -1, createdAt: -1 });
changelogSchema.index({ version: 1 });

export default mongoose.models.Changelog || mongoose.model('Changelog', changelogSchema);
