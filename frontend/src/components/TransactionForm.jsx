import { useState } from 'react';
import toast from 'react-hot-toast';
import { API_PATHS } from '../utils/apiPaths.js';
import { todayDateString } from '../utils/format.js';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import Textarea from './ui/Textarea.jsx';
import Button from './ui/Button.jsx';
import api from '../libs/axios.js';

const TransctionForm = ({ initial, categories, onSaved, onCancel }) => {

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

            <Input
                label="Valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

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
                label="Data"
                type="date"
                required
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            />

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