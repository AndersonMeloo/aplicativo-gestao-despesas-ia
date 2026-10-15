import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Sem estas variáveis o sistema não funciona com segurança: falha logo na inicialização
for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[name]) {
        console.error(`Variável de ambiente ${name} não definida. Veja o arquivo .env.example`);
        process.exit(1);
    }
}
if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY não definida: os recursos de IA ficarão indisponíveis.');
}

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}/api`);
});
