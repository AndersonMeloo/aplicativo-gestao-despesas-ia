import pool from '../db.js';

// Consultas agregadas (SUM/COUNT/GROUP BY) usadas pelo dashboard e pela análise da IA.
// Todas recebem userId e intervalos de data já calculados pelo service.

export const getTotals = async (userId, start, end) => {
    const { rows } = await pool.query(
        `SELECT COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float AS income,
                COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense,
                COUNT(*)::int AS count
         FROM transactions
         WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3`,
        [userId, start, end]
    );
    return rows[0];
};

// Um registro por mês do intervalo, inclusive meses sem transações (generate_series)
export const getMonthlyTrend = async (userId, firstMonth, lastMonth) => {
    const { rows } = await pool.query(
        `SELECT to_char(m.month, 'YYYY-MM') AS month,
                COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)::numeric(12, 2) AS income,
                COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::numeric(12, 2) AS expense
         FROM (SELECT d::date AS month FROM generate_series($2::date, $3::date, interval '1 month') AS d) AS m
         LEFT JOIN transactions t
                ON t.user_id = $1
               AND date_trunc('month', t.transaction_date)::date = m.month
         GROUP BY m.month
         ORDER BY m.month`,
        [userId, firstMonth, lastMonth]
    );
    return rows;
};

export const getCategoryBreakdown = async (userId, start, end, type = 'expense') => {
    const { rows } = await pool.query(
        `SELECT t.category_id,
                COALESCE(c.name, 'Sem categoria') AS category_name,
                COALESCE(c.icon, 'tag') AS category_icon,
                COALESCE(c.color, '#94A3B8') AS category_color,
                SUM(t.amount)::numeric(12, 2) AS total,
                COUNT(*)::int AS transaction_count
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.user_id = $1 AND t.type = $4 AND t.transaction_date BETWEEN $2 AND $3
         GROUP BY t.category_id, c.name, c.icon, c.color
         ORDER BY total DESC`,
        [userId, start, end, type]
    );
    return rows;
};

// Descrições de despesas que mais se repetem (ex.: Netflix, Uber) — ajudam a IA a achar padrões
export const getFrequentExpenses = async (userId, start, end, limit = 10) => {
    const { rows } = await pool.query(
        `SELECT LEFT(TRIM(description), 40) AS description,
                COUNT(*)::int AS count,
                SUM(amount)::float AS total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense' AND description IS NOT NULL AND TRIM(description) <> ''
           AND transaction_date BETWEEN $2 AND $3
         GROUP BY LEFT(TRIM(description), 40)
         ORDER BY count DESC, total DESC
         LIMIT $4`,
        [userId, start, end, limit]
    );
    return rows;
};

// Gastos por dia da semana (0 = domingo) — revela, por exemplo, gastos concentrados no fim de semana
export const getExpenseByWeekday = async (userId, start, end) => {
    const { rows } = await pool.query(
        `SELECT EXTRACT(DOW FROM transaction_date)::int AS weekday, SUM(amount)::float AS total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense' AND transaction_date BETWEEN $2 AND $3
         GROUP BY 1
         ORDER BY 1`,
        [userId, start, end]
    );
    return rows;
};
