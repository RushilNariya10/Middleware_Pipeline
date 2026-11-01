const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Database performance indexes:
// Accelerates sorting by recency and filtering by completion/priority status
taskSchema.index({ createdAt: -1 });
taskSchema.index({ completed: 1, priority: 1 });

// Pre-save hook that automatically trims whitespace from the title field
taskSchema.pre('save', function () {
  if (this.title) {
    this.title = this.title.trim();
  }
});

module.exports = mongoose.model('Task', taskSchema);
