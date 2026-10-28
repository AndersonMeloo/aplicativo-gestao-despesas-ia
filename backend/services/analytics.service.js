// Todos os cálculos financeiros do sistema ficam aqui.
// O dashboard usa estas funções diretamente, e a IA recebe um "snapshot" montado com elas:
// o backend calcula os números, o Gemini apenas interpreta.
import * as analyticsRepo from '../repositories/analytics.repository.js';
import * as budgetRepo from '../repositories/budget.repository.js';
import * as dates from '../utils/dates.js';

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Variação percentual; null quando não há base de comparação (o frontend esconde o indicador)
export const percentChange = (current, previous) =>
    previous > 0 ? round1(((current - previous) / previous) * 100) : null;

export const savingsRate = (income, expense) => (income > 0 ? round1(((income - expense) / income) * 100) : 0);

// Situação de um orçamento pelo percentual usado
export const budgetStatus = (spent, limit) => {
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct > 100) return 'concerning';
    if (pct >= 70) return 'caution';
    return 'good';
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// KPIs do mês atual + saldo atual (acumulado). As variações comparam o mês atual ATÉ HOJE com o mesmo
// intervalo de dias do mês anterior (ex.: 1–14/out vs 1–14/set), para uma comparação justa.
export const getSummary = async (userId) => {
    const t = dates.today();
    const start = dates.monthStart(t);
    const prevStart = dates.addMonths(t, -1);
    const prevEnd = dates.monthEnd(prevStart);
    const prevSameDay = dates.addDays(prevStart, dates.daysBetween(start, t));

    const [month, monthToDate, prevToDate, allTime] = await Promise.all([
        analyticsRepo.getTotals(userId, start, dates.monthEnd(t)),
        analyticsRepo.getTotals(userId, start, t),
        analyticsRepo.getTotals(userId, prevStart, prevSameDay < prevEnd ? prevSameDay : prevEnd),
        // Tudo que já entrou menos tudo que já saiu, do primeiro lançamento até hoje
        analyticsRepo.getTotals(userId, '1900-01-01', t),
    ]);

    return {
        incomeThisMonth: round2(month.income),
        expenseThisMonth: round2(month.expense),
        balance: round2(month.income - month.expense),
        totalBalance: round2(allTime.income - allTime.expense),
        savingsRate: savingsRate(month.income, month.expense),
        incomeDelta: percentChange(monthToDate.income, prevToDate.income),
        expenseDelta: percentChange(monthToDate.expense, prevToDate.expense),
    };
};

export const getMonthlyTrend = (userId, months = 6) => {
    const t = dates.today();
    return analyticsRepo.getMonthlyTrend(userId, dates.addMonths(t, -(months - 1)), dates.monthStart(t));
};

export const getCategoryBreakdown = (userId) => {
    const t = dates.today();
    return analyticsRepo.getCategoryBreakdown(userId, dates.monthStart(t), dates.monthEnd(t), 'expense');
};

// Orçamentos com o valor gasto no período corrente de cada um (semana ou mês)
export const getBudgetsWithSpent = (userId) => {
    const t = dates.today();
    const week = dates.budgetPeriodRange('weekly', t);
    const month = dates.budgetPeriodRange('monthly', t);
    return budgetRepo.findAllWithSpent(userId, {
        weekStart: week.start,
        weekEnd: week.end,
        monthStart: month.start,
        monthEnd: month.end,
    });
};

// ---------------------------------------------------------------------------
// Dados preparados para a IA
// ---------------------------------------------------------------------------

// Resumo de cada orçamento com status e projeção de gasto até o fim do período.
// Parcelas são valores fixos (caem uma vez no mês), então entram na projeção pelo valor exato;
// só os gastos variáveis são projetados pelo ritmo diário.
export const describeBudgets = (budgets, ref = dates.today()) =>
    budgets.map((b) => {
        const spent = Number(b.spent);
        const installments = Number(b.installment_spent || 0);
        const limit = Number(b.amount);
        const { start, end } = dates.budgetPeriodRange(b.period, ref);
        const totalDays = dates.daysBetween(start, end) + 1;
        const elapsedDays = dates.daysBetween(start, ref) + 1;
        return {
            budgetId: b.id,
            category: b.category_name,
            period: b.period === 'weekly' ? 'semanal' : 'mensal',
            limit,
            spent,
            usedPct: limit > 0 ? round1((spent / limit) * 100) : 0,
            remaining: round2(limit - spent),
            daysLeft: totalDays - elapsedDays,
            installmentsInPeriod: round2(installments),
            projectedSpent: round2(installments + ((spent - installments) / elapsedDays) * totalDays),
            status: budgetStatus(spent, limit),
        };
    });

// Nota de 0 a 100 calculada pelo backend (determinística, fácil de explicar):
//  - até 40 pts: taxa de poupança (30% ou mais = nota máxima)
//  - até 30 pts: proporção de orçamentos dentro do limite (sem orçamentos = 15)
//  - até 30 pts: tendência das despesas vs mês anterior (caiu = 30, subiu até 15% = 15, mais = 0)
export const calculateHealthScore = ({ savingsRate: rate, budgets, expenseDelta }) => {
    const savingsPts = (Math.min(Math.max(rate, 0), 30) / 30) * 40;

    const budgetPts = budgets.length === 0
        ? 15
        : (budgets.filter((b) => b.status !== 'concerning').length / budgets.length) * 30;

    let trendPts = 15;
    if (expenseDelta !== null) trendPts = expenseDelta <= 0 ? 30 : expenseDelta <= 15 ? 15 : 0;

    return Math.round(savingsPts + budgetPts + trendPts);
};

