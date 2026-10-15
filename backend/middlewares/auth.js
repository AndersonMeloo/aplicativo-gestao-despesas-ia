import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

// Exige um token JWT válido no header "Authorization: Bearer <token>".
// O id do usuário vem SOMENTE do token (req.userId) — nunca do body ou da URL.
// É isso que garante que cada usuário só acesse os próprios dados.
export const requireAuth = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');

    if (scheme !== 'Bearer' || !token) {
        throw new HttpError(401, 'Não autenticado');
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = Number(payload.sub);
        next();
    } catch {
        throw new HttpError(401, 'Sessão inválida ou expirada');
    }
};
