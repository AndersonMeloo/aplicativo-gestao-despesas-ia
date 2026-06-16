// =============================================================================
// CLIENTE AXIOS SIMULADO
// -----------------------------------------------------------------------------
// Este é um mock temporário que retorna dados de exemplo de utils/mockData.js
// para que a aplicação funcione sem um backend. Quando estiver pronto para
// conectar o backend real.
// =============================================================================

import {
    mockUser,
    mockCategories,
    mockTransactions,
    mockBudgets,
    mockDashboardSummary,
    mockMonthlyTrend,
    mockCategoryBreakdown,
    mockInsights,
    mockInsightGenerators,
    mockBudgetAnalyses,
    mockTransactionAnalysis,
} from '../utils/mockData.js';

// Simula um atraso de resposta da API para parecer uma requisição real
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// Gera IDs únicos para novos registros simulados
let nextId = 1000;
const newId = () => nextId++;

// Filtra transações por pesquisa, categoria, tipo e limite de resultados
const filterTransactions = (params = {}) => {
    let result = [...mockTransactions];
    if (params.search) {
        const q = String(params.search).toLowerCase();
        result = result.filter(
            (t) =>
                (t.description || '').toLowerCase().includes(q) ||
                (t.notes || '').toLowerCase().includes(q)
        );
    }
    if (params.categoryId) {
        result = result.filter((t) => String(t.category_id) === String(params.categoryId));
    }
    if (params.type) {
        result = result.filter((t) => t.type === params.type);
    }
    const limit = parseInt(params.limit, 10) || 50;
    return result.slice(0, limit);
};

// Gera insights simulados com base no tipo solicitado
const generateInsight = (type) => ({
    id: newId(),
    insight_type: type,
    period_start: null,
    period_end: null,
    content_json: mockInsightGenerators[type] || mockInsightGenerators.monthly_summary,
    created_at: new Date().toISOString(),
});

// Cliente API mockado que simula os métodos GET, POST, PUT e DELETE
const api = {

    // Simula requisições GET para consulta de dados
    get: async (url, config = {}) => {
        await delay();

        // Obtém os parâmetros enviados na requisição
        const params = config.params || {};

        // Retorna os dados simulados conforme a rota solicitada
        if (url === '/auth/me') return { data: mockUser };
        if (url === '/categories') return { data: mockCategories };
        if (url === '/transactions') return { data: filterTransactions(params) };
        if (url === '/budgets') return { data: mockBudgets };
        if (url === '/dashboard/summary') return { data: mockDashboardSummary };
        if (url === '/dashboard/monthly-trend') return { data: mockMonthlyTrend };
        if (url === '/dashboard/category-breakdown') return { data: mockCategoryBreakdown };
        if (url === '/insights') return { data: mockInsights };

        // Busca uma transação específica pelo ID informado na URL
        const txnIdMatch = url.match(/^\/transactions\/(\d+)$/);
        if (txnIdMatch) {
            const txn = mockTransactions.find((t) => t.id === parseInt(txnIdMatch[1], 10));
            return { data: txn || null };
        }

        return { data: null };
    },

    // Simula requisições POST para criação de registros e autenticação
    post: async (url, body = {}) => {
        await delay();

        // Simula login e armazena um token fictício
        if (url === '/auth/login') {
            const token = 'mock-token';
            localStorage.setItem('token', token);
            return {
                data: {
                    user: { ...mockUser, email: body.email || mockUser.email },
                    token,
                },
            };
        }

        // Simula cadastro de usuário e retorna os dados criados
        if (url === '/auth/register') {
            const token = 'mock-token';
            localStorage.setItem('token', token);
            return {
                data: {
                    user: {
                        id: newId(),
                        name: body.name || mockUser.name,
                        email: body.email || mockUser.email,
                        currency: body.currency || 'USD',
                    },
                    token,
                },
            };
        }
        // Simula criação de transações
        if (url === '/transactions') return { data: { id: newId(), ...body } };

        // Simula criação de categorias
        if (url === '/categories') return { data: { id: newId(), is_default: false, ...body } };

        // Simula criação de orçamentos
        if (url === '/budgets') return { data: { id: newId(), ...body } };

        // Simula geração de insights por IA
        if (url === '/insights/generate') return { data: generateInsight(body.type) };

        // Simula análise de transações
        if (url === '/transactions/analyze') return { data: mockTransactionAnalysis };

        // Simula análise de orçamentos
        if (url === '/budgets/analyze') return { data: { analyses: mockBudgetAnalyses } };

        return { data: null };
    },

    // Simula atualização de registros existentes
    put: async (url, body = {}) => {
        await delay();

        // Extrai o ID da URL para identificar o registro atualizado
        const idMatch = url.match(/\/(\d+)$/);
        const id = idMatch ? parseInt(idMatch[1], 10) : newId();
        return { data: { id, ...body } };
    },

     // Simula exclusão de registros
    delete: async () => {
        await delay();
        return { data: { message: 'Deleted' } };
    },
};

export default api;
