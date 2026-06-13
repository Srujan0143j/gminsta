import express from 'express';
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  toggleBlockUser,
  searchUsers,
  getSuggestedUsers,
  getUserFollowers,
  getUserFollowing,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);
router.post('/block/:id', protect, toggleBlockUser);
router.get('/search', protect, searchUsers);
router.get('/suggested', protect, getSuggestedUsers);
router.get('/:id/followers', protect, getUserFollowers);
router.get('/:id/following', protect, getUserFollowing);

export default router;
