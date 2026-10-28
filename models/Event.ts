import mongoose from 'mongoose';
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
export const Event = mongoose.model('Event', eventSchema);