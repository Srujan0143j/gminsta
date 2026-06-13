import express from 'express';
import {
  addComment,
  getCommentsByPost,
  deleteComment,
  editComment,
  toggleLikeComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:postId', protect, addComment);
router.get('/:postId', protect, getCommentsByPost);
router.delete('/:id', protect, deleteComment);
router.put('/:id', protect, editComment);
router.post('/:id/like', protect, toggleLikeComment);

export default router;
