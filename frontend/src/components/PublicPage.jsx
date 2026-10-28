import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';

// Layout das páginas públicas (Termos, FAQ): cabeçalho com logo, conteúdo e rodapé
const PublicPage = ({ title, subtitle, children }) => {
    const { hash } = useLocation();

    // Rola até a seção indicada no link (ex.: /termos#privacidade)
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo(0, 0);
    }, [hash]);

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-100">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/login" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                            <Wallet size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-slate-900">Gestão IA</span>
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
                <div className="mt-8">{children}</div>
            </main>

            <footer className="max-w-3xl mx-auto px-6 pb-10 flex gap-6 text-xs text-slate-500">
                <Link to="/termos" className="hover:text-slate-900 transition">Termos de uso</Link>
                <Link to="/termos#privacidade" className="hover:text-slate-900 transition">Política de privacidade</Link>
                <Link to="/faq" className="hover:text-slate-900 transition">FAQ</Link>
            </footer>
        </div>
    );
};

export default PublicPage;
