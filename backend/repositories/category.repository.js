import pool from '../db.js';

const FIELDS = 'id, name, type, icon, color, is_default';

export const findAll = async (userId) => {
    const { rows } = await pool.query(
        `SELECT ${FIELDS} FROM categories WHERE user_id = $1 ORDER BY type, name`,
        [userId]
    );
    return rows;
};

export const findById = async (userId, id) => {
    const { rows } = await pool.query(
        `SELECT ${FIELDS} FROM categories WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return rows[0] || null;
};

export const create = async (userId, { name, type, icon, color, isDefault = false }, db = pool) => {
    const { rows } = await db.query(
        `INSERT INTO categories (user_id, name, type, icon, color, is_default)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${FIELDS}`,
        [userId, name, type, icon, color, isDefault]
    );
    return rows[0];
};

export const update = async (userId, id, { name, icon, color }) => {
    const { rows } = await pool.query(
        `UPDATE categories SET name = $1, icon = $2, color = $3
         WHERE id = $4 AND user_id = $5
         RETURNING ${FIELDS}`,
        [name, icon, color, id, userId]
    );
    return rows[0] || null;
};

// Transações da categoria ficam sem categoria (ON DELETE SET NULL); orçamentos são removidos (CASCADE)
export const remove = async (userId, id) => {
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    return rowCount > 0;
};
