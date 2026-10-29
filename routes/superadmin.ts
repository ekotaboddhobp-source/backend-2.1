import express from 'express';
import { User } from '../models/User';
import { Mission } from '../models/Mission';
import { Gallery } from '../models/Gallery';
import cloudinary from '../utils/cloudinary';
import { requireAdmin } from '../middleware/auth'; 

const router = express.Router();

router.put('/approve/:id', requireAdmin, async (req, res) => {
  try {
    const memberId = 'BP-' + Math.floor(1000 + Math.random() * 9000);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true, memberId },
      { new: true }
    );
    res.json({ success: true, memberId: user?.memberId });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ================== MISSIONS ==================
router.get('/missions/active', async (req, res) => {
  try {
    const missions = await Mission.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, missions });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/missions/create', requireAdmin, async (req, res) => {
  try {
    const { title, description, progress, albumPhotos } = req.body;
    const mission = await Mission.create({ title, description, progress, albumPhotos });
    res.json({ success: true, mission });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ নতুন: Mission ডিলিট
router.delete('/missions/:id', requireAdmin, async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'মিশন ডিলিট হয়েছে' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ================== GALLERY ==================
router.get('/albums/photos', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, photos });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/gallery/add', requireAdmin, async (req, res) => {
  try {
    const { imageUrl, title } = req.body;
    const photo = await Gallery.create({ url: imageUrl, caption: title });
    res.json({ success: true, photo });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ✅ নতুন: Gallery photo ডিলিট
router.delete('/gallery/:id', requireAdmin, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'ছবি ডিলিট হয়েছে' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ================== UPLOAD ==================
router.post('/upload', requireAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data.startsWith('data:image')) {
      return res.status(400).json({ success: false, message: 'Invalid image data' });
    }

    const uploadResponse = await cloudinary.uploader.upload(data, {
      folder: 'ekotaboddho/gallery',
      transformation: [
        { width: 1000, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' }
      ]
    });

    res.json({ success: true, url: uploadResponse.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

export default router;
