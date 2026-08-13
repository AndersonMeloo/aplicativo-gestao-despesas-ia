import { ArrowRight, Sparkles } from "lucide-react";
import Spinner from "../components/Spinner";
import { timeAgo } from "../utils/format";

const ActionCard = ({ title, description, icon: Icon, accentGradient, accentText, onClick, generating, lastGenerated }) => (

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
                <Sparkles size={24} className="text-slate-300 group-hover:text-violet-500 transition" />
            )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">{description}</p>

        <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accentText}`}>
                {generating ? 'Analyzing...' : 'Generate Insight'}
                {!generating && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />}
            </span>
            {lastGenerated && (
                <span className="text-xs text-slate-400">Last: {timeAgo(lastGenerated)}</span>
            )}
        </div>

    </button>
)

const Insights = () => {

    return (

        <>

        </>
    )
}

export default Insights;