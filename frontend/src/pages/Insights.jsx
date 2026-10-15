import { useEffect, useMemo, useState } from 'react';
import {
    Sparkles,
    TrendingUp,
    Lightbulb,
    Activity,
    Wallet,
    Clock,
    ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../libs/axios.js';
import { API_PATHS } from '../utils/apiPaths.js';
import { formatCurrency, timeAgo } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';
import InsightCard from '../components/InsightCard.jsx';
import KpiCard from '../components/KpiCard.jsx';

const ActionCard = ({ title, description,  icon: Icon, accentGradient, accentText, onClick, generating, lastGenerated }) => (

    <button
        onClick={onClick}
        disabled={generating}
        className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-6 text-left hover:border-slate-200 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
    >

        <div className="flex items-start justify-between mb-4">
            <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${accentGradient} flex items-center justify-center group-hover:scale-105 transition shadow-sm`}>
                <Icon size={24} className="text-white" />
            </div>
            {generating ? (
                <Spinner size="sm" />
            ) : (
                <Sparkles size={16} className="text-slate-300 group-hover:text-violet-500 transition" />
            )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">{description}</p>

        <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accentText}`}>
                {generating ? 'Analisando...' : 'Gerar insight'}
                {!generating && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />}
            </span>
            {lastGenerated && (
                <span className="text-xs text-slate-400">Última: {timeAgo(lastGenerated)}</span>
            )}
        </div>

    </button>
);

const Insights = () => {

    const { user } = useAuth();
    const currency = user?.currency || 'BRL';
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await api.get(API_PATHS.INSIGHTS.LIST);
            setInsights(res.data);
        } catch (err) {
            toast.error('Falha ao carregar insights', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            void fetchInsights();
        });
    }, []);

    const generate = async (type) => {

        setGenerating(type);
        try {
            await api.post(API_PATHS.INSIGHTS.GENERATE, { type });
            toast.success('Insight gerado');
            fetchInsights();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Falha ao gerar');
        } finally {
            setGenerating(null);
        }
    };

    const stats = useMemo(() => {

        const latestMonthly = insights.find((i) => i.insight_type === 'monthly_summary');
        const latestTips = insights.find((i) => i.insight_type === 'savings_tips');
        const monthly = latestMonthly?.content_json;
        const tips = latestTips?.content_json;
        const potentialSavings =
            tips?.tips?.reduce((sum, t) => sum + (Number(t.estimatedSavings) || 0), 0) || 0;

        return {
            total: insights.length,
            healthScore: monthly?.healthScore ?? null,
            potentialSavings,
            lastAt: insights[0]?.created_at || null,
            latestMonthlyAt: latestMonthly?.created_at,
            latestTipsAt: latestTips?.created_at,
        };

    }, [insights]);

    const healthAccent =
        stats.healthScore == null
            ? 'slate'
            : stats.healthScore >= 70
                ? 'emerald'
                : stats.healthScore >= 40
                    ? 'amber'
                    : 'rose';

    return (

        <div className="space-y-6">

            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Insights com IA</h1>
                <p className="text-sm text-slate-500 mt-1.5">
                    Análises financeiras personalizadas com o Gemini — gere insights e cuide melhor do seu dinheiro
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Insights gerados"
                    value={stats.total}
                    icon={Sparkles}
                    accent="violet"
                />
                <KpiCard
                    label="Saúde financeira"
                    value={stats.healthScore != null ? `${stats.healthScore}/100` : '—'}
                    icon={Activity}
                    accent={healthAccent}
                />
                <KpiCard
                    label="Economia potencial/mês"
                    value={stats.potentialSavings > 0 ? formatCurrency(stats.potentialSavings, currency) : '—'}
                    icon={Wallet}
                    accent="orange"
                />
                <KpiCard
                    label="Última análise"
                    value={stats.lastAt ? timeAgo(stats.lastAt) : '—'}
                    icon={Clock}
                    accent="blue"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ActionCard
                    title="Resumo mensal"
                    description="Um resumo completo das receitas e despesas do mês, com nota de saúde financeira e recomendações práticas."
                    icon={TrendingUp}
                    accentGradient="from-violet-400 to-violet-600"
                    accentText="text-violet-600"
                    onClick={() => generate('monthly_summary')}
                    generating={generating === 'monthly_summary'}
                    lastGenerated={stats.latestMonthlyAt}
                />
                <ActionCard
                    title="Dicas de economia"
                    description="Formas personalizadas de economizar, com base nas categorias em que você mais gastou nos últimos 30 dias."
                    icon={Lightbulb}
                    accentGradient="from-blue-400 to-blue-600"
                    accentText="text-blue-600"
                    onClick={() => generate('savings_tips')}
                    generating={generating === 'savings_tips'}
                    lastGenerated={stats.latestTipsAt}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Análises recentes</h2>
                    {!loading && insights.length > 0 && (
                        <span className="text-xs text-slate-500">
                            {insights.length} {insights.length === 1 ? 'análise' : 'análises'}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl border border-slate-100 py-16 flex justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : insights.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100">
                        <EmptyState
                            icon={Sparkles}
                            title="Nenhum insight ainda"
                            description="Gere sua primeira análise com IA usando um dos cards acima."
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {insights.map((i, idx) => (
                            <InsightCard
                                key={i.id}
                                insight={i}
                                defaultExpanded={idx === 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
