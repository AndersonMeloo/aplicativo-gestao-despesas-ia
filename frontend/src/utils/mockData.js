// Dados de exemplo usados no modo demo (VITE_USE_MOCK=true), quando não há backend.

export const mockUser = {
    id: 1,
    name: 'Usuário Demo',
    email: 'demo@gestao.ia',
    currency: 'BRL',
};

export const mockCategories = [
    // Receitas
    { id: 1, name: 'Salário', type: 'income', icon: 'briefcase', color: '#10B981', is_default: true },
    { id: 2, name: 'Freelance', type: 'income', icon: 'laptop', color: '#22C55E', is_default: true },
    { id: 3, name: 'Investimentos', type: 'income', icon: 'trending-up', color: '#14B8A6', is_default: true },
    { id: 4, name: 'Outras receitas', type: 'income', icon: 'gift', color: '#06B6D4', is_default: true },
    // Despesas
    { id: 5, name: 'Mercado', type: 'expense', icon: 'shopping-cart', color: '#EAB308', is_default: true },
    { id: 6, name: 'Restaurante', type: 'expense', icon: 'utensils', color: '#F59E0B', is_default: true },
    { id: 7, name: 'Transporte', type: 'expense', icon: 'car', color: '#EF4444', is_default: true },
    { id: 8, name: 'Moradia', type: 'expense', icon: 'home', color: '#F43F5E', is_default: true },
    { id: 9, name: 'Contas a pagar', type: 'expense', icon: 'zap', color: '#EC4899', is_default: true },
    { id: 10, name: 'Lazer', type: 'expense', icon: 'film', color: '#A855F7', is_default: true },
    { id: 11, name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6', is_default: true },
    { id: 12, name: 'Saúde', type: 'expense', icon: 'heart', color: '#3B82F6', is_default: true },
    { id: 13, name: 'Educação', type: 'expense', icon: 'book-open', color: '#6366F1', is_default: true },
    { id: 14, name: 'Viagem', type: 'expense', icon: 'plane', color: '#F97316', is_default: true },
    { id: 15, name: 'Assinaturas', type: 'expense', icon: 'sparkles', color: '#D946EF', is_default: true },
    { id: 16, name: 'Outros', type: 'expense', icon: 'tag', color: '#64748B', is_default: true },
];

const catMap = Object.fromEntries(mockCategories.map((c) => [c.name, c]));

// -----------------------------------------------------------------------------
// Transações — recriadas a cada carregamento com datas relativas a hoje
// -----------------------------------------------------------------------------
const buildMockTransactions = () => {
    const today = new Date();
    let id = 1;
    const out = [];

    const dateNDaysAgo = (n) => {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const add = (daysAgo, categoryName, amount, type, description) => {
        const c = catMap[categoryName];
        out.push({
            id: id++,
            user_id: 1,
            category_id: c?.id || null,
            category_name: c?.name || null,
            category_icon: c?.icon || null,
            category_color: c?.color || null,
            amount: amount.toFixed(2),
            type,
            description,
            notes: null,
            transaction_date: dateNDaysAgo(daysAgo),
            created_at: new Date().toISOString(),
        });
    };

    // Receitas: salário mensal + freelas
    [0, 30, 60, 90].forEach((n) => add(n, 'Salário', 5200, 'income', 'Salário'));
    add(18, 'Freelance', 900, 'income', 'Projeto site cliente');
    add(75, 'Freelance', 1200, 'income', 'Consultoria');

    // Despesas fixas mensais
    [3, 33, 63, 93].forEach((n) => {
        add(n, 'Moradia', 1800, 'expense', 'Aluguel');
        add(n + 2, 'Contas a pagar', 180 + (n % 40), 'expense', 'Luz e internet');
        add(n + 1, 'Assinaturas', 55.9, 'expense', 'Netflix');
        add(n + 1, 'Assinaturas', 21.9, 'expense', 'Spotify');
    });

    // Mercado semanal
    [2, 9, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79].forEach((n) => {
        add(n, 'Mercado', 180 + (n % 50), 'expense', 'Compras da semana');
    });

    // Restaurante — várias pequenas despesas
    const foodDays = [1, 2, 5, 6, 8, 11, 13, 17, 19, 22, 25, 28, 31, 36, 41, 52, 58, 67, 73, 81];
    foodDays.forEach((n, i) => {
        const desc = i % 4 === 0 ? 'Café' : i % 4 === 1 ? 'Almoço' : i % 4 === 2 ? 'Jantar fora' : 'iFood';
        add(n, 'Restaurante', 25 + (n % 45), 'expense', desc);
    });

    // Transporte
    [4, 11, 18, 25, 32, 39, 46, 53, 60, 67].forEach((n, i) =>
        add(n, 'Transporte', 30 + (n % 40), 'expense', i % 2 === 0 ? 'Combustível' : 'Uber')
    );

    // Lazer
    [12, 27, 49, 71].forEach((n) => add(n, 'Lazer', 60 + (n % 50), 'expense', 'Cinema / show'));

    // Shopping
    add(11, 'Shopping', 320, 'expense', 'Tênis novo');
    add(48, 'Shopping', 150, 'expense', 'Roupas');
    add(83, 'Shopping', 95, 'expense', 'Compra online');

    // Saúde
    add(11, 'Saúde', 95, 'expense', 'Farmácia');
    add(11, 'Saúde', 180, 'expense', 'Consulta médica');

    // Viagem
    add(40, 'Viagem', 850, 'expense', 'Viagem fim de semana');

    return out.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
};

export const mockTransactions = buildMockTransactions();

// -----------------------------------------------------------------------------
// Orçamentos — mês atual
// -----------------------------------------------------------------------------
const buildMockBudgets = () => {
    const today = new Date();
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const items = [
        { categoryName: 'Restaurante', amount: 500, spent: 410 },
        { categoryName: 'Mercado', amount: 900, spent: 620 },
        { categoryName: 'Lazer', amount: 200, spent: 160 },
        { categoryName: 'Transporte', amount: 350, spent: 190 },
        { categoryName: 'Shopping', amount: 250, spent: 320 },
        {
            categoryName: 'Contas a pagar',
            amount: 600,
            spent: 541.67,
            // Compra parcelada em andamento (exibida no card do orçamento)
            plans: [{ name: 'Compra parcelada', total_installments: 12, paid: 3, next_amount: '541.67', remaining_amount: '4874.99', nextInMonths: 1 }],
        },
    ];
    const nextDate = (months) => {
        const d = new Date(today.getFullYear(), today.getMonth() + months, 16);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-16`;
    };
    return items.map((b, i) => {
        const c = catMap[b.categoryName];
        return {
            id: i + 1,
            user_id: 1,
            category_id: c.id,
            category_name: c.name,
            category_icon: c.icon,
            category_color: c.color,
            amount: b.amount.toFixed(2),
            spent: b.spent.toFixed(2),
            period: 'monthly',
            start_date: monthStart,
            installment_plans: (b.plans || []).map(({ nextInMonths, ...p }) => ({
                ...p,
                category_id: c.id,
                next_date: nextDate(nextInMonths),
            })),
        };
    });
};

export const mockBudgets = buildMockBudgets();

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------
export const mockDashboardSummary = {
    incomeThisMonth: 6100, // Total de receitas do mês atual
    expenseThisMonth: 3540, // Total de despesas do mês atual
    balance: 2560, // Saldo do mês (receitas - despesas)
    totalBalance: 8740.5, // Saldo atual: tudo que entrou - tudo que saiu, desde o início
    savingsRate: 42, // Percentual da renda economizada no mês
    incomeDelta: 5.2, // Variação (%) das receitas em relação ao período anterior
    expenseDelta: -8.3, // Variação (%) das despesas em relação ao período anterior
};

const buildMonthlyTrend = () => {
    // Gera os últimos 6 meses com dados fictícios para o gráfico de tendências
    const today = new Date();
    const months = [];

    const samples = [
        { income: 6400, expense: 3890 },
        { income: 5200, expense: 3680 },
        { income: 6100, expense: 3720 },
        { income: 5200, expense: 3540 },
        { income: 6400, expense: 3820 },
        { income: 6100, expense: 3540 },
    ];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const s = samples[5 - i];
        months.push({ month, income: s.income.toFixed(2), expense: s.expense.toFixed(2) });
    }

    return months;
};

export const mockMonthlyTrend = buildMonthlyTrend();

// Gastos por categoria no mês (gráfico "Principais categorias")
const breakdownItem = (name, total, transaction_count) => {
    const c = catMap[name];
    return {
        category_id: c.id,
        category_name: c.name,
        category_icon: c.icon,
        category_color: c.color,
        total: total.toFixed(2),
        transaction_count,
    };
};

export const mockCategoryBreakdown = [
    breakdownItem('Moradia', 1800, 1),
    breakdownItem('Mercado', 620, 4),
    breakdownItem('Restaurante', 410, 9),
    breakdownItem('Shopping', 320, 1),
    breakdownItem('Transporte', 190, 4),
];

// -----------------------------------------------------------------------------
// Insights de IA — histórico pré-gerado + respostas para os botões "Gerar"
// -----------------------------------------------------------------------------
export const mockInsightGenerators = {
    monthly_summary: {
        summary:
            'Seu mês está equilibrado: receitas de R$ 6.100,00 contra R$ 3.540,00 em despesas, com taxa de poupança de 42%. A moradia é o maior gasto (R$ 1.800,00), mas o ponto de atenção é Restaurante, que já usou 82% do orçamento.',
        highlights: [
            'Taxa de poupança de 42%, bem acima da referência de 20%',
            'Mercado está dentro do orçamento (R$ 620 de R$ 900)',
            'Despesas totais 8,3% menores que no mesmo período do mês passado',
        ],
        concerns: [
            'Shopping estourou o orçamento em R$ 70,00',
            'Gastos com iFood e jantares concentrados nos fins de semana',
        ],
        recommendations: [
            { title: 'Pause as compras de Shopping', detail: 'Evite compras não essenciais até o fim do mês para compensar os R$ 70,00 excedentes.' },
            { title: 'Reserve o excedente', detail: 'Transfira R$ 1.500,00 para a poupança logo no início do próximo mês, antes que o dinheiro se dilua.' },
            { title: 'Limite semanal para restaurante', detail: 'Defina cerca de R$ 100,00 por semana para alimentação fora de casa.' },
        ],
        topSpendingCategory: 'Moradia',
        estimatedMonthlySavings: 240,
        healthScore: 78,
    },
    savings_tips: {
        overallTip: 'Suas maiores oportunidades estão em restaurante, assinaturas e compras por impulso — pequenas mudanças aqui liberam cerca de R$ 230/mês.',
        tips: [
            { category: 'Restaurante', title: 'Leve marmita duas vezes por semana', detail: 'Trocar dois almoços fora por refeições de casa reduz cerca de R$ 90 por mês.', estimatedSavings: 90 },
            { category: 'Assinaturas', title: 'Revise suas assinaturas', detail: 'Netflix e Spotify somam R$ 77,80/mês. Avalie planos mais baratos ou pause um deles.', estimatedSavings: 30 },
            { category: 'Transporte', title: 'Agrupe seus deslocamentos', detail: 'Concentrar compras e compromissos no mesmo trajeto reduz combustível e corridas de Uber.', estimatedSavings: 50 },
            { category: 'Shopping', title: 'Regra das 24 horas', detail: 'Antes de comprar algo não essencial, espere um dia. A maioria das compras por impulso perde o sentido.', estimatedSavings: 60 },
        ],
    },
    budget_alert: {
        severity: 'warning',
        title: 'Restaurante perto do limite',
        message: 'Você já usou R$ 410,00 dos R$ 500,00 do orçamento de Restaurante e ainda faltam 17 dias no mês. No ritmo atual, deve ultrapassar o limite em cerca de R$ 60,00.',
        suggestions: [
            'Limite os gastos com alimentação fora a R$ 20 por dia até o fim do mês',
            'Planeje um jantar em casa no fim de semana',
            'Prefira café coado em casa nesta semana',
        ],
    },
};

export const mockInsights = [
    {
        id: 101,
        insight_type: 'monthly_summary',
        period_start: null,
        period_end: null,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content_json: mockInsightGenerators.monthly_summary,
    },
    {
        id: 102,
        insight_type: 'savings_tips',
        period_start: null,
        period_end: null,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content_json: mockInsightGenerators.savings_tips,
    },
];

// -----------------------------------------------------------------------------
// Análise dos orçamentos (tela Orçamentos > Analisar)
// -----------------------------------------------------------------------------
export const mockBudgetAnalyses = [
    { budgetId: 1, status: 'caution', message: 'Restaurante já usou R$ 410 de R$ 500. No ritmo atual, deve passar do limite antes do fim do mês.' },
    { budgetId: 2, status: 'good', message: 'Mercado está tranquilo: R$ 620 de R$ 900, com ritmo de gastos constante.' },
    { budgetId: 3, status: 'caution', message: 'Lazer está em R$ 160 de R$ 200 — perto do limite. Segure novos programas pagos.' },
    { budgetId: 4, status: 'good', message: 'Transporte está saudável: R$ 190 de R$ 350.' },
    { budgetId: 5, status: 'concerning', message: 'Shopping estourou o limite de R$ 250 em R$ 70. Evite compras não essenciais até o próximo mês.' },
];

// -----------------------------------------------------------------------------
// Análise das transações (tela Transações > Análise de gastos com IA)
// -----------------------------------------------------------------------------
export const mockTransactionAnalysis = {
    insight:
        'Seus gastos estão estáveis, com Restaurante como a categoria mais frequente. As assinaturas somam cerca de R$ 77,80 por mês — valor modesto, mas que vale revisar. A maior parte dos gastos variáveis acontece nos fins de semana.',
    highlight: 'Gastos estáveis',
};
