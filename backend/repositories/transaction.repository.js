import pool from '../db.js';

// Transação + dados da categoria (o frontend exibe nome, ícone e cor)
const SELECT_WITH_CATEGORY = `
    SELECT t.id, t.user_id, t.category_id, t.amount, t.type, t.description, t.notes,
           t.transaction_date, t.created_at,
           c.name AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id`;

export const findAll = async (userId, { search, categoryId, type, limit }) => {
    const where = ['t.user_id = $1'];
    const params = [userId];

    if (search) {
        params.push(`%${search}%`);
        where.push(`(t.description ILIKE $${params.length} OR t.notes ILIKE $${params.length})`);
    }
    if (categoryId) {
        params.push(categoryId);
        where.push(`t.category_id = $${params.length}`);
    }
    if (type) {
        params.push(type);
        where.push(`t.type = $${params.length}`);
    }
    params.push(limit);

    const { rows } = await pool.query(
        `${SELECT_WITH_CATEGORY}
         WHERE ${where.join(' AND ')}
         ORDER BY t.transaction_date DESC, t.id DESC
         LIMIT $${params.length}`,
        params
    );
    return rows;
};

export const findById = async (userId, id) => {
    const { rows } = await pool.query(`${SELECT_WITH_CATEGORY} WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
    return rows[0] || null;
};

// Somente as transações que pertencem ao usuário (ids de outros usuários são ignorados)
export const findByIds = async (userId, ids) => {
    const { rows } = await pool.query(
        `${SELECT_WITH_CATEGORY} WHERE t.user_id = $1 AND t.id = ANY($2::int[]) ORDER BY t.transaction_date DESC`,
        [userId, ids]
    );
    return rows;
};

export const create = async (userId, data, db = pool) => {
    const { rows } = await db.query(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, notes, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, data.categoryId, data.amount, data.type, data.description, data.notes, data.transactionDate]
    );
    return rows[0].id;
};

export const update = async (userId, id, data) => {
    const { rowCount } = await pool.query(
        `UPDATE transactions
         SET category_id = $1, amount = $2, type = $3, description = $4, notes = $5, transaction_date = $6
         WHERE id = $7 AND user_id = $8`,
        [data.categoryId, data.amount, data.type, data.description, data.notes, data.transactionDate, id, userId]
    );
    return rowCount > 0;
};

export const remove = async (userId, id) => {
    const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    return rowCount > 0;
};
