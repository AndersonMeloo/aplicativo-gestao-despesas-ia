import { createContext, useContext, useEffect, useState } from "react";
import api from "../libs/axios";
import { API_PATHS } from "../utils/constants";

// Cria o contexto global de autenticação
const AuthContext = createContext(null);

// Provider responsável por disponibilizar os dados de autenticação
// para toda a aplicação
export const AuthProvider = ({ children }) => {

    // Armazena os dados do usuário autenticado
    const [user, setUser] = useState(null);

    // Controla o estado de carregamento da autenticação
    const [loading, setLoading] = useState(null);

    // Verifica se existe um token salvo ao carregar a aplicação
    useEffect(() => {
        const token = localStorage.getItem('token');

        // Caso não exista token, encerra o carregamento
        if (!token) {
            setLoading(false);
            return;
        }

        // Busca os dados do usuário autenticado
        api.get(API_PATHS.AUTH.ME)
            .then((res) => setUser(res.data))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false));
    }, []);

    // Realiza o login do usuário
    const login = async (email, password) => {
        const res = await api.post(API_PATHS.AUTH.LOGIN, { email, password });

        // Salva o token retornado pela API
        localStorage.setItem('token', res.data.token);
        // Atualiza os dados do usuário autenticado
        setUser(res.data.user);
    };

    // Realiza o cadastro de um novo usuário
    const register = async (payload) => {
        const res = await api.post(API_PATHS.AUTH.REGISTER, payload);

        // Salva o token retornado pela API
        localStorage.setItem('token', res.data.token);
        // Atualiza os dados do usuário autenticado
        setUser(res.data.user);
    };

    // Remove os dados da sessão do usuário
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Disponibiliza os dados e métodos de autenticação para os componentes filhos
    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);