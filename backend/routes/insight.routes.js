import { Router } from 'express';
import * as insightController from '../controllers/insight.controller.js';

const router = Router();

router.get('/', insightController.list);
router.post('/generate', insightController.generate);

export default router;
