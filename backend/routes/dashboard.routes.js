import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', dashboardController.summary);
router.get('/monthly-trend', dashboardController.monthlyTrend);
router.get('/category-breakdown', dashboardController.categoryBreakdown);

export default router;
