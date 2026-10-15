import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, ChevronDown } from 'lucide-react';
import Spinner from '../components/Spinner';
import AuthHero from '../components/AuthHero';

const CURRENCIES = [
    { value: 'USD', label: 'USD - Dólar americano' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - Libra esterlina' },
    { value: 'INR', label: 'INR - Rupia indiana' },
    { value: 'JPY', label: 'JPY - Iene japonês' },
    { value: 'CAD', label: 'CAD - Dólar canadense' },
    { value: 'AUD', label: 'AUD - Dólar australiano' },
    { value: 'BRL', label: 'BRL - Real brasileiro' },
];

const Register = () => {

    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        currency: 'BRL',
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register(form)
            toast.success('Conta criada!')
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Falha no cadastro');
        } finally {
            setLoading(false);
        }
    }

    return (

        <div className="min-h-screen flex bg-white">
            <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1">
                
                <div className="flex justify-start items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                        <Wallet size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-xl text-slate-900">Gestão IA</span>
                </div>

                <div className="flex-1 flex items-center justify-center py-10">
                    <div className="w-full max-w-md">
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Criar conta</h2>
                        <p className="text-slate-500 mb-10">Crie sua conta em segundos</p>

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nome</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-violet-500 rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition"
                                    placeholder="Maria"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-violet-500 rounded-2xl px-5 py-4 text-slate-900 text-sm focus:outline-none transition"
                                    placeholder="voce@exemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Senha</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-violet-500 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition"
                                        placeholder="Pelo menos 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Moeda</label>
                                <div className="relative">
                                    <select
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                        className="w-full appearance-none bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-violet-500 rounded-2xl px-5 py-4 pr-12 text-slate-900 text-sm focus:outline-none transition cursor-pointer"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={18}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-violet-400 to-violet-600 active:bg-violet-800 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" />
                                        Criando conta...
                                    </>
                                ) : (
                                    'Criar conta'
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-sm text-slate-500">
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700 transition">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="flex justify-start gap-6 text-xs text-slate-500">
                    <a className="hover:text-slate-900 transition cursor-pointer">Política de privacidade</a>
                    <a className="hover:text-slate-900 transition cursor-pointer">Termos</a>
                    <a className="hover:text-slate-900 transition cursor-pointer">FAQ</a>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
                <AuthHero headline="Comece" subheadline="sua jornada financeira" />
            </div>
        </div>
    )
}

export default Register;