import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import env from '../config/env';
import AppError from "../utils/AppError";

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return next(new AppError('Token tidak ditemukan', 401))
    }

    const token = header.split(' ')[1];

    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
            id: string;
            role: string;
            type?: 'candidate' | 'user';
        };

        const role = payload.type === 'candidate' || payload.role === 'candidate'
            ? 'candidate'
            : 'user';

        req.user = { id: payload.id, role, type: payload.type };

        next();
    } catch {
        next(new AppError('Token tidak valid atau kadaluarsa', 401))
    }
};