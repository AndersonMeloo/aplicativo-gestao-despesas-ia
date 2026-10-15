// Cria um usuário de demonstração com ~3 meses de transações e alguns orçamentos.
// Uso: npm run seed   (pode ser executado de novo: o usuário demo é recriado do zero)
//
// Login: demo@gestao.ia / demo1234
import pool from '../db.js';
import * as authService from '../services/auth.service.js';
import * as categoryRepo from '../repositories/category.repository.js';
import * as transactionRepo from '../repositories/transaction.repository.js';
import * as budgetRepo from '../repositories/budget.repository.js';
import { today, addDays, monthStart } from '../utils/dates.js';

const DEMO = { name: 'Usuário Demo', email: 'demo@gestao.ia', password: 'demo1234', currency: 'BRL' };

const run = async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [DEMO.email]); // CASCADE apaga os dados antigos

    const { user } = await authService.register(DEMO);
    const categories = Object.fromEntries((await categoryRepo.findAll(user.id)).map((c) => [c.name, c.id]));
    const t = today();

    const add = (daysAgo, category, amount, type, description) => {
        const transactionDate = addDays(t, -daysAgo);
        return transactionRepo.create(user.id, {
            categoryId: categories[category],
            amount,
            type,
            description,
            notes: null,
            transactionDate,
        });
    };

    const items = [];

    // Receitas: salário mensal + freelas
    for (const d of [0, 30, 60, 90]) items.push([d, 'Salário', 5200, 'income', 'Salário']);
    items.push([18, 'Freelance', 900, 'income', 'Projeto site cliente']);
    items.push([75, 'Freelance', 1200, 'income', 'Consultoria']);

    // Despesas fixas
    for (const d of [3, 33, 63, 93]) {
        items.push([d, 'Moradia', 1800, 'expense', 'Aluguel']);
        items.push([d + 2, 'Contas a pagar', 180 + (d % 40), 'expense', 'Luz e internet']);
        items.push([d + 1, 'Assinaturas', 55.9, 'expense', 'Netflix']);
        items.push([d + 1, 'Assinaturas', 21.9, 'expense', 'Spotify']);
    }

    // Mercado semanal
    for (let d = 2; d < 90; d += 7) items.push([d, 'Mercado', 180 + (d % 50), 'expense', 'Compras da semana']);

    // Restaurante: mais frequente no último mês (para a IA ter o que apontar)
    for (const d of [1, 2, 4, 6, 8, 9, 13, 15, 16, 20, 22, 27, 29]) items.push([d, 'Restaurante', 35 + (d % 45), 'expense', d % 2 ? 'iFood' : 'Almoço']);
    for (const d of [35, 41, 48, 56, 64, 71, 79, 86]) items.push([d, 'Restaurante', 40 + (d % 30), 'expense', 'Almoço']);

    // Transporte, lazer, compras e saúde
    for (let d = 1; d < 90; d += 5) items.push([d, 'Transporte', 18 + (d % 25), 'expense', d % 3 ? 'Uber' : 'Combustível']);
    for (const d of [5, 12, 26, 47, 70]) items.push([d, 'Lazer', 60 + (d % 50), 'expense', 'Cinema / show']);
    items.push([10, 'Shopping', 320, 'expense', 'Tênis novo']);
    items.push([52, 'Shopping', 150, 'expense', 'Roupas']);
    items.push([24, 'Saúde', 95, 'expense', 'Farmácia']);
    items.push([44, 'Viagem', 850, 'expense', 'Viagem fim de semana']);

    for (const item of items) await add(...item);

    const budgets = [
        ['Mercado', 900],
        ['Restaurante', 500],
        ['Transporte', 350],
        ['Lazer', 200],
        ['Shopping', 250],
    ];
    for (const [category, amount] of budgets) {
        await budgetRepo.create(user.id, { categoryId: categories[category], amount, period: 'monthly', startDate: monthStart(t) });
    }

    console.log(`Seed concluído: ${items.length} transações e ${budgets.length} orçamentos.`);
    console.log(`Login: ${DEMO.email} / ${DEMO.password}`);
};

try {
    await run();
} catch (err) {
    console.error('Falha no seed:', err.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
