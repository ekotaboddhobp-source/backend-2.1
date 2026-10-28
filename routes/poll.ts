import express from 'express';
import jwt from 'jsonwebtoken';
import { Poll } from '../models/Poll';

const router = express.Router();

// সব চলমান পোল দেখা
router.get('/active', async (req, res) => {
  try {
    const polls = await Poll.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, polls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// ভোট দেওয়া (ডাবল ভোটিং ব্লকসহ)
router.post('/vote/:id', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    
    // টোকেন থেকে ইউজার আইডি বের করা
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'পোল পাওয়া যায়নি' });
    
    // ✅ চেক করা ইউজার আগে ভোট দিয়েছে কি না
    if (poll.voters.includes(decoded.userId)) {
      return res.status(400).json({ success: false, message: 'আপনি ইতিমধ্যে ভোট দিয়েছেন!' });
    }

    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes += 1;
      poll.voters.push(decoded.userId); // ✅ ভোটার হিসেবে সেভ করা
      await poll.save();
      res.json({ success: true, message: 'ভোট গৃহীত হয়েছে' });
    } else {
      res.status(400).json({ success: false, message: 'ভুল অপশন' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

// নতুন পোল তৈরি করা (অ্যাডমিনের জন্য)
router.post('/create', async (req, res) => {
  try {
    const { question, options } = req.body;
    // ✅ নিশ্চিত করা হচ্ছে যে options একটি অ্যারে
    if (!Array.isArray(options)) {
      return res.status(400).json({ success: false, message: 'অপশন অবশ্যই একটি অ্যারে হতে হবে' });
    }
    const formattedOptions = options.map((opt: string) => ({ text: opt, votes: 0 }));
    
    const newPoll = new Poll({ question, options: formattedOptions });
    await newPoll.save();
    res.json({ success: true, message: 'পোল তৈরি হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সার্ভার এরর' });
  }
});

export default router;