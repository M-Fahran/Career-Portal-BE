import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import AppError from "../utils/AppError";

export const authorize = (...allowedRolles: string[]) => 
    (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Autentikasi diperlukan', 401));
        }
        if (!allowedRolles.includes(req.user.role)) {
            return next(new AppError('Akses ditolak', 403));
        }
        next();
    }