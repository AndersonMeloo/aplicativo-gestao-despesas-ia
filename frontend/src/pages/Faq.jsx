import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PublicPage from '../components/PublicPage.jsx';

const questions = [
    {
        q: 'O que é o Gestão IA?',
        a: 'É um aplicativo para controlar o dinheiro que entra e sai. Você registra suas receitas e despesas, organiza tudo em categorias e acompanha, em gráficos, para onde o dinheiro está indo. Uma Inteligência Artificial analisa seus números e dá dicas para você economizar.',
    },
    {
        q: 'O aplicativo é gratuito?',
        a: 'Sim. O Gestão IA foi desenvolvido como projeto acadêmico e pode ser usado gratuitamente.',
    },
    {
        q: 'Posso criar minhas próprias categorias?',
        a: 'Pode, e essa é uma das ideias principais do aplicativo. Ao criar a conta, sugerimos algumas categorias (como Mercado, Restaurante e Transporte), mas você pode renomear, trocar o ícone e a cor, excluir e criar quantas quiser.',
    },
    {
        q: 'O que acontece com minhas transações se eu excluir uma categoria?',
        a: 'As transações não são apagadas: elas passam a aparecer como "Sem categoria". Já os orçamentos daquela categoria são removidos.',
    },
    {
        q: 'Como funcionam os orçamentos?',
        a: 'Você escolhe uma categoria e define quanto quer gastar, no máximo, por mês ou por semana. O aplicativo mostra quanto já foi usado e quanto ainda resta, e avisa quando você está perto do limite (a partir de 70%) ou quando ele foi ultrapassado.',
    },
    {
        q: 'Como a Inteligência Artificial analisa meus gastos?',
        a: 'Primeiro, o próprio aplicativo calcula os seus números: totais, gastos por categoria, situação dos orçamentos e comparação com o mês anterior. Depois, a Inteligência Artificial (Gemini, do Google) lê esses resultados e escreve um resumo, aponta o que merece atenção e sugere formas de economizar.',
    },
    {
        q: 'A Inteligência Artificial pode errar os valores?',
        a: 'Os valores não vêm da Inteligência Artificial: todas as contas são feitas pelo sistema. A IA fica responsável apenas pela explicação e pelas sugestões. Mesmo assim, as dicas têm caráter informativo e não substituem um profissional de finanças.',
    },
    {
        q: 'O que é a nota de saúde financeira?',
        a: 'É uma nota de 0 a 100 calculada pelo aplicativo. Ela considera quanto do seu dinheiro você conseguiu guardar no mês, se os seus orçamentos foram respeitados e se os seus gastos aumentaram ou diminuíram em relação ao mês anterior.',
    },
    {
        q: 'Meus dados estão seguros?',
        a: 'Sim. Sua senha é guardada de forma criptografada, cada usuário só consegue acessar os próprios dados e, para gerar as análises, enviamos à IA apenas informações resumidas, sem seu nome, e-mail ou senha.',
    },
    {
        q: 'Posso usar em outra moeda além do real?',
        a: 'Sim. No cadastro você escolhe a moeda (real, dólar, euro e outras), e todos os valores passam a ser exibidos nela.',
    },
];

const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-slate-100">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
                <span className="font-semibold text-slate-900">{q}</span>
                <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && <p className="px-5 pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{a}</p>}
        </div>
    );
};

const Faq = () => (
    <PublicPage title="Perguntas frequentes" subtitle="Tire suas dúvidas sobre o Gestão IA">
        <div className="space-y-3">
            {questions.map((item) => (
                <FaqItem key={item.q} {...item} />
            ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
            Ainda com dúvidas? Leia também os{' '}
            <Link to="/termos" className="text-violet-600 font-medium hover:text-violet-700">
                Termos de uso
            </Link>
            .
        </p>
    </PublicPage>
);

export default Faq;
