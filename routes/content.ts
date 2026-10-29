import express from 'express';
import nodemailer from 'nodemailer';
import { Fund } from '../models/Fund';
import { Notice } from '../models/Notice';
import { Event } from '../models/Event';
import { requireAdmin } from '../middleware/auth'; 

const router = express.Router();

// ================== FUND ==================
router.get('/fund', async (req, res) => {
  try {
    let fund = await Fund.findOne();
    if (!fund) fund = await Fund.create({ totalAmount: 0 });
    res.json({ totalAmount: fund.totalAmount });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/fund/update', requireAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    let fund = await Fund.findOne();
    if (!fund) fund = await Fund.create({ totalAmount: Number(amount) });
    else {
      fund.totalAmount += Number(amount);
      await fund.save();
    }
    res.json({ success: true, totalAmount: fund.totalAmount });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ================== NOTICES ==================
router.get('/notices/latest', async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ createdAt: -1 });
    res.json({ success: true, notice });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/notices', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/notices/add', requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const notice = await Notice.create({ title, description });
    res.json({ success: true, notice });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ নতুন: Notice ডিলিট
router.delete('/notices/:id', requireAdmin, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'নোটিশ ডিলিট হয়েছে' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ================== EVENTS ==================
router.get('/events/upcoming', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, events });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/events/add', requireAdmin, async (req, res) => {
  try {
    const { title, date } = req.body;
    const event = await Event.create({ title, date });
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ নতুন: Event ডিলিট
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'ইভেন্ট ডিলিট হয়েছে' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ================== NEWSLETTER ==================
router.post('/newsletter/send', requireAdmin, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'বিষয় এবং বিবরণ দিন' });
    }

    const { User } = require('../models/User');
    const users = await User.find({ approved: true, email: { $exists: true, $ne: '' } }).select('email');
    const emails = users.map((u: any) => u.email);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: 'কোনো সাবস্ক্রাইবার পাওয়া যায়নি' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Ekotaboddho B.P" <${process.env.EMAIL_USER}>`,
      bcc: emails.join(','),
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dt0zlw656/image/upload/v1740134764/ekotaboddho_logo.png" alt="Logo" style="width: 80px; border-radius: 50%;">
          </div>
          <h2 style="color: #6C63FF; text-align: center;">${subject}</h2>
          <p style="color: #333; line-height: 1.6; font-size: 16px;">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">এটি একটি অটোমেটেড মেসেজ। Ekotaboddho B.P এর পক্ষ থেকে পাঠানো হয়েছে।</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `${emails.length} জন সদস্যকে ইমেইল পাঠানো হয়েছে` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'ইমেইল পাঠাতে সমস্যা হয়েছে' });
  }
});

export default router;
