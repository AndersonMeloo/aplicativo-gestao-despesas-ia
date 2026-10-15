// Configuração do Express (separada do server.js para que os testes usem o app sem abrir porta fixa)
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

// Apenas o frontend configurado pode chamar a API pelo navegador
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: '100kb' }));
app.disable('x-powered-by');

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
