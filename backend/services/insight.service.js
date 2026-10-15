// Geração dos insights da página "AI Insights".
// Para cada tipo: monta o snapshot (cálculos do backend) -> pede a interpretação ao Gemini
// -> junta os números calculados com o texto da IA -> salva em ai_insights (histórico).
import * as insightRepo from '../repositories/insight.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import * as analyticsService from './analytics.service.js';
import * as geminiService from './gemini.service.js';
import { HttpError } from '../utils/httpError.js';
import { today } from '../utils/dates.js';

export const INSIGHT_TYPES = ['monthly_summary', 'savings_tips', 'budget_alert'];

const NO_DATA_MESSAGE = 'Cadastre algumas transações antes de gerar esta análise';

const monthlySummary = async (userId, currency) => {
    const snapshot = await analyticsService.buildMonthlySnapshot(userId, currency);
    if (!snapshot.hasData) throw new HttpError(422, NO_DATA_MESSAGE);

    const ai = await geminiService.generateMonthlySummary(snapshot.data);
    return {
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        // healthScore e topSpendingCategory vêm do backend, não da IA
        content: { ...ai, topSpendingCategory: snapshot.topSpendingCategory, healthScore: snapshot.healthScore },
    };
};

const savingsTips = async (userId, currency) => {
    const snapshot = await analyticsService.buildLast30DaysSnapshot(userId, currency);
    if (!snapshot.hasData) throw new HttpError(422, NO_DATA_MESSAGE);

    return {
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        content: await geminiService.generateSavingsTips(snapshot.data),
    };
};

// Severidade definida pelo backend a partir do orçamento mais comprometido
const severityOf = (budget) => {
    if (budget.usedPct > 100) return 'critical';
    if (budget.usedPct >= 70 || budget.projectedSpent > budget.limit) return 'warning';
    return 'info';
};

const budgetAlert = async (userId, currency) => {
    const budgets = analyticsService.describeBudgets(await analyticsService.getBudgetsWithSpent(userId));
    if (budgets.length === 0) throw new HttpError(422, 'Crie ao menos um orçamento antes de gerar um alerta');

    const focusBudget = [...budgets].sort((a, b) => b.usedPct - a.usedPct)[0];
    const severity = severityOf(focusBudget);

    const ai = await geminiService.generateBudgetAlert({ currency, today: today(), severity, focusBudget, budgets });
    return { periodStart: null, periodEnd: null, content: { severity, ...ai } };
};

const generators = {
    monthly_summary: monthlySummary,
    savings_tips: savingsTips,
    budget_alert: budgetAlert,
};

export const list = (userId) => insightRepo.findAll(userId);

export const generate = async (userId, type) => {
    if (!INSIGHT_TYPES.includes(type)) {
        throw new HttpError(400, `Tipo de insight inválido. Use: ${INSIGHT_TYPES.join(', ')}`);
    }

    const user = await userRepo.findById(userId);
    const result = await generators[type](userId, user.currency);

    return insightRepo.create(userId, {
        type,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        content: result.content,
    });
};
