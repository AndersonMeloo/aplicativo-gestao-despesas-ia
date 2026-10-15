import * as analyticsService from '../services/analytics.service.js';

export const summary = async (req, res) => {
    res.json(await analyticsService.getSummary(req.userId));
};

export const monthlyTrend = async (req, res) => {
    res.json(await analyticsService.getMonthlyTrend(req.userId));
};

export const categoryBreakdown = async (req, res) => {
    res.json(await analyticsService.getCategoryBreakdown(req.userId));
};
