import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import { User } from '../models/User';
import cloudinary from '../utils/cloudinary'; // ✅ Cloudinary ইমপোর্ট

const router = express.Router();

router.get('/approved', async (req, res) => {
  try {
    const users = await User.find({ approved: true }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const users = await User.find({ approved: false, isVerified: true, rejected: false }).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/group-link', async (req, res) => {
  res.json({ success: true, groupLink: 'https://m.me/j/AbY123456789' });
});

router.put('/accept-rules', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    await User.findByIdAndUpdate(decoded.userId, { rulesAccepted: true });
    
    res.json({ success: true, message: 'Rules accepted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/reject/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { rejected: true, approved: false });
    res.json({ success: true, message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { name, phone, address, bloodGroup, fatherName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, bloodGroup, fatherName },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'পুরোনো পাসওয়ার্ড ভুল' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ আসল Cloudinary দিয়ে প্রোফাইল ছবি আপলোড
router.post('/profile-picture', async (req, res) => {
  try {
    const { image } = req.body; 
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    if (!image || !image.startsWith('data:image')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    // Cloudinary-তে আপলোড করা
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'ekotaboddho/profiles', // Cloudinary-তে ফোল্ডারের নাম
      transformation: [{ width: 500, height: 500, crop: 'limit' }] // ছবি রিসাইজ
    });

    const finalImageUrl = uploadResponse.secure_url;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { photoUrl: finalImageUrl },
      { new: true }
    );

    res.json({ success: true, photoUrl: finalImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;