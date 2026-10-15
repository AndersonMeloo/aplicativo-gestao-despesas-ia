import { HttpError } from '../utils/httpError.js';
import { requiredString, oneOf, TYPES } from './common.js';

// Ícone = nome de ícone do lucide-react em kebab-case (ex.: 'shopping-cart')
const icon = (value) => {
    if (value === undefined || value === null || value === '') return 'tag';
    if (typeof value !== 'string' || !/^[a-z0-9-]{1,50}$/.test(value)) throw new HttpError(400, 'Ícone inválido');
    return value;
};

const color = (value) => {
    if (value === undefined || value === null || value === '') return '#64748B';
    if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(value)) throw new HttpError(400, 'Cor deve estar no formato #RRGGBB');
    return value.toUpperCase();
};

export const validateCreateCategory = (body = {}) => ({
    name: requiredString(body.name, 'Nome', { max: 50 }),
    type: oneOf(body.type, 'Tipo', TYPES),
    icon: icon(body.icon),
    color: color(body.color),
});

// O tipo (receita/despesa) não pode ser alterado depois de criado
export const validateUpdateCategory = (body = {}) => ({
    name: requiredString(body.name, 'Nome', { max: 50 }),
    icon: icon(body.icon),
    color: color(body.color),
});
