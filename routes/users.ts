// backend/src/routes/users.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import cloudinary from '../utils/cloudinary';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = express.Router();

// ==================== GET: Approved users ====================
router.get('/approved', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ approved: true }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GET: Pending users ====================
router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({
      approved: false,
      isVerified: true,
      rejected: false,
    }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GET: Group link ====================
router.get('/group-link', async (req, res) => {
  res.json({ success: true, groupLink: 'https://m.me/j/AbY123456789' });
});

// ==================== PUT: Accept rules ====================
router.put('/accept-rules', requireAuth, async (req: any, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { rulesAccepted: true });
    res.json({ success: true, message: 'Rules accepted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== PUT: Reject user ====================
router.put('/reject/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      rejected: true,
      approved: false,
    });
    res.json({ success: true, message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== PUT: Freeze / Unfreeze ====================
router.put('/freeze/:id', requireAdmin, async (req, res) => {
  try {
    const { frozen } = req.body;
    await User.findByIdAndUpdate(req.params.id, { frozen: !!frozen });
    res.json({
      success: true,
      message: frozen ? 'ইউজার ফ্রিজ করা হয়েছে' : 'ইউজার আনফ্রিজ করা হয়েছে',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ✅ FIX: Update profile (auth required) ====================
// শুধুমাত্র নিজের প্রোফাইল অথবা অ্যাডমিন আপডেট করতে পারবে
router.put('/update/:id', requireAuth, async (req: any, res) => {
  try {
    const targetId = req.params.id;
    const isAdmin = req.user.role === 'admin';
    const isOwn = req.user.userId === targetId;

    if (!isAdmin && !isOwn) {
      return res
        .status(403)
        .json({ success: false, message: 'অনুমতি নেই' });
    }

    const { name, phone, address, bloodGroup, fatherName, area, houseName } =
      req.body;

    const user = await User.findByIdAndUpdate(
      targetId,
      { name, phone, address, bloodGroup, fatherName, area, houseName },
      { new: true }
    ).select('-password');

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ✅ FIX: Change password (auth + self only) ====================
// userId body থেকে নেবেন না — JWT থেকে নিন
router.put('/change-password', requireAuth, async (req: any, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId; // ✅ JWT থেকে — body থেকে নয়

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: 'পুরোনো পাসওয়ার্ড ভুল' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== POST: Profile picture ====================
router.post('/profile-picture', requireAuth, async (req: any, res) => {
  try {
    const { image } = req.body;

    if (!image || !image.startsWith('data:image')) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid image format' });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'ekotaboddho/profiles',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' },
      ],
    });

    const finalImageUrl = uploadResponse.secure_url;
    await User.findByIdAndUpdate(req.user.userId, {
      photoUrl: finalImageUrl,
    });

    res.json({ success: true, photoUrl: finalImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

// ==================== ✅ NEW: Get current user (fresh data) ====================
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== DELETE: User (admin only) ====================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
