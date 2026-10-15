import { HttpError } from '../utils/httpError.js';

// Converte qualquer erro em uma resposta JSON { message }, formato que o frontend já lê.
// Erros inesperados não expõem detalhes internos (stack, SQL) para o cliente.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }

    // JSON malformado no body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'JSON inválido' });
    }

    // Violação de UNIQUE no Postgres (ex.: e-mail ou categoria duplicada)
    if (err.code === '23505') {
        return res.status(409).json({ message: 'Registro duplicado' });
    }

    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
};

export const notFound = (req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
};
