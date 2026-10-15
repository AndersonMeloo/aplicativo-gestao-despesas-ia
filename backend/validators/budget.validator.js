import { amount, oneOf, positiveInt } from './common.js';

const PERIODS = ['monthly', 'weekly'];

export const validateCreateBudget = (body = {}) => ({
    categoryId: positiveInt(body.categoryId, 'Categoria'),
    amount: amount(body.amount),
    period: oneOf(body.period ?? 'monthly', 'Período', PERIODS),
});

// A categoria de um orçamento não muda; para isso, exclua e crie outro
export const validateUpdateBudget = (body = {}) => ({
    amount: amount(body.amount),
    period: oneOf(body.period ?? 'monthly', 'Período', PERIODS),
});
