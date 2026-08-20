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

}

export default Transactions;