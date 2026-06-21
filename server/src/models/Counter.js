// models/Counter.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String, // 'GRN', 'PO', 'SO'
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
}, {
  versionKey: false
});

export default mongoose.model('Counter', counterSchema);
