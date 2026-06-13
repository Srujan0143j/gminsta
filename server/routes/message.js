import express from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  createGroupConversation,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, upload.single('media'), sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.post('/group', protect, createGroupConversation);

export default router;
