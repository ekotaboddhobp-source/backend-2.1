import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fatherName: { type: String },
  address: { type: String },
  photoUrl: { type: String, default: '' },
  area: { type: String, required: true },
  houseName: { type: String },
  role: { type: String, default: 'user' },
  approved: { type: Boolean, default: false },
  rulesAccepted: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false }, // ✅ নতুন ফিল্ড যোগ করা হলো
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  memberId: { type: String, unique: true, sparse: true },
  bloodGroup: { type: String, default: 'N/A' },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);