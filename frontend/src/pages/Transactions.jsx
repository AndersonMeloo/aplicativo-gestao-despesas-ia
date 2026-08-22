import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext"
import api from "../libs/axios";
import API_PATHS from "../utils/apiPaths";
import toast from 'react-hot-toast';

const Transactions = () => {

    const { user } = useAuth();
    const currency = user?.currency || 'USD';
    const [allTransactions, setAllTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', type: '', categoryId: '' });
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('monthly');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const fetchData = async () => {

        const params = { limit: 2000 }
        if (filters.search) params.search = filters.search;
        if (filters.categoryId) params.categories = filters.categoryId;

        try {
            setLoading(true)
            const [tRes, cRes] = await Promise.all([
                api.get(API_PATHS.TRANSACTIONS.LIST, { params }),
                api.get(API_PATHS.CATEGORIES.LIST)
            ])

            setAllTransactions(tRes.data)
            setCategories(cRes.data)
        } catch (err) {
            toast.error('Failed to load transactions', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [filters.search, filters.categoryId])

    useEffect(() => {
        setPage(1);
    }, [filters.search, filters.type, filters.categoryId]);

    const transactions = useMemo(
        () =>
            filters.type
                ? allTransactions.filter((t) => t.type === filters.type)
                : allTransactions,
        [allTransactions, filters.type]
    )

    const counts = useMemo(
        () => ({
            all: allTransactions.length,
            income: allTransactions.filter((t) => t.type === 'income').length,
            expense: allTransactions.filter((t) => t.type === 'expense').length,
        }),
        [allTransactions]
    );


    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const trendData = useMemo(() => {
        const now = new Date();
        const txnKey = (t) => (t.transaction_date || '').split('T')[0];
        const addAmount = (entry, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') entry.income += amount;
            else entry.expense += amount;
        };

        if (timeRange === '30d' || timeRange === '3m') {
            const totalDays = timeRange === '30d' ? 30 : 90;
            const buckets = [];
            for (let i = totalDays - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const label = `${d.getMonth() + 1}/${d.getDate()}`;
                buckets.push({ key, label, income: 0, expense: 0 });
            }
            const map = new Map(buckets.map((b) => [b.key, b]));
            allTransactions.forEach((t) => {
                const entry = map.get(txnKey(t));
                if (entry) addAmount(entry, t);
            });
            return buckets;
        }

        if (timeRange === 'monthly') {
            const buckets = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
                buckets.push({ key, label, income: 0, expense: 0 });
            }
            const map = new Map(buckets.map((b) => [b.key, b]));
            allTransactions.forEach((t) => {
                const [year, month] = txnKey(t).split('-');
                const entry = map.get(`${year}-${month}`);
                if (entry) addAmount(entry, t);
            });
            return buckets;
        }

        if (timeRange === 'yearly') {
            const buckets = [];
            for (let i = 4; i >= 0; i--) {
                const y = String(now.getFullYear() - i);
                buckets.push({ key: y, label: y, income: 0, expense: 0 });
            }
            const map = new Map(buckets.map((b) => [b.key, b]));
            allTransactions.forEach((t) => {
                const year = txnKey(t).split('-')[0];
                const entry = map.get(year);
                if (entry) addAmount(entry, t);
            });
            return buckets;
        }

        return [];
    }, [allTransactions, timeRange]);


    const chartInterval = timeRange === '30d' ? 3 : timeRange === '3m' ? 10 : 0;

    const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * PAGE_SIZE;
    const paginated = transactions.slice(startIdx, startIdx + PAGE_SIZE);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
        if (safePage >= totalPages - 3) {
            return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages];
    };

}

export default Transactions;