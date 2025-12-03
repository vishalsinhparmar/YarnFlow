import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
unitSchema.index({ name: 1 });

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
