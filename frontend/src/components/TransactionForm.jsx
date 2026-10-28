import { useState } from 'react';
import toast from 'react-hot-toast';
import { API_PATHS } from '../utils/apiPaths.js';
import { formatCurrency, formatDate, todayDateString } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import Textarea from './ui/Textarea.jsx';
import Button from './ui/Button.jsx';
import api from '../libs/axios.js';

// Opções de parcelamento: à vista ou de 2x a 24x
const INSTALLMENT_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);

// Avança N meses mantendo o dia (31/01 + 1 mês = 28/02), igual ao backend
const addMonthsKeepDay = (iso, months) => {
    const [y, m, d] = iso.split('-').map(Number);
    const target = new Date(y, m - 1 + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const day = String(Math.min(d, lastDay)).padStart(2, '0');
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${day}`;
};

const TransctionForm = ({ initial, categories, onSaved, onCancel }) => {
    const { user } = useAuth();
    const currency = user?.currency || 'BRL';

    const [form, setForm] = useState({

        type: initial?.type || 'expense',
        amount: initial?.amount || '',
        categoryId: initial?.category_id || '',
        description: initial?.description || '',
        notes: initial?.notes || '',
        transactionDate:
            initial?.transaction_date?.split('T')[0] || todayDateString(),
    });

    const [saving, setSaving] = useState(false);
    const [installments, setInstallments] = useState(1);
    const isInstallment = !initial && installments > 1;

    // Resumo exibido quando a compra é parcelada (ex.: 12x de R$ 541,67)
    const installmentValue = isInstallment && form.amount ? parseFloat(form.amount) / installments : 0;
    const lastInstallmentDate = isInstallment && form.transactionDate
        ? addMonthsKeepDay(form.transactionDate, installments - 1)
        : null;

    const filteredCategories = categories.filter((c) => c.type === form.type);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                type: form.type,
                amount: parseFloat(form.amount),
                categoryId: form.categoryId || null,
                description: form.description || null,
                notes: form.notes || null,
                transactionDate: form.transactionDate,
            };

            if (initial) {

                await api.put(API_PATHS.TRANSACTIONS.UPDATE(initial.id), payload)
                toast.success('Transação atualizada');
            } else if (isInstallment) {
                // O valor informado é o total; o backend cria uma transação por mês
                await api.post(API_PATHS.TRANSACTIONS.CREATE, { ...payload, installments });
                toast.success(`${installments} parcelas criadas`);
            } else {
                await api.post(API_PATHS.TRANSACTIONS.CREATE, payload)
                toast.success('Transação criada');
            }

            onSaved()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Falha ao salvar');
        } finally {
            setSaving(false);
        }
    }

    return (

        <form onSubmit={submit} className="space-y-4">

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense', categoryId: '' })}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition ${form.type === 'expense'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    Despesa
                </button>
                <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income', categoryId: '' })}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition ${form.type === 'income'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    Receita
                </button>
            </div>

            <div className={initial ? '' : 'grid grid-cols-2 gap-3'}>
                <Input
                    label={isInstallment ? 'Valor total' : 'Valor'}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                {!initial && (
                    <Select
                        label="Parcelamento"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                    >
                        {INSTALLMENT_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n === 1 ? 'À vista' : `${n}x`}
                            </option>
                        ))}
                    </Select>
                )}
            </div>

            <Select
                label="Categoria"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </Select>

            <Input
                label="Descrição"
                placeholder="ex.: Almoço no restaurante"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Input
                label={isInstallment ? 'Data da 1ª parcela' : 'Data'}
                type="date"
                required
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            />

            {isInstallment && (
                <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-sm text-violet-900">
                    <span className="font-semibold">
                        {installments}x de {formatCurrency(installmentValue, currency)}
                    </span>
                    {lastInstallmentDate && (
                        <span className="text-violet-700">
                            {' '}· de {formatDate(form.transactionDate)} a {formatDate(lastInstallmentDate)}
                        </span>
                    )}
                    <p className="text-xs text-violet-700 mt-1">
                        Será criada uma transação por mês, com a descrição numerada (1/{installments}, 2/{installments}...).
                    </p>
                </div>
            )}

            <Textarea
                label="Observações (opcional)"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
        </form>
    )
}

export default TransctionForm;