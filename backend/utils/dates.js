// Funções de data trabalhando com strings 'YYYY-MM-DD' (mesmo formato das colunas DATE).
// "Hoje" é calculado no fuso do app (padrão: America/Sao_Paulo), e não em UTC,
// para que o mês não "vire" às 21h no horário de Brasília.

const timezone = () => process.env.APP_TIMEZONE || 'America/Sao_Paulo';

const pad = (n) => String(n).padStart(2, '0');

const toISO = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const fromISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};

export const today = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone() }).format(new Date()); // en-CA => YYYY-MM-DD

export const addDays = (iso, days) => {
    const d = fromISO(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return toISO(d);
};

export const monthStart = (iso) => `${iso.slice(0, 7)}-01`;

export const addMonths = (iso, months) => {
    const d = fromISO(monthStart(iso));
    d.setUTCMonth(d.getUTCMonth() + months);
    return toISO(d);
};

export const monthEnd = (iso) => addDays(addMonths(iso, 1), -1);

// Avança N meses mantendo o dia (usado nas parcelas). Se o mês não tiver esse dia,
// usa o último dia do mês: 31/01 + 1 mês = 28/02 (ou 29/02 em ano bissexto).
export const addMonthsKeepDay = (iso, months) => {
    const target = addMonths(iso, months);
    const lastDay = Number(monthEnd(target).slice(8));
    const day = Math.min(Number(iso.slice(8)), lastDay);
    return `${target.slice(0, 8)}${pad(day)}`;
};

// Semana de segunda a domingo
export const weekStart = (iso) => {
    const dow = fromISO(iso).getUTCDay(); // 0 = domingo
    return addDays(iso, dow === 0 ? -6 : 1 - dow);
};

export const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);

// Intervalo do período corrente de um orçamento
export const budgetPeriodRange = (period, ref = today()) =>
    period === 'weekly'
        ? { start: weekStart(ref), end: addDays(weekStart(ref), 6) }
        : { start: monthStart(ref), end: monthEnd(ref) };

export const isValidISODate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return toISO(fromISO(value)) === value; // rejeita 2026-02-31
};
