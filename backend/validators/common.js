import { HttpError } from '../utils/httpError.js';
import { isValidISODate } from '../utils/dates.js';

// Helpers simples de validação. Cada um devolve o valor já limpo ou lança HttpError 400.

const fail = (message) => {
    throw new HttpError(400, message);
};

export const requiredString = (value, field, { max = 255, min = 1 } = {}) => {
    if (typeof value !== 'string') fail(`${field} é obrigatório`);
    const v = value.trim();
    if (v.length < min) fail(min > 1 ? `${field} deve ter pelo menos ${min} caracteres` : `${field} é obrigatório`);
    if (v.length > max) fail(`${field} deve ter no máximo ${max} caracteres`);
    return v;
};

export const optionalString = (value, field, { max = 255 } = {}) => {
    if (value === undefined || value === null || value === '') return null;
    return requiredString(value, field, { max });
};

export const oneOf = (value, field, options) => {
    if (!options.includes(value)) fail(`${field} deve ser um destes: ${options.join(', ')}`);
    return value;
};

// Valor monetário positivo com no máximo 2 casas decimais
export const amount = (value, field = 'Valor') => {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) fail(`${field} deve ser um número maior que zero`);
    if (n > 9_999_999_999.99) fail(`${field} é muito alto`);
    if (Math.round(n * 100) !== Number((n * 100).toFixed(6))) fail(`${field} deve ter no máximo 2 casas decimais`);
    return n;
};

export const isoDate = (value, field) => {
    if (!isValidISODate(value)) fail(`${field} deve estar no formato YYYY-MM-DD`);
    return value;
};

export const positiveInt = (value, field) => {
    const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (!Number.isInteger(n) || n <= 0 || n > 2_147_483_647) fail(`${field} inválido`);
    return n;
};

export const optionalPositiveInt = (value, field) =>
    value === undefined || value === null || value === '' ? null : positiveInt(value, field);

// Para ids vindos da URL (/transactions/:id)
export const idParam = (value) => positiveInt(value, 'id');

export const TYPES = ['income', 'expense'];
