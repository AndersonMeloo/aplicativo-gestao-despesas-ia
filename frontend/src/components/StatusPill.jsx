const styles = {
    income: 'bg-esmerald-50 text-esmerald-700',
    expense: 'bg-rose-50 text-rose-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-blue-50 text-blue-700',
    critical: 'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-700',
}

const StatusPill = ({ variant = 'neutral', children }) => {

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[variant] || styles.neutral}`}>
            {children}
        </span>
    )
}

export default StatusPill;