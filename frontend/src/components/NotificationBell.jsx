import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import api from '../libs/axios.js';
import { API_PATHS } from '../utils/apiPaths.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

// Mesmos limites usados na tela de Orçamentos: a partir de 70% = atenção; acima de 100% = estourado
const toAlert = (b) => {
    const spent = parseFloat(b.spent);
    const limit = parseFloat(b.amount);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return { ...b, spent, limit, pct, over: spent > limit };
};

// Sino de notificações: avisa quando algum orçamento está perto do limite ou estourado
const NotificationBell = () => {
    const { user } = useAuth();
    const currency = user?.currency || 'BRL';
    const { pathname } = useLocation();
    const [budgets, setBudgets] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Recarrega os orçamentos ao trocar de tela (ex.: depois de lançar uma despesa)
    useEffect(() => {
        let active = true;
        api.get(API_PATHS.BUDGETS.LIST)
            .then((res) => active && setBudgets(res.data || []))
            .catch(() => active && setBudgets([]));
        return () => {
            active = false;
        };
    }, [pathname]);

    // Fecha ao clicar fora ou apertar Esc
    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const alerts = budgets
        .map(toAlert)
        .filter((b) => b.pct >= 70)
        .sort((a, b) => b.pct - a.pct);

    return (
        <div className="relative" ref={ref}>
            <button
                title="Notificações"
                onClick={() => setOpen((v) => !v)}
                className="relative h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition"
            >
                <Bell size={17} />
                {alerts.length > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                        {alerts.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-sm font-semibold text-slate-900">Notificações</div>
                        <div className="text-xs text-slate-500">Orçamentos que merecem sua atenção</div>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="px-4 py-8 flex flex-col items-center text-center">
                            <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
                            <div className="text-sm font-medium text-slate-900">Tudo em dia!</div>
                            <div className="text-xs text-slate-500 mt-0.5">Nenhum orçamento perto do limite.</div>
                        </div>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            {alerts.map((a) => (
                                <li key={a.id}>
                                    <Link
                                        to="/budgets"
                                        onClick={() => setOpen(false)}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                                    >
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${a.over ? 'bg-rose-50' : 'bg-amber-50'}`}
                                        >
                                            {a.over ? (
                                                <AlertOctagon size={16} className="text-rose-600" />
                                            ) : (
                                                <AlertTriangle size={16} className="text-amber-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-slate-900">
                                                {a.over ? `${a.category_name} estourou o limite` : `${a.category_name} perto do limite`}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {a.over
                                                    ? `Passou ${formatCurrency(a.spent - a.limit, currency)} de ${formatCurrency(a.limit, currency)}`
                                                    : `${a.pct.toFixed(0)}% usado · restam ${formatCurrency(a.limit - a.spent, currency)}`}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        to="/budgets"
                        onClick={() => setOpen(false)}
                        className="block text-center text-xs font-medium text-violet-600 hover:bg-violet-50 py-2.5 border-t border-slate-100 transition"
                    >
                        Ver todos os orçamentos
                    </Link>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
