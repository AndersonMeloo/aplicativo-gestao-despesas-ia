import * as transactionRepo from '../repositories/transaction.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import * as categoryService from './category.service.js';
import * as analyticsService from './analytics.service.js';
import * as geminiService from './gemini.service.js';
import { HttpError } from '../utils/httpError.js';

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
