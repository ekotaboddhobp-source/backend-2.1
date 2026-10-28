import express from 'express';
import { Fund } from '../models/Fund';
import { Notice } from '../models/Notice';
import { Event } from '../models/Event';

const router = express.Router();

// ================== FUND ==================
router.get('/fund', async (req, res) => {
  try {
    let fund = await Fund.findOne();
    if (!fund) fund = await Fund.create({ totalAmount: 0 });
    res.json({ totalAmount: fund.totalAmount });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/fund/update', async (req, res) => {
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

router.post('/notices/add', async (req, res) => {
  try {
    const { title, description } = req.body;
    const notice = await Notice.create({ title, description });
    res.json({ success: true, notice });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ================== EVENTS ==================
router.get('/events/upcoming', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, events });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/events/add', async (req, res) => {
  try {
    const { title, date } = req.body;
    const event = await Event.create({ title, date });
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ success: false }); }
});

export default router;