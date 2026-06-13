import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/changepassword', protect, changePassword);

export default router;
