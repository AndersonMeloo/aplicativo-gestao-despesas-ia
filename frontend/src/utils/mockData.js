export const mockUser = {
    id: 1,
    name: 'Anderson Melo',
    email: 'andersonmelo@gmail.com',
    currency: 'BRL',
};

export const mockCategories = [
    // Receitas
    { id: 1, name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981', is_default: true },
    { id: 2, name: 'Freelance', type: 'income', icon: 'laptop', color: '#22C55E', is_default: true },
    { id: 3, name: 'Investments', type: 'income', icon: 'trending-up', color: '#14B8A6', is_default: true },
    { id: 4, name: 'Gifts', type: 'income', icon: 'gift', color: '#06B6D4', is_default: true },
    { id: 5, name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#0EA5E9', is_default: true },
    // Despesas
    { id: 6, name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B', is_default: true },
    { id: 7, name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#EAB308', is_default: true },
    { id: 8, name: 'Transportation', type: 'expense', icon: 'car', color: '#EF4444', is_default: true },
    { id: 9, name: 'Rent', type: 'expense', icon: 'home', color: '#F43F5E', is_default: true },
    { id: 10, name: 'Utilities', type: 'expense', icon: 'zap', color: '#EC4899', is_default: true },
    { id: 11, name: 'Entertainment', type: 'expense', icon: 'film', color: '#A855F7', is_default: true },
    { id: 12, name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6', is_default: true },
    { id: 13, name: 'Healthcare', type: 'expense', icon: 'heart', color: '#3B82F6', is_default: true },
    { id: 14, name: 'Education', type: 'expense', icon: 'book-open', color: '#6366F1', is_default: true },
    { id: 15, name: 'Travel', type: 'expense', icon: 'plane', color: '#F97316', is_default: true },
    { id: 16, name: 'Personal Care', type: 'expense', icon: 'sparkles', color: '#D946EF', is_default: true },
    { id: 17, name: 'Other Expense', type: 'expense', icon: 'more-horizontal', color: '#64748B', is_default: true },
];

// -----------------------------------------------------------------------------
// Transações — recriadas a cada carregamento com datas relativas a hoje
// -----------------------------------------------------------------------------
const buildMockTransactionms = () => {
    const today = new Date();
    const catMap = Object.fromEntries(mockCategories.map((c) => [c.name, c]));
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

    // Receitas — salário recebido a cada duas semanas nos últimos ~3 meses
    // 0 Dia Atual, 14 dias atrás, 30 dias atrás, 44 dias atrás, 60 dias atrás, 74 dias atrás, 90 dias atrás
    [0, 14, 30, 44, 60, 74, 90].forEach((n) => add(n, 'Salary', 2750, 'income', 'Salary deposit'));
    add(15, 'Freelance', 800, 'income', 'Client project');
    add(75, 'Freelance', 1200, 'income', 'Client project');

    // Despesa com aluguel (mensal)
    // 3 dias atrás, 33 dias atrás, 63 dias atrás, 93 dias atrás
    [3, 33, 63, 93].forEach((n) => add(n, 'Rent', 1800, 'expense', 'Monthly rent'));

    // Contas (mensal)
    // 7 dias atrás, 37 dias atrás, 67 dias atrás
    [7, 37, 67].forEach((n) => add(n, 'Utilities', 220, 'expense', 'Electricity + Internet'));

    // Assinaturas
    // 4 Dias atrás, 34 dias atrás, 64 dias atrás, 94 dias atrás
    [4, 34, 64, 94].forEach((n) => {
        add(n, 'Entertainment', 15.99, 'expense', 'Netflix');
        add(n, 'Entertainment', 10.99, 'expense', 'Spotify');
    });

    // Compras de supermercado semanais
    // 2 dias atrás, 9 dias atrás, 16 dias atrás, 23 dias atrás, 30 dias atrás, 37 dias atrás, 44 dias atrás, 51 dias atrás, 58 dias atrás, 65 dias atrás, 72 dias atrás, 79 dias atrás
    [2, 9, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79].forEach((n) => {
        add(n, 'Groceries', 60 + (n % 35), 'expense', 'Weekly groceries');
    });

    // Alimentação — várias pequenas despesas
    const  foodDays = [1, 2, 5, 6, 8, 11, 13, 17, 19, 22, 25, 28, 31, 36, 41, 52, 58, 67, 73, 81];
    foodDays.forEach((n, i) => {
        const amount = 8 + (n % 32);
        const desc = i % 4 === 0 ? 'Coffee' : i % 4 === 1 ? 'Lunch' : i % 4 === 2 ? 'Dinner out' : 'Takeout';
        add(n, 'Food & Dining', amount, 'expense', desc);
    })

    // Transporte

    // Gastos com lazer

    // Compras

    // Saúde

    // Cuidados pessoais

    // Viagens
}