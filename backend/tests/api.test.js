// Testes dos principais fluxos da API (node:test + fetch nativos).
//
// ATENÇÃO: os testes APAGAM e recriam as tabelas. Por isso usam um banco separado,
// definido em DATABASE_URL_TEST (nunca o DATABASE_URL principal).
// O Gemini é substituído por um cliente falso: os testes não gastam cota da API.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.DATABASE_URL_TEST) {
    console.error('Defina DATABASE_URL_TEST (banco exclusivo para testes) para rodar os testes.');
    process.exit(1);
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET ||= 'test-secret';

const { default: app } = await import('../app.js');
const { default: pool } = await import('../db.js');
const { migrate } = await import('../scripts/migrate.js');
const gemini = await import('../services/gemini.service.js');
const { today, addDays, addMonths, monthStart } = await import('../utils/dates.js');

// ---------------------------------------------------------------------------
// Gemini falso: responde conforme o schema pedido e guarda os prompts enviados
// ---------------------------------------------------------------------------
const geminiCalls = [];
let geminiShouldFail = false;

const fakeGemini = {
    models: {
        generateContent: async ({ contents, config }) => {
            geminiCalls.push(contents);
            if (geminiShouldFail) throw Object.assign(new Error('boom'), { status: 500 });

            const required = config.responseJsonSchema.required;
            let answer;
            if (required.includes('summary')) {
                answer = {
                    summary: 'Mês equilibrado.',
                    highlights: ['Boa taxa de poupança'],
                    concerns: ['Restaurante acima do mês anterior'],
                    recommendations: [{ title: 'Cozinhe mais em casa', detail: 'Reduza idas a restaurantes.' }],
                    estimatedMonthlySavings: 150,
                };
            } else if (required.includes('tips')) {
                answer = {
                    overallTip: 'Foque em restaurantes.',
                    tips: [{ category: 'Restaurante', title: 'Menos delivery', detail: 'Corte 2 pedidos.', estimatedSavings: 80 }],
                };
            } else if (required.includes('suggestions')) {
                answer = { title: 'Atenção ao Mercado', message: 'Você já usou boa parte.', suggestions: ['Faça lista'] };
            } else if (required.includes('insight')) {
                answer = { insight: 'Gastos concentrados em alimentação.', highlight: 'Alimentação em alta' };
            } else {
                const data = JSON.parse(contents.split('DADOS FINANCEIROS (JSON):\n')[1]);
                answer = { analyses: data.budgets.map((b) => ({ budgetId: b.budgetId, message: `IA: ${b.category}` })) };
            }
            return { text: JSON.stringify(answer) };
        },
    },
};

// ---------------------------------------------------------------------------
// Helpers HTTP
// ---------------------------------------------------------------------------
let server;
let baseUrl;

const request = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${baseUrl}/api${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
};

const registerUser = async (name, email) => {
    const res = await request('POST', '/auth/register', {
        body: { name, email, password: 'senha123', currency: 'BRL' },
    });
    assert.equal(res.status, 201, JSON.stringify(res.data));
    return res.data;
};

const categoryByName = async (token, name) => {
    const { data } = await request('GET', '/categories', { token });
    return data.find((c) => c.name === name);
};

before(async () => {
    await migrate({ reset: true });
    gemini.setClientForTests(fakeGemini);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server.close();
    await pool.end();
});

// ---------------------------------------------------------------------------
describe('Autenticação', () => {
    test('cadastro cria o usuário, devolve token e categorias iniciais', async () => {
        const { user, token } = await registerUser('Ana Souza', 'Ana@Example.com');
        assert.equal(user.email, 'ana@example.com'); // e-mail normalizado
        assert.equal(user.currency, 'BRL');
        assert.ok(token);
        assert.equal(user.password_hash, undefined);

        const { data: categories } = await request('GET', '/categories', { token });
        assert.ok(categories.length >= 10);
        assert.ok(categories.some((c) => c.name === 'Mercado' && c.type === 'expense' && c.is_default));
    });

    test('não permite e-mail duplicado', async () => {
        const res = await request('POST', '/auth/register', {
            body: { name: 'Outra', email: 'ana@example.com', password: 'senha123' },
        });
        assert.equal(res.status, 409);
    });

    test('valida os dados do cadastro', async () => {
        const res = await request('POST', '/auth/register', { body: { name: 'X', email: 'invalido', password: '123' } });
        assert.equal(res.status, 400);
        assert.ok(res.data.message);
    });

    test('login com senha correta e incorreta', async () => {
        const ok = await request('POST', '/auth/login', { body: { email: 'ana@example.com', password: 'senha123' } });
        assert.equal(ok.status, 200);
        assert.ok(ok.data.token);

        const wrong = await request('POST', '/auth/login', { body: { email: 'ana@example.com', password: 'errada' } });
        assert.equal(wrong.status, 401);
    });

    test('rotas protegidas exigem token válido', async () => {
        assert.equal((await request('GET', '/auth/me')).status, 401);
        assert.equal((await request('GET', '/transactions', { token: 'token-falso' })).status, 401);
    });
});

