import express from 'express';
import {
  createStory,
  getStoriesFeed,
  viewStory,
  deleteStory,
  getStoryViewers,
  toggleLikeStory,
  getHighlights,
} from '../controllers/storyController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();
function Router() {
  return express.Router();
}

router.post('/', protect, upload.single('media'), createStory);
router.get('/feed', protect, getStoriesFeed);
router.post('/:id/view', protect, viewStory);
router.delete('/:id', protect, deleteStory);
router.get('/:id/viewers', protect, getStoryViewers);
router.post('/:id/like', protect, toggleLikeStory);
router.get('/highlights/:username', protect, getHighlights);

export default router;
