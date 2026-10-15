import * as categoryService from '../services/category.service.js';
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.validator.js';
import { idParam } from '../validators/common.js';

export const list = async (req, res) => {
    res.json(await categoryService.list(req.userId));
};

export const create = async (req, res) => {
    res.status(201).json(await categoryService.create(req.userId, validateCreateCategory(req.body)));
};

export const update = async (req, res) => {
    res.json(await categoryService.update(req.userId, idParam(req.params.id), validateUpdateCategory(req.body)));
};

export const remove = async (req, res) => {
    await categoryService.remove(req.userId, idParam(req.params.id));
    res.json({ message: 'Categoria excluída' });
};