// ---------------------------------------------------------------------------
describe('Categorias, transações e orçamentos', () => {
    let token;

    before(async () => {
        ({ token } = await registerUser('Bruno', 'bruno@example.com'));
    });

    test('CRUD de categoria personalizada', async () => {
        const created = await request('POST', '/categories', {
            token,
            body: { name: 'Pet', type: 'expense', icon: 'heart', color: '#22c55e' },
        });
        assert.equal(created.status, 201);
        assert.equal(created.data.color, '#22C55E');

        const dup = await request('POST', '/categories', { token, body: { name: 'Pet', type: 'expense' } });
        assert.equal(dup.status, 409);

        const updated = await request('PUT', `/categories/${created.data.id}`, {
            token,
            body: { name: 'Pets', icon: 'gift', color: '#000000' },
        });
        assert.equal(updated.data.name, 'Pets');

        assert.equal((await request('DELETE', `/categories/${created.data.id}`, { token })).status, 200);
        assert.equal((await request('DELETE', `/categories/${created.data.id}`, { token })).status, 404);
    });

    test('CRUD de transação com dados da categoria', async () => {
        const mercado = await categoryByName(token, 'Mercado');
        const created = await request('POST', '/transactions', {
            token,
            body: {
                type: 'expense',
                amount: 150.5,
                categoryId: mercado.id,
                description: 'Compra do mês',
                notes: null,
                transactionDate: today(),
            },
        });
        assert.equal(created.status, 201);
        assert.equal(created.data.amount, '150.50');
        assert.equal(created.data.category_name, 'Mercado');
        assert.equal(created.data.transaction_date, today());

        const updated = await request('PUT', `/transactions/${created.data.id}`, {
            token,
            body: { ...created.data, amount: 99.9, categoryId: mercado.id, transactionDate: today() },
        });
        assert.equal(updated.data.amount, '99.90');

        const search = await request('GET', '/transactions?search=compra&limit=5', { token });
        assert.equal(search.data.length, 1);

        assert.equal((await request('DELETE', `/transactions/${created.data.id}`, { token })).status, 200);
        assert.equal((await request('GET', `/transactions/${created.data.id}`, { token })).status, 404);
    });

    test('rejeita valores inválidos e categoria de tipo diferente', async () => {
        const salario = await categoryByName(token, 'Salário');
        const base = { type: 'expense', amount: 10, transactionDate: today() };

        assert.equal((await request('POST', '/transactions', { token, body: { ...base, amount: -5 } })).status, 400);
        assert.equal((await request('POST', '/transactions', { token, body: { ...base, amount: 1.234 } })).status, 400);
        assert.equal((await request('POST', '/transactions', { token, body: { ...base, transactionDate: '2026-02-31' } })).status, 400);
        assert.equal((await request('POST', '/transactions', { token, body: { ...base, categoryId: salario.id } })).status, 400);
    });

    test('compra parcelada cria uma transação por mês e a soma bate com o total', async () => {
        const contas = await categoryByName(token, 'Contas a pagar');
        const res = await request('POST', '/transactions', {
            token,
            body: {
                type: 'expense',
                amount: 6500,
                categoryId: contas.id,
                description: 'Compra parcelada',
                transactionDate: '2026-08-16',
                installments: 12,
            },
        });
        assert.equal(res.status, 201);
        assert.equal(res.data.length, 12);

        const parcelas = [...res.data].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
        assert.equal(parcelas[0].transaction_date, '2026-08-16');
        assert.equal(parcelas[0].description, 'Compra parcelada (1/12)');
        assert.equal(parcelas[0].amount, '541.67');
        assert.equal(parcelas[11].amount, '541.63');
        assert.equal(parcelas[11].transaction_date, '2027-07-16');
        assert.equal(parcelas[11].description, 'Compra parcelada (12/12)');
        const totalCentavos = parcelas.reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);
        assert.equal(totalCentavos, 650000);

        // Remove as parcelas para não interferir nos próximos testes
        for (const t of parcelas) await request('DELETE', `/transactions/${t.id}`, { token });
    });

    test('parcelas no dia 31 usam o último dia dos meses mais curtos', async () => {
        const res = await request('POST', '/transactions', {
            token,
            body: { type: 'expense', amount: 300, transactionDate: '2027-01-31', installments: 3 },
        });
        const datas = res.data.map((t) => t.transaction_date).sort();
        assert.deepEqual(datas, ['2027-01-31', '2027-02-28', '2027-03-31']);
        for (const t of res.data) await request('DELETE', `/transactions/${t.id}`, { token });

        const invalida = await request('POST', '/transactions', {
            token,
            body: { type: 'expense', amount: 300, transactionDate: '2027-01-31', installments: 61 },
        });
        assert.equal(invalida.status, 400);
    });

    test('orçamento calcula o valor gasto no mês', async () => {
        const restaurante = await categoryByName(token, 'Restaurante');
        for (const amount of [40, 60]) {
            await request('POST', '/transactions', {
                token,
                body: { type: 'expense', amount, categoryId: restaurante.id, transactionDate: today() },
            });
        }

        const created = await request('POST', '/budgets', {
            token,
            body: { categoryId: restaurante.id, amount: 120, period: 'monthly' },
        });
        assert.equal(created.status, 201);

        const dup = await request('POST', '/budgets', { token, body: { categoryId: restaurante.id, amount: 50, period: 'monthly' } });
        assert.equal(dup.status, 409);

        const { data: budgets } = await request('GET', '/budgets', { token });
        assert.equal(budgets.length, 1);
        assert.equal(budgets[0].spent, '100.00');
        assert.equal(budgets[0].category_name, 'Restaurante');

        const analysis = await request('POST', '/budgets/analyze', { token });
        assert.equal(analysis.data.analyses[0].status, 'caution'); // 100 de 120 = 83%
        assert.equal(analysis.data.analyses[0].message, 'IA: Restaurante');
    });

    test('orçamento mostra o progresso da compra parcelada e não projeta a parcela como gasto variável', async () => {
        const contas = await categoryByName(token, 'Contas a pagar');
        const primeira = addMonths(today(), -2); // dia 1º de dois meses atrás
        await request('POST', '/transactions', {
            token,
            body: { type: 'expense', amount: 1200, categoryId: contas.id, description: 'Notebook', transactionDate: primeira, installments: 12 },
        });
        await request('POST', '/budgets', { token, body: { categoryId: contas.id, amount: 150, period: 'monthly' } });

        const { data: budgets } = await request('GET', '/budgets', { token });
        const orc = budgets.find((b) => b.category_name === 'Contas a pagar');
        assert.equal(orc.spent, '100.00');
        assert.equal(orc.installment_plans.length, 1);
        const plano = orc.installment_plans[0];
        assert.equal(plano.name, 'Notebook');
        assert.equal(plano.total_installments, 12);
        assert.equal(plano.paid, 3);
        assert.equal(plano.remaining_amount, '900.00');
        assert.equal(plano.next_date, addMonths(today(), 1));

        // A projeção do mês é a própria parcela (R$ 100), e não uma extrapolação diária
        geminiCalls.length = 0;
        await request('POST', '/budgets/analyze', { token });
        const dados = JSON.parse(geminiCalls.at(-1).split('DADOS FINANCEIROS (JSON):\n')[1]);
        const enviado = dados.budgets.find((b) => b.category === 'Contas a pagar');
        assert.equal(enviado.installmentsInPeriod, 100);
        assert.equal(enviado.projectedSpent, 100);
    });

    test('orçamento só aceita categoria de despesa', async () => {
        const salario = await categoryByName(token, 'Salário');
        const res = await request('POST', '/budgets', { token, body: { categoryId: salario.id, amount: 100 } });
        assert.equal(res.status, 400);
    });
});

