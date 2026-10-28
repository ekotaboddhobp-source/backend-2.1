import mongoose from 'mongoose';
const gallerySchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: 'ছবি' },
  createdAt: { type: Date, default: Date.now }
});
export const Gallery = mongoose.model('Gallery', gallerySchema);