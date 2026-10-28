// Formata valores monetários no padrão brasileiro (R$ 1.234,56)
export const formatCurrency = (amount, currency = 'BRL') => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// Formata uma data para exibição no padrão brasileiro
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // 'AAAA-MM-DD' é montada no horário local. Com new Date('2026-10-27') o navegador
    // considera meia-noite em UTC, e no Brasil (UTC-3) a data aparecia um dia antes.
    const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const date = onlyDate
        ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
        : new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Formata um mês no formato YYYY-MM para MMM/AA (ex.: jun./26)
export const formatMonth = (yyyyMm) => {
    if (!yyyyMm) return '';
    const [year, month] = yyyyMm.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

// Retorna a data atual no formato YYYY-MM-DD
export const todayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Retorna o tempo decorrido desde uma data
export const timeAgo = (date) => {
    if (!date) return '—';
    const diffMs = Date.now() - new Date(date).getTime();
    if (diffMs < 0) return 'agora';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? 'há 1 dia' : `há ${days} dias`;
    return formatDate(date);
};