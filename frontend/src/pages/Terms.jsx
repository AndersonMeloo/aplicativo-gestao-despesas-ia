import PublicPage from '../components/PublicPage.jsx';

const sections = [
    {
        id: 'sobre',
        title: '1. Sobre o Gestão IA',
        paragraphs: [
            'O Gestão IA é um aplicativo de controle financeiro que ajuda você a registrar receitas e despesas, organizar seus gastos em categorias, definir limites de orçamento e acompanhar sua situação financeira por meio de gráficos e análises.',
            'O aplicativo foi desenvolvido como projeto acadêmico (Trabalho de Conclusão de Curso) por Anderson Rodrigues de Melo e Gleyce Gomes de Oliveira.',
        ],
    },
    {
        id: 'conta',
        title: '2. Sua conta',
        paragraphs: [
            'Para usar o aplicativo, você precisa criar uma conta com nome, e-mail e senha. Você é responsável por manter sua senha em segurança e por todas as informações registradas na sua conta.',
            'Cada conta é individual: os dados de um usuário não podem ser vistos nem alterados por outro.',
        ],
    },
    {
        id: 'uso',
        title: '3. Uso do aplicativo',
        paragraphs: [
            'Você pode cadastrar, editar e excluir livremente suas transações, categorias e orçamentos. As informações exibidas no aplicativo dependem dos dados que você mesmo registra, por isso é importante mantê-los atualizados.',
        ],
    },
    {
        id: 'ia',
        title: '4. Análises com Inteligência Artificial',
        paragraphs: [
            'O aplicativo utiliza a Inteligência Artificial Gemini, do Google, para interpretar seus dados financeiros e gerar resumos, alertas e dicas de economia.',
            'Todos os valores e cálculos são feitos pelo próprio sistema; a Inteligência Artificial apenas escreve as explicações e sugestões a partir desses números.',
            'As análises têm caráter informativo e educativo. Elas não substituem a orientação de um profissional de finanças, contabilidade ou investimentos, e as decisões tomadas a partir delas são de responsabilidade do usuário.',
        ],
    },
    {
        id: 'privacidade',
        title: '5. Política de privacidade',
        paragraphs: [
            'Coletamos apenas os dados necessários para o funcionamento do aplicativo: nome, e-mail, moeda escolhida e as informações financeiras que você registra.',
            'Sua senha é armazenada de forma criptografada (hash), e nem mesmo os desenvolvedores conseguem visualizá-la.',
            'Para gerar as análises, enviamos à Inteligência Artificial apenas dados resumidos, como totais por categoria e situação dos orçamentos. Seu nome, e-mail e senha nunca são enviados.',
            'Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais.',
        ],
    },
    {
        id: 'alteracoes',
        title: '6. Alterações nestes termos',
        paragraphs: [
            'Estes termos podem ser atualizados à medida que o aplicativo evoluir. Sempre que houver mudanças importantes, a versão atualizada ficará disponível nesta página.',
        ],
    },
];

const Terms = () => (
    <PublicPage title="Termos de uso" subtitle="Última atualização: outubro de 2026">
        <div className="space-y-5">
            {sections.map((s) => (
                <section
                    key={s.id}
                    id={s.id}
                    className="bg-white rounded-3xl border border-slate-100 p-6 scroll-mt-6"
                >
                    <h2 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h2>
                    <div className="space-y-3">
                        {s.paragraphs.map((p, i) => (
                            <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    </PublicPage>
);

export default Terms;
