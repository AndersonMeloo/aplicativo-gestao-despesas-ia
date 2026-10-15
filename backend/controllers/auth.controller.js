import * as authService from '../services/auth.service.js';
import { validateLogin, validateRegister } from '../validators/auth.validator.js';

export const register = async (req, res) => {
    const result = await authService.register(validateRegister(req.body));
    res.status(201).json(result);
};

export const login = async (req, res) => {
    res.json(await authService.login(validateLogin(req.body)));
};

export const me = async (req, res) => {
    res.json(await authService.me(req.userId));
};
