// =============================================================================
// CLIENTE HTTP DA API
// -----------------------------------------------------------------------------
// Instância do axios apontando para o backend. As páginas continuam usando
// api.get / api.post / api.put / api.delete normalmente.
// Endereço configurado em VITE_API_URL (ver frontend/.env.example).
// =============================================================================

import axios from 'axios';
import mockApi, { startMockSession } from './mockApi.js';

// VITE_USE_MOCK=true usa dados de exemplo, sem backend e sem login (modo demo)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 60000, // as análises com IA podem levar alguns segundos
});

// Envia o token JWT salvo no login em todas as requisições
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Token expirado/inválido: limpa a sessão e volta para o login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = /\/auth\/(login|register)$/.test(error.config?.url || '');
        if (error.response?.status === 401 && !isAuthRoute) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

if (USE_MOCK) startMockSession();

export default USE_MOCK ? mockApi : api;
