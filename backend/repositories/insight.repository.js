import pool from '../db.js';

const FIELDS = 'id, insight_type, period_start, period_end, content_json, created_at';

export const findAll = async (userId, limit = 50) => {
    const { rows } = await pool.query(
        `SELECT ${FIELDS} FROM ai_insights WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
        [userId, limit]
    );
    return rows;
};

export const create = async (userId, { type, periodStart, periodEnd, content }) => {
    const { rows } = await pool.query(
        `INSERT INTO ai_insights (user_id, insight_type, period_start, period_end, content_json)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${FIELDS}`,
        [userId, type, periodStart, periodEnd, content]
    );
    return rows[0];
};
