import mongoose from 'mongoose';
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
export const Notice = mongoose.model('Notice', noticeSchema);