import express from 'express';
import {
  createReel,
  getReels,
  toggleLikeReel,
  incrementViewCount,
  deleteReel,
  getUserReels,
} from '../controllers/reelController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, upload.single('video'), createReel);
router.get('/', protect, getReels);
router.get('/diagnose', async (req, res) => {
  try {
    const Reel = (await import('../models/Reel.js')).default;
    const count = await Reel.countDocuments({});
    const reels = await Reel.find({}).populate('user', 'username');
    res.json({ success: true, count, reels });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
router.get('/user/:username', protect, getUserReels);
router.post('/:id/like', protect, toggleLikeReel);
router.post('/:id/view', protect, incrementViewCount);
router.delete('/:id', protect, deleteReel);

export default router;
