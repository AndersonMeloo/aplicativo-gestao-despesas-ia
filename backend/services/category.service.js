import * as categoryRepo from '../repositories/category.repository.js';
import { HttpError } from '../utils/httpError.js';

// Sugestões criadas no cadastro. São categorias comuns do usuário:
// ele pode renomear, trocar ícone/cor, excluir ou criar quantas quiser.
export const DEFAULT_CATEGORIES = [
    { name: 'Salário', type: 'income', icon: 'briefcase', color: '#10B981' },
    { name: 'Freelance', type: 'income', icon: 'laptop', color: '#22C55E' },
    { name: 'Investimentos', type: 'income', icon: 'trending-up', color: '#14B8A6' },
    { name: 'Outras receitas', type: 'income', icon: 'gift', color: '#06B6D4' },
    { name: 'Mercado', type: 'expense', icon: 'shopping-cart', color: '#EAB308' },
    { name: 'Restaurante', type: 'expense', icon: 'utensils', color: '#F59E0B' },
    { name: 'Transporte', type: 'expense', icon: 'car', color: '#EF4444' },
    { name: 'Moradia', type: 'expense', icon: 'home', color: '#F43F5E' },
    { name: 'Contas a pagar', type: 'expense', icon: 'zap', color: '#EC4899' },
    { name: 'Lazer', type: 'expense', icon: 'film', color: '#A855F7' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6' },
    { name: 'Saúde', type: 'expense', icon: 'heart', color: '#3B82F6' },
    { name: 'Educação', type: 'expense', icon: 'book-open', color: '#6366F1' },
    { name: 'Viagem', type: 'expense', icon: 'plane', color: '#F97316' },
    { name: 'Assinaturas', type: 'expense', icon: 'sparkles', color: '#D946EF' },
    { name: 'Outros', type: 'expense', icon: 'tag', color: '#64748B' },
];

export const createDefaults = async (userId, db) => {
    for (const c of DEFAULT_CATEGORIES) {
        await categoryRepo.create(userId, { ...c, isDefault: true }, db);
    }
};

export const list = (userId) => categoryRepo.findAll(userId);

export const create = async (userId, data) => {
    try {
        return await categoryRepo.create(userId, data);
    } catch (err) {
        if (err.code === '23505') throw new HttpError(409, 'Você já tem uma categoria com esse nome');
        throw err;
    }
};

export const update = async (userId, id, data) => {
    try {
        const category = await categoryRepo.update(userId, id, data);
        if (!category) throw new HttpError(404, 'Categoria não encontrada');
        return category;
    } catch (err) {
        if (err.code === '23505') throw new HttpError(409, 'Você já tem uma categoria com esse nome');
        throw err;
    }
};

export const remove = async (userId, id) => {
    const deleted = await categoryRepo.remove(userId, id);
    if (!deleted) throw new HttpError(404, 'Categoria não encontrada');
};

// Garante que a categoria existe, é DO USUÁRIO e é do tipo esperado (receita/despesa).
// Impede, por exemplo, lançar uma transação na categoria de outra pessoa.
export const assertOwned = async (userId, categoryId, expectedType) => {
    const category = await categoryRepo.findById(userId, categoryId);
    if (!category) throw new HttpError(400, 'Categoria inválida');
    if (expectedType && category.type !== expectedType) {
        throw new HttpError(400, `A categoria "${category.name}" não é do tipo ${expectedType === 'income' ? 'receita' : 'despesa'}`);
    }
    return category;
};
