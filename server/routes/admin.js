import express from 'express';
import {
  getDashboardStats,
  getReports,
  updateReportStatus,
  toggleBanUser,
  deleteContentAdmin,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/reports', protect, admin, getReports);
router.put('/reports/:id', protect, admin, updateReportStatus);
router.put('/users/:id/ban', protect, admin, toggleBanUser);
router.delete('/content', protect, admin, deleteContentAdmin);

export default router;