const categoryRows = (rows, totalExpense) =>
    rows.map((r) => ({
        category: r.category_name,
        total: Number(r.total),
        transactions: r.transaction_count,
        shareOfExpensesPct: totalExpense > 0 ? round1((Number(r.total) / totalExpense) * 100) : 0,
    }));

const weekdayRows = (rows) => rows.map((r) => ({ day: WEEKDAYS[r.weekday], total: round2(r.total) }));

// Snapshot do mês atual (usado pelo "Monthly Summary")
export const buildMonthlySnapshot = async (userId, currency) => {
    const t = dates.today();
    const start = dates.monthStart(t);
    const end = dates.monthEnd(t);
    const prevStart = dates.addMonths(t, -1);

    const [summary, categories, prevCategories, budgets, frequent, weekdays] = await Promise.all([
        getSummary(userId),
        analyticsRepo.getCategoryBreakdown(userId, start, end),
        analyticsRepo.getCategoryBreakdown(userId, prevStart, dates.monthEnd(prevStart)),
        getBudgetsWithSpent(userId),
        analyticsRepo.getFrequentExpenses(userId, start, end),
        analyticsRepo.getExpenseByWeekday(userId, start, end),
    ]);

    const prevByName = Object.fromEntries(prevCategories.map((c) => [c.category_name, Number(c.total)]));
    const budgetInfo = describeBudgets(budgets, t);
    const topSpendingCategory = categories[0]?.category_name || null;
    const healthScore = calculateHealthScore({
        savingsRate: summary.savingsRate,
        budgets: budgetInfo,
        expenseDelta: summary.expenseDelta,
    });

    return {
        hasData: summary.incomeThisMonth > 0 || summary.expenseThisMonth > 0,
        periodStart: start,
        periodEnd: end,
        healthScore,
        topSpendingCategory,
        data: {
            currency,
            period: { start, end, today: t, daysLeftInMonth: dates.daysBetween(t, end) },
            totals: {
                income: summary.incomeThisMonth,
                expense: summary.expenseThisMonth,
                balance: summary.balance,
                accumulatedBalance: summary.totalBalance,
                savingsRatePct: summary.savingsRate,
            },
            comparisonWithSamePeriodLastMonth: {
                incomeChangePct: summary.incomeDelta,
                expenseChangePct: summary.expenseDelta,
            },
            expensesByCategory: categoryRows(categories, summary.expenseThisMonth).map((c) => ({
                ...c,
                previousMonthTotal: prevByName[c.category] ?? 0,
            })),
            budgets: budgetInfo,
            frequentExpenses: frequent,
            expensesByWeekday: weekdayRows(weekdays),
            healthScore,
            topSpendingCategory,
        },
    };
};

// Snapshot dos últimos 30 dias (usado pelo "Savings Tips")
export const buildLast30DaysSnapshot = async (userId, currency) => {
    const end = dates.today();
    const start = dates.addDays(end, -29);

    const [totals, categories, budgets, frequent, weekdays] = await Promise.all([
        analyticsRepo.getTotals(userId, start, end),
        analyticsRepo.getCategoryBreakdown(userId, start, end),
        getBudgetsWithSpent(userId),
        analyticsRepo.getFrequentExpenses(userId, start, end, 15),
        analyticsRepo.getExpenseByWeekday(userId, start, end),
    ]);

    return {
        hasData: totals.expense > 0,
        periodStart: start,
        periodEnd: end,
        data: {
            currency,
            period: { start, end },
            totals: {
                income: round2(totals.income),
                expense: round2(totals.expense),
                savingsRatePct: savingsRate(totals.income, totals.expense),
            },
            expensesByCategory: categoryRows(categories, totals.expense),
            budgets: describeBudgets(budgets, end),
            frequentExpenses: frequent,
            expensesByWeekday: weekdayRows(weekdays),
        },
    };
};

// Resumo de uma lista de transações já carregada (usado em "AI Spending Insight")
export const summarizeTransactions = (transactions, currency) => {
    let income = 0;
    let expense = 0;
    const byCategory = {};
    const byDescription = {};

    for (const t of transactions) {
        const value = Number(t.amount);
        if (t.type === 'income') {
            income += value;
            continue;
        }
        expense += value;
        const cat = t.category_name || 'Sem categoria';
        byCategory[cat] = byCategory[cat] || { category: cat, total: 0, transactions: 0 };
        byCategory[cat].total += value;
        byCategory[cat].transactions += 1;

        const desc = (t.description || '').trim().slice(0, 40);
        if (desc) {
            byDescription[desc] = byDescription[desc] || { description: desc, count: 0, total: 0 };
            byDescription[desc].count += 1;
            byDescription[desc].total += value;
        }
    }

    const sortedDates = transactions.map((t) => t.transaction_date).sort();

    return {
        currency,
        period: { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] },
        transactionCount: transactions.length,
        totals: { income: round2(income), expense: round2(expense), balance: round2(income - expense) },
        expensesByCategory: Object.values(byCategory)
            .map((c) => ({
                ...c,
                total: round2(c.total),
                shareOfExpensesPct: expense > 0 ? round1((c.total / expense) * 100) : 0,
            }))
            .sort((a, b) => b.total - a.total),
        frequentExpenses: Object.values(byDescription)
            .map((d) => ({ ...d, total: round2(d.total) }))
            .sort((a, b) => b.count - a.count || b.total - a.total)
            .slice(0, 10),
    };
};
