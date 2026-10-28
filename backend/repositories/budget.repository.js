import pool from '../db.js';

// Parcelas são criadas com a descrição terminando em "(n/N)", ex.: "Compra parcelada (3/12)"
const INSTALLMENT_REGEX = String.raw`'\(\d+/\d+\)$'`;

// Resumo de cada compra parcelada que ainda tem parcelas a vencer:
// quantas já foram pagas (data até hoje), quantas faltam, valor restante e próxima data.
// As parcelas são agrupadas pela descrição sem o "(n/N)" e pela categoria.
export const findInstallmentPlans = async (userId, today) => {
    const { rows } = await pool.query(
        `SELECT category_id,
                regexp_replace(description, '\\s*\\(\\d+/\\d+\\)$', '') AS name,
                (regexp_match(description, '\\((\\d+)/(\\d+)\\)$'))[2]::int AS total_installments,
                COUNT(*) FILTER (WHERE transaction_date <= $2)::int AS paid,
                (array_agg(amount ORDER BY transaction_date) FILTER (WHERE transaction_date > $2))[1] AS next_amount,
                COALESCE(SUM(amount) FILTER (WHERE transaction_date > $2), 0)::numeric(12, 2) AS remaining_amount,
                MIN(transaction_date) FILTER (WHERE transaction_date > $2) AS next_date
         FROM transactions
         WHERE user_id = $1 AND type = 'expense' AND description ~ ${INSTALLMENT_REGEX}
         GROUP BY category_id, name, total_installments
         HAVING COUNT(*) FILTER (WHERE transaction_date > $2) > 0
         ORDER BY next_date`,
        [userId, today]
    );
    return rows;
};

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
                ), 0)::numeric(12, 2) AS spent,
                -- Parte do gasto que veio de parcelas (descrição terminando em "(n/N)"): é um valor fixo
                COALESCE((
                    SELECT SUM(t.amount)
                    FROM transactions t
                    WHERE t.user_id = b.user_id
                      AND t.category_id = b.category_id
                      AND t.type = 'expense'
                      AND t.description ~ ${INSTALLMENT_REGEX}
                      AND t.transaction_date BETWEEN
                          CASE WHEN b.period = 'weekly' THEN $2::date ELSE $4::date END
                          AND CASE WHEN b.period = 'weekly' THEN $3::date ELSE $5::date END
                ), 0)::numeric(12, 2) AS installment_spent
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
