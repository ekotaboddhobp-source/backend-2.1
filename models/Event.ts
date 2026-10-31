// backend/src/models/Event.ts
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true }, // ✅ String → Date
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.model('Event', eventSchema);
