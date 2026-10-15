import { HttpError } from '../utils/httpError.js';
import { amount, isoDate, oneOf, optionalPositiveInt, optionalString, positiveInt, TYPES } from './common.js';

export const validateTransaction = (body = {}) => ({
    type: oneOf(body.type, 'Tipo', TYPES),
    amount: amount(body.amount),
    categoryId: optionalPositiveInt(body.categoryId, 'Categoria'),
    description: optionalString(body.description, 'Descrição', { max: 255 }),
    notes: optionalString(body.notes, 'Observações', { max: 1000 }),
    transactionDate: isoDate(body.transactionDate, 'Data'),
});

export const validateListQuery = (query = {}) => {
    const limit = query.limit === undefined ? 50 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1) throw new HttpError(400, 'limit inválido');

    return {
        search: typeof query.search === 'string' && query.search.trim() ? query.search.trim().slice(0, 100) : null,
        categoryId: optionalPositiveInt(query.categoryId, 'Categoria'),
        type: query.type ? oneOf(query.type, 'Tipo', TYPES) : null,
        limit: Math.min(limit, 2000), // a tela de transações pede até 2000
    };
};

export const validateAnalyze = (body = {}) => {
    const ids = body.transactionIds;
    if (!Array.isArray(ids) || ids.length === 0) throw new HttpError(400, 'Informe ao menos uma transação');
    if (ids.length > 50) throw new HttpError(400, 'Máximo de 50 transações por análise');
    return { transactionIds: ids.map((id) => positiveInt(id, 'transactionId')) };
};
