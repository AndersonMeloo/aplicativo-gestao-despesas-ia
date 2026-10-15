import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import transactionRoutes from './transaction.routes.js';
import budgetRoutes from './budget.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import insightRoutes from './insight.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rotas públicas (register/login); /auth/me é protegida dentro de auth.routes
router.use('/auth', authRoutes);

// Todas as rotas abaixo exigem login
router.use('/categories', requireAuth, categoryRoutes);
router.use('/transactions', requireAuth, transactionRoutes);
router.use('/budgets', requireAuth, budgetRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/insights', requireAuth, insightRoutes);

export default router;
