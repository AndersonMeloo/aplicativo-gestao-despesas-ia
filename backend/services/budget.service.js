import * as budgetRepo from '../repositories/budget.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import * as categoryService from './category.service.js';
import * as analyticsService from './analytics.service.js';
import * as geminiService from './gemini.service.js';
import { HttpError } from '../utils/httpError.js';
import { today } from '../utils/dates.js';

const DUPLICATE_MESSAGE = 'Já existe um orçamento para essa categoria nesse período';

export const list = (userId) => analyticsService.getBudgetsWithSpent(userId);

export const create = async (userId, data) => {
    // Orçamento só faz sentido para categorias de despesa do próprio usuário
    await categoryService.assertOwned(userId, data.categoryId, 'expense');
    try {
        return await budgetRepo.create(userId, { ...data, startDate: today() });
    } catch (err) {
        if (err.code === '23505') throw new HttpError(409, DUPLICATE_MESSAGE);
        throw err;
    }
};

export const update = async (userId, id, data) => {
    try {
        const budget = await budgetRepo.update(userId, id, data);
        if (!budget) throw new HttpError(404, 'Orçamento não encontrado');
        return budget;
    } catch (err) {
        if (err.code === '23505') throw new HttpError(409, DUPLICATE_MESSAGE);
        throw err;
    }
};

export const remove = async (userId, id) => {
    const deleted = await budgetRepo.remove(userId, id);
    if (!deleted) throw new HttpError(404, 'Orçamento não encontrado');
};

// Mensagem padrão, usada quando a IA não está disponível
const fallbackMessage = (b) => {
    if (b.status === 'concerning') return `Orçamento estourado: gasto de ${b.spent.toFixed(2)} para um limite de ${b.limit.toFixed(2)}.`;
    if (b.status === 'caution') return `Atenção: ${b.usedPct}% do limite já foi usado e faltam ${b.daysLeft} dias no período.`;
    return `Dentro do esperado: ${b.usedPct}% do limite usado.`;
};

// Status (good/caution/concerning) é calculado pelo backend; o Gemini escreve o comentário.
// A tela de orçamentos chama este endpoint ao abrir, então, se a IA falhar,
// devolvemos mensagens padrão em vez de erro — a tela continua funcionando.
export const analyze = async (userId) => {
    const budgets = analyticsService.describeBudgets(await analyticsService.getBudgetsWithSpent(userId));
    if (budgets.length === 0) return { analyses: [] };

    let messages = {};
    try {
        const user = await userRepo.findById(userId);
        messages = await geminiService.analyzeBudgets({ currency: user.currency, today: today(), budgets });
    } catch (err) {
        console.error('Budget analysis fallback:', err.message);
    }

    return {
        analyses: budgets.map((b) => ({
            budgetId: b.budgetId,
            status: b.status,
            message: messages[b.budgetId] || fallbackMessage(b),
        })),
    };
};
