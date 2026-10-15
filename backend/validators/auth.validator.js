import { HttpError } from '../utils/httpError.js';
import { requiredString } from './common.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = (value) => {
    const v = requiredString(value, 'E-mail', { max: 255 }).toLowerCase();
    if (!EMAIL_RE.test(v)) throw new HttpError(400, 'E-mail inválido');
    return v;
};

export const validateRegister = (body = {}) => {
    const currency = body.currency === undefined ? 'BRL' : body.currency;
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
        throw new HttpError(400, 'Moeda inválida');
    }

    return {
        name: requiredString(body.name, 'Nome', { max: 100 }),
        email: email(body.email),
        password: requiredString(body.password, 'Senha', { min: 6, max: 72 }), // bcrypt usa no máx. 72 bytes
        currency,
    };
};

export const validateLogin = (body = {}) => ({
    email: email(body.email),
    password: requiredString(body.password, 'Senha', { max: 72 }),
});
