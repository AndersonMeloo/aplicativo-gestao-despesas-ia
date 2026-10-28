import * as transactionService from '../services/transaction.service.js';
import { validateAnalyze, validateInstallments, validateListQuery, validateTransaction } from '../validators/transaction.validator.js';
import { idParam } from '../validators/common.js';

export const list = async (req, res) => {
    res.json(await transactionService.list(req.userId, validateListQuery(req.query)));
};

export const getById = async (req, res) => {
    res.json(await transactionService.getById(req.userId, idParam(req.params.id)));
};

// Com "installments" maior que 1, o valor informado é o TOTAL e são criadas várias parcelas
export const create = async (req, res) => {
    const data = validateTransaction(req.body);
    const installments = validateInstallments(req.body.installments);
    if (installments > 1) {
        return res.status(201).json(await transactionService.createInstallments(req.userId, data, installments));
    }
    res.status(201).json(await transactionService.create(req.userId, data));
};

export const update = async (req, res) => {
    res.json(await transactionService.update(req.userId, idParam(req.params.id), validateTransaction(req.body)));
};

export const remove = async (req, res) => {
    await transactionService.remove(req.userId, idParam(req.params.id));
    res.json({ message: 'Transação excluída' });
};

export const analyze = async (req, res) => {
    const { transactionIds } = validateAnalyze(req.body);
    res.json(await transactionService.analyze(req.userId, transactionIds));
};
