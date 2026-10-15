import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller.js';

const router = Router();

router.get('/', budgetController.list);
router.post('/', budgetController.create);
router.post('/analyze', budgetController.analyze);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

export default router;
