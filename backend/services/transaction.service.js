import * as transactionRepo from '../repositories/transaction.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import * as categoryService from './category.service.js';
import * as analyticsService from './analytics.service.js';
import * as geminiService from './gemini.service.js';
import pool from '../db.js';
import { HttpError } from '../utils/httpError.js';
import { addMonthsKeepDay } from '../utils/dates.js';

const findOrFail = async (userId, id) => {
    const transaction = await transactionRepo.findById(userId, id);
    if (!transaction) throw new HttpError(404, 'Transação não encontrada');
    return transaction;
};

// A categoria (se informada) precisa ser do usuário e do mesmo tipo da transação
const checkCategory = async (userId, data) => {
    if (data.categoryId) await categoryService.assertOwned(userId, data.categoryId, data.type);
};

export const list = (userId, filters) => transactionRepo.findAll(userId, filters);

export const getById = (userId, id) => findOrFail(userId, id);

export const create = async (userId, data) => {
    await checkCategory(userId, data);
    const id = await transactionRepo.create(userId, data);
    return findOrFail(userId, id);
};

// Compra parcelada: divide o valor total em N parcelas mensais, na mesma data de cada mês.
// Ex.: R$ 6.500 em 12x = 11 parcelas de R$ 541,67 + a última de R$ 541,63 (ajuste dos centavos),
// para a soma bater exatamente com o total.
// Todas as parcelas são gravadas juntas (BEGIN/COMMIT): ou cria todas, ou nenhuma.
export const createInstallments = async (userId, data, installments) => {
    await checkCategory(userId, data);

    const totalCents = Math.round(data.amount * 100);
    const baseCents = Math.round(totalCents / installments);
    const lastCents = totalCents - baseCents * (installments - 1);
    if (baseCents < 1 || lastCents < 1) throw new HttpError(400, 'Valor muito baixo para esse número de parcelas');
    const description = data.description || 'Compra parcelada';

    const client = await pool.connect();
    const ids = [];
    try {
        await client.query('BEGIN');
        for (let i = 0; i < installments; i++) {
            const isLast = i === installments - 1;
            const cents = isLast ? lastCents : baseCents;
            ids.push(await transactionRepo.create(userId, {
                ...data,
                amount: cents / 100,
                description: `${description} (${i + 1}/${installments})`,
                transactionDate: addMonthsKeepDay(data.transactionDate, i),
            }, client));
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    return transactionRepo.findByIds(userId, ids);
};

export const update = async (userId, id, data) => {
    await checkCategory(userId, data);
    const updated = await transactionRepo.update(userId, id, data);
    if (!updated) throw new HttpError(404, 'Transação não encontrada');
    return findOrFail(userId, id);
};

export const remove = async (userId, id) => {
    const deleted = await transactionRepo.remove(userId, id);
    if (!deleted) throw new HttpError(404, 'Transação não encontrada');
};

// Análise com IA das transações selecionadas na tela
export const analyze = async (userId, transactionIds) => {
    // Só busca transações do próprio usuário: ids de terceiros são simplesmente ignorados
    const transactions = await transactionRepo.findByIds(userId, transactionIds);
    if (transactions.length === 0) throw new HttpError(404, 'Nenhuma transação encontrada para analisar');

    const user = await userRepo.findById(userId);
    const data = analyticsService.summarizeTransactions(transactions, user.currency);
    return geminiService.analyzeTransactions(data);
};
