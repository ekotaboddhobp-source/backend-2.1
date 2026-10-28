import mongoose from 'mongoose';
const fundSchema = new mongoose.Schema({
  totalAmount: { type: Number, default: 0 }
});
export const Fund = mongoose.model('Fund', fundSchema);