// ---------------------------------------------------------------------------
describe('Isolamento entre usuários', () => {
    let tokenA;
    let tokenB;
    let transactionA;
    let categoryA;
    let budgetA;

    before(async () => {
        ({ token: tokenA } = await registerUser('Usuário A', 'a@example.com'));
        ({ token: tokenB } = await registerUser('Usuário B', 'b@example.com'));

        categoryA = await categoryByName(tokenA, 'Lazer');
        transactionA = (await request('POST', '/transactions', {
            token: tokenA,
            body: { type: 'expense', amount: 50, categoryId: categoryA.id, description: 'Cinema', transactionDate: today() },
        })).data;
        budgetA = (await request('POST', '/budgets', {
            token: tokenA,
            body: { categoryId: categoryA.id, amount: 200 },
        })).data;
    });

    test('B não vê os dados de A nas listagens', async () => {
        const { data: transactions } = await request('GET', '/transactions', { token: tokenB });
        assert.equal(transactions.length, 0);

        const { data: categories } = await request('GET', '/categories', { token: tokenB });
        assert.ok(!categories.some((c) => c.id === categoryA.id));

        const { data: budgets } = await request('GET', '/budgets', { token: tokenB });
        assert.equal(budgets.length, 0);

        const { data: summary } = await request('GET', '/dashboard/summary', { token: tokenB });
        assert.equal(summary.expenseThisMonth, 0);
    });

    test('B não lê, altera nem exclui a transação de A', async () => {
        const id = transactionA.id;
        const body = { type: 'expense', amount: 1, transactionDate: today() };
        assert.equal((await request('GET', `/transactions/${id}`, { token: tokenB })).status, 404);
        assert.equal((await request('PUT', `/transactions/${id}`, { token: tokenB, body })).status, 404);
        assert.equal((await request('DELETE', `/transactions/${id}`, { token: tokenB })).status, 404);

        const stillThere = await request('GET', `/transactions/${id}`, { token: tokenA });
        assert.equal(stillThere.data.amount, '50.00');
    });

    test('B não usa nem altera categoria/orçamento de A', async () => {
        const useCategory = await request('POST', '/transactions', {
            token: tokenB,
            body: { type: 'expense', amount: 10, categoryId: categoryA.id, transactionDate: today() },
        });
        assert.equal(useCategory.status, 400);

        const editCategory = await request('PUT', `/categories/${categoryA.id}`, { token: tokenB, body: { name: 'Hack' } });
        assert.equal(editCategory.status, 404);

        const editBudget = await request('PUT', `/budgets/${budgetA.id}`, { token: tokenB, body: { amount: 1 } });
        assert.equal(editBudget.status, 404);
        assert.equal((await request('DELETE', `/budgets/${budgetA.id}`, { token: tokenB })).status, 404);
    });

    test('B não consegue analisar transações de A pela IA', async () => {
        const res = await request('POST', '/transactions/analyze', {
            token: tokenB,
            body: { transactionIds: [transactionA.id] },
        });
        assert.equal(res.status, 404);
    });
});

