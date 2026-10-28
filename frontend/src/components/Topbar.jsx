import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
};

const formatToday = () =>
    new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

const Topbar = () => {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] || '';

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
            <div>
                <div className="text-sm font-semibold text-slate-900 tracking-tight">
                    {greeting()}{firstName && `, ${firstName}`} 👋
                </div>
                <div className="text-xs text-slate-500">{formatToday()}</div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    title="Buscar"
                    className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition"
                >
                    <Search size={17} />
                </button>
                <NotificationBell />
            </div>
        </header>
    );
};

export default Topbar;
