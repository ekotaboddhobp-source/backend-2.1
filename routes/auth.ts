import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { sendOtpEmail } from '../utils/sendEmail';

const router = express.Router();

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, fatherName, area, houseName } = req.body;

    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ success: false, message: 'এই নম্বর বা ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // ১০ মিনিট

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.fatherName = fatherName;
      existingUser.area = area;
      existingUser.houseName = houseName;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      const newUser = new User({
        name, email, phone, password: hashedPassword, fatherName, area, houseName, otp, otpExpires,
      });
      await newUser.save();
    }

    await sendOtpEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'OTP পাঠানো হয়েছে, অনুগ্রহ করে ইমেইল চেক করুন।',
      email: email,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// ================= VERIFY REGISTER OTP =================
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });

    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'ভুল OTP দিয়েছেন' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP-এর মেয়াদ শেষ' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'ইমেইল সফলভাবে ভেরিফাই হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    if (!user.isVerified) return res.status(400).json({ success: false, message: 'আপনার ইমেইল ভেরিফাই করা হয়নি।' });
    if (user.rejected) return res.status(400).json({ success: false, message: 'আপনার অ্যাকাউন্ট রিজেক্ট করা হয়েছে।' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'পাসওয়ার্ড ভুল' });

    // (যদি 2FA চালু থাকে, তবে এখানে requires2FA পাঠানো যাবে)
    const requires2FA = false; 

    if (requires2FA) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(user.email, otp);
      
      const tempToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
      return res.status(200).json({ success: true, requires2FA: true, tempToken });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    const userData = { ...user.toObject(), password: undefined };

    res.status(200).json({ success: true, token, user: userData, message: 'লগইন সফল' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// ================= FORGOT PASSWORD =================
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    
    if (!user) return res.status(404).json({ success: false, message: 'এই নম্বর দিয়ে কোনো একাউন্ট নেই' });
    
    if (!user.email) {
      return res.status(400).json({ success: false, message: 'এই একাউন্টের সাথে কোনো ইমেইল যুক্ত নেই' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(user.email, otp);

    const tempToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

    res.json({ success: true, message: 'আপনার রেজিস্টার্ড ইমেইলে OTP পাঠানো হয়েছে', tempToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// ================= VERIFY RESET OTP =================
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    
    const decoded: any = jwt.verify(tempToken, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'ভুল OTP' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP-এর মেয়াদ শেষ' });

    const resetToken = jwt.sign({ userId: user._id, type: 'reset' }, process.env.JWT_SECRET as string, { expiresIn: '15m' });

    res.json({ success: true, resetToken });
  } catch (error) {
    res.status(400).json({ success: false, message: 'টোকেনের মেয়াদ শেষ বা ভুল' });
  }
});

// ================= RESET PASSWORD =================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    if (decoded.type !== 'reset') {
      return res.status(400).json({ success: false, message: 'ভুল টোকেন' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'টোকেনের মেয়াদ শেষ বা ভুল' });
  }
});

// ================= VERIFY 2FA =================
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    
    const decoded: any = jwt.verify(tempToken, process.env.JWT_SECRET as string);
    const user = await User.findById(decoded.userId);
    
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'ভুল OTP' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP-এর মেয়াদ শেষ' });

    // OTP ক্লিয়ার করা
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // নতুন টোকেন তৈরি
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    const userData = { ...user.toObject(), password: undefined };

    res.json({ success: true, token, user: userData, message: '2FA ভেরিফিকেশন সফল' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'টোকেনের মেয়াদ শেষ বা ভুল' });
  }
});

// ================= VERIFY CODE (জেনারেল) =================
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    
    if (user.otp !== code) return res.status(400).json({ success: false, message: 'ভুল কোড' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'কোডের মেয়াদ শেষ' });

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'সফলভাবে ভেরিফাই হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

export default router;