import pool from '../db.js';

// Orçamentos + quanto já foi gasto no período corrente (semana ou mês).
// Os intervalos são calculados no service e passados como parâmetros.
export const findAllWithSpent = async (userId, { weekStart, weekEnd, monthStart, monthEnd }) => {
    const { rows } = await pool.query(
        `SELECT b.id, b.user_id, b.category_id, b.amount, b.period, b.start_date,
                c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
                COALESCE((
                    SELECT SUM(t.amount)
                    FROM transactions t
                    WHERE t.user_id = b.user_id
                      AND t.category_id = b.category_id
                      AND t.type = 'expense'
                      AND t.transaction_date BETWEEN
                          CASE WHEN b.period = 'weekly' THEN $2::date ELSE $4::date END
                          AND CASE WHEN b.period = 'weekly' THEN $3::date ELSE $5::date END
                ), 0)::numeric(12, 2) AS spent
         FROM budgets b
         JOIN categories c ON c.id = b.category_id
         WHERE b.user_id = $1
         ORDER BY c.name`,
        [userId, weekStart, weekEnd, monthStart, monthEnd]
    );
    return rows;
};

export const create = async (userId, { categoryId, amount, period, startDate }, db = pool) => {
    const { rows } = await db.query(
        `INSERT INTO budgets (user_id, category_id, amount, period, start_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, category_id, amount, period, start_date`,
        [userId, categoryId, amount, period, startDate]
    );
    return rows[0];
};

export const update = async (userId, id, { amount, period }) => {
    const { rows } = await pool.query(
        `UPDATE budgets SET amount = $1, period = $2
         WHERE id = $3 AND user_id = $4
         RETURNING id, category_id, amount, period, start_date`,
        [amount, period, id, userId]
    );
    return rows[0] || null;
};

export const remove = async (userId, id) => {
    const { rowCount } = await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
    return rowCount > 0;
};
