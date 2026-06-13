import express from 'express';
import {
  createPost,
  getFeed,
  getExplore,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  toggleSavePost,
  getSavedPosts,
  getUsersWhoLiked,
  getUserPosts,
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, upload.array('media', 10), createPost);
router.get('/feed', protect, getFeed);
router.get('/explore', protect, getExplore);
router.get('/saved', protect, getSavedPosts);
router.get('/user/:username', protect, getUserPosts);
router.get('/:id', protect, getPostById);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/save', protect, toggleSavePost);
router.get('/:id/likes', protect, getUsersWhoLiked);

export default router;
