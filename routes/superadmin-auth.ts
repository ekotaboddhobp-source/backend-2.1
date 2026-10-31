import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

router.post('/verify-super', requireAuth, async (req: any, res) => {
  try {
    const { password } = req.body;

    // ✅ .env থেকে পাসওয়ার্ড নিন — কোডে হার্ডকোড নয়
    if (password !== process.env.SUPER_ADMIN_PASSWORD) {
      return res
        .status(403)
        .json({ success: false, message: 'Access Denied' });
    }

    // ✅ Verify user actually admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Admin only' });
    }

    // ✅ শর্ট-লাইভ সুপার টোকেন ইস্যু করুন
    const superToken = jwt.sign(
      { userId: user._id, super: true },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );

    res.json({ success: true, superToken });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
