import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import * as userRepo from '../repositories/user.repository.js';
import * as categoryService from './category.service.js';
import { HttpError } from '../utils/httpError.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

const signToken = (userId) =>
    jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

export const register = async ({ name, email, password, currency }) => {
    if (await userRepo.findByEmail(email)) {
        throw new HttpError(409, 'Este e-mail já está cadastrado');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Usuário e categorias iniciais são criados juntos: ou tudo dá certo, ou nada é salvo
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const user = await userRepo.create({ name, email, passwordHash, currency }, client);
        await categoryService.createDefaults(user.id, client);
        await client.query('COMMIT');
        return { user, token: signToken(user.id) };
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') throw new HttpError(409, 'Este e-mail já está cadastrado');
        throw err;
    } finally {
        client.release();
    }
};

export const login = async ({ email, password }) => {
    const user = await userRepo.findByEmail(email);

    // Mesma mensagem para e-mail inexistente ou senha errada (não revela quais e-mails existem)
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new HttpError(401, 'E-mail ou senha inválidos');
    }

    const { password_hash, ...publicUser } = user;
    return { user: publicUser, token: signToken(user.id) };
};

export const me = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new HttpError(401, 'Usuário não encontrado');
    return user;
};
