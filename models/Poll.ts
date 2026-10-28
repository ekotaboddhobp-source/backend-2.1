import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ✅ নতুন ফিল্ড
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Poll = mongoose.model('Poll', pollSchema);