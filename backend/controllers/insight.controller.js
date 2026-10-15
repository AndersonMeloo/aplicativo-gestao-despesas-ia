import * as insightService from '../services/insight.service.js';

export const list = async (req, res) => {
    res.json(await insightService.list(req.userId));
};

export const generate = async (req, res) => {
    res.status(201).json(await insightService.generate(req.userId, req.body?.type));
};