// ---------------------------------------------------------------------------
describe('Dashboard', () => {
    let token;

    before(async () => {
        ({ token } = await registerUser('Carla', 'carla@example.com'));
        const salario = await categoryByName(token, 'Salário');
        const mercado = await categoryByName(token, 'Mercado');
        const moradia = await categoryByName(token, 'Moradia');
        const t = today();

        const add = (type, amount, categoryId, transactionDate) =>
            request('POST', '/transactions', { token, body: { type, amount, categoryId, transactionDate } });

        await add('income', 5000, salario.id, monthStart(t));
        await add('expense', 1500, moradia.id, monthStart(t));
        await add('expense', 500, mercado.id, monthStart(t));
        await add('expense', 300, mercado.id, addDays(monthStart(t), -10)); // mês anterior
    });

    test('summary com totais e taxa de poupança do mês', async () => {
        const { data } = await request('GET', '/dashboard/summary', { token });
        assert.equal(data.incomeThisMonth, 5000);
        assert.equal(data.expenseThisMonth, 2000);
        assert.equal(data.balance, 3000);
        // Saldo atual acumulado: 5000 de receita - 2000 deste mês - 300 do mês anterior
        assert.equal(data.totalBalance, 2700);
        assert.equal(data.savingsRate, 60);
        assert.equal(typeof data.savingsRate, 'number');
    });

    test('monthly-trend devolve 6 meses, inclusive meses vazios', async () => {
        const { data } = await request('GET', '/dashboard/monthly-trend', { token });
        assert.equal(data.length, 6);
        assert.equal(data[5].month, today().slice(0, 7));
        assert.equal(data[5].expense, '2000.00');
        assert.equal(data[4].expense, '300.00');
        assert.equal(data[0].income, '0.00');
    });

    test('category-breakdown ordenado pelo maior gasto', async () => {
        const { data } = await request('GET', '/dashboard/category-breakdown', { token });
        assert.deepEqual(data.map((d) => d.category_name), ['Moradia', 'Mercado']);
        assert.equal(data[0].total, '1500.00');
        assert.equal(data[1].transaction_count, 1);
    });
});

