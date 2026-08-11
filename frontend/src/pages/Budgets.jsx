import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../libs/axios";
import API_PATHS from "../utils/apiPaths";
import toast from 'react-hot-toast';

const statusStyles = {
    good: {
        Icon: CheckCircle2,
        label: 'On Track',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        iconColor: 'text-emerald-600',
    },
    caution: {
        Icon: AlertTriangle,
        label: 'Watch It',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        iconColor: 'text-amber-600',
    },
    concerning: {
        Icon: AlertOctagon,
        label: 'Over Budget',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        iconColor: 'text-rose-600',
    },
}

const AnalysisSkeleton = () => {

    <div className="mt-4 pt-4 border-t border-slate-100 animate-pulse">
        <div className="flex items-start gap-2.5">
            <div className="shrink-0 h-6 w-6 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-20 bg-slate-200 rounded-full" />
                <div className="h-2.5 bg-slate-200 rounded w-full" />
                <div className="h-2.5 bg-slate-200 rounded w-4/5" />
            </div>
        </div>
    </div>
}

const Budgets = () => {

    const { user } = useAuth();
    const currency = user?.currency || 'USD';
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [analyses, setAnalyses] = useState({});
    const [analyzing, setAnalyzing] = useState(true);

    const fetchData = async () => {

        try {
            setLoading(true);
            const [bRes, cRes] = await Promise.all([
                api.get(API_PATHS.BUDGETS.LIST),
                api.get(API_PATHS.CATEGORIES.LIST)
            ]);
            setBudgets(bRes.data);
            setCategories(cRes.data);
        } catch (err) {
            toast.error('Failed to load budgets', err)
        } finally {
            setLoading(false);
        }
    };

    const analyzeAll = async () => {

        setAnalyses({});
        setAnalyzing(true);

        try {
            const res = await api.post(API_PATHS.BUDGETS.ANALYZE);
            const map = {};
            (res.data.analyses || []).forEach((a) => {
                map[a.budgetId] = a;
            });
            setAnalyses(map);
        } catch (err) {
            console.error('Failed to analyze budgets', err);
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchData();
        analyzeAll();
    }, []);

    // useEffect(() => {
    //     const load = async () => {
    //         await fetchData();
    //         await analyzeAll();
    //     };

    //     load();
    // }, []);

    const onEdit = (b) => {
        setEditing(b);
        setModalOpen(true);
    }

    const onCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const onDelete = async (id) => {

        if (!confirm('Delete this budget?')) return;

        try {
            await api.delete(API_PATHS.BUDGETS.DELETE(id));
            toast.success('Budget deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete budget', err);
        }
    }

    const onSaved = () => {
        setModalOpen(false);
        fetchData();
        analyzeAll();
    }
}