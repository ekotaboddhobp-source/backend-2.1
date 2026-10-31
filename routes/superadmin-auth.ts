// backend/src/routes/superadmin-auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

router.post('/verify-super', requireAuth, async (req: any, res) => {
  try {
    const { password } = req.body;

    // ✅ .env থেকে পাসওয়ার্ড — কোডে হার্ডকোড নয়
    if (!process.env.SUPER_ADMIN_PASSWORD) {
      console.error('SUPER_ADMIN_PASSWORD not set in .env');
      return res
        .status(500)
        .json({ success: false, message: 'Server misconfigured' });
    }

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

    // ✅ শর্ট-লাইভ সুপার টোকেন ইস্যু
    const superToken = jwt.sign(
      { userId: user._id, super: true, role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );

    res.json({ success: true, superToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