// ---------------------------------------------------------------------------
describe('Insights com IA (Gemini simulado)', () => {
    let token;

    before(async () => {
        ({ token } = await registerUser('Diego Privado', 'diego@example.com'));
    });

    test('sem transações, avisa em vez de chamar a IA', async () => {
        const calls = geminiCalls.length;
        const res = await request('POST', '/insights/generate', { token, body: { type: 'monthly_summary' } });
        assert.equal(res.status, 422);
        assert.equal(geminiCalls.length, calls);
    });

    test('gera e salva o resumo mensal; números vêm do backend', async () => {
        const restaurante = await categoryByName(token, 'Restaurante');
        await request('POST', '/transactions', {
            token,
            body: { type: 'income', amount: 3000, transactionDate: today() },
        });
        await request('POST', '/transactions', {
            token,
            body: { type: 'expense', amount: 200, categoryId: restaurante.id, description: 'Pizza', transactionDate: today() },
        });

        const res = await request('POST', '/insights/generate', { token, body: { type: 'monthly_summary' } });
        assert.equal(res.status, 201);
        assert.equal(res.data.insight_type, 'monthly_summary');
        assert.equal(res.data.content_json.summary, 'Mês equilibrado.');
        assert.equal(res.data.content_json.topSpendingCategory, 'Restaurante');
        assert.equal(typeof res.data.content_json.healthScore, 'number');

        // Dados pessoais não são enviados ao Gemini
        const prompt = geminiCalls.at(-1);
        assert.ok(!prompt.includes('diego@example.com'));
        assert.ok(!prompt.includes('Diego'));
        assert.ok(prompt.includes('Restaurante'));

        const list = await request('GET', '/insights', { token });
        assert.equal(list.data.length, 1);
    });

    test('gera dicas de economia e alerta de orçamento', async () => {
        const tips = await request('POST', '/insights/generate', { token, body: { type: 'savings_tips' } });
        assert.equal(tips.status, 201);
        assert.equal(tips.data.content_json.tips.length, 1);

        const noBudget = await request('POST', '/insights/generate', { token, body: { type: 'budget_alert' } });
        assert.equal(noBudget.status, 422);

        const restaurante = await categoryByName(token, 'Restaurante');
        await request('POST', '/budgets', { token, body: { categoryId: restaurante.id, amount: 150 } });
        const alert = await request('POST', '/insights/generate', { token, body: { type: 'budget_alert' } });
        assert.equal(alert.status, 201);
        assert.equal(alert.data.content_json.severity, 'critical'); // 200 de 150
    });

    test('analisa as transações selecionadas', async () => {
        const { data: transactions } = await request('GET', '/transactions', { token });
        const res = await request('POST', '/transactions/analyze', {
            token,
            body: { transactionIds: transactions.map((t) => t.id) },
        });
        assert.equal(res.status, 200);
        assert.deepEqual(Object.keys(res.data).sort(), ['highlight', 'insight']);
    });

    test('tipo de insight inválido', async () => {
        const res = await request('POST', '/insights/generate', { token, body: { type: 'qualquer' } });
        assert.equal(res.status, 400);
    });

    test('falha do Gemini: insight retorna erro e orçamentos usam mensagem padrão', async () => {
        geminiShouldFail = true;
        try {
            const res = await request('POST', '/insights/generate', { token, body: { type: 'monthly_summary' } });
            assert.equal(res.status, 502);

            const budgets = await request('POST', '/budgets/analyze', { token });
            assert.equal(budgets.status, 200);
            assert.equal(budgets.data.analyses[0].status, 'concerning');
            assert.match(budgets.data.analyses[0].message, /estourado/);
        } finally {
            geminiShouldFail = false;
        }
    });
});
