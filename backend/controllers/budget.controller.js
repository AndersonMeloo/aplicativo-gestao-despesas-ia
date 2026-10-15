import * as budgetService from '../services/budget.service.js';
import { validateCreateBudget, validateUpdateBudget } from '../validators/budget.validator.js';
import { idParam } from '../validators/common.js';

export const list = async (req, res) => {
    res.json(await budgetService.list(req.userId));
};

export const create = async (req, res) => {
    res.status(201).json(await budgetService.create(req.userId, validateCreateBudget(req.body)));
};

export const update = async (req, res) => {
    res.json(await budgetService.update(req.userId, idParam(req.params.id), validateUpdateBudget(req.body)));
};

export const remove = async (req, res) => {
    await budgetService.remove(req.userId, idParam(req.params.id));
    res.json({ message: 'Orçamento excluído' });
};

export const analyze = async (req, res) => {
    res.json(await budgetService.analyze(req.userId));
};
