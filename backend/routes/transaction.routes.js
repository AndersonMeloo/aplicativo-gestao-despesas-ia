import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', transactionController.list);
router.post('/', transactionController.create);
router.post('/analyze', transactionController.analyze);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;
