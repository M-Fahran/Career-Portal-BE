import { Request, Response } from "express";
import catchAsync from '../utils/catchAsync';
import * as authService from '../service/auth.service';
import { success } from "zod";
import { error } from "node:console";
import AppError from "../utils/AppError";
import {
  TokenType,
  getRefreshCookieNameByType,
} from '../utils/generateToken';

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const clearRefreshTokenCookie = (res: Response, type: TokenType) => {
  res.clearCookie(getRefreshCookieNameByType(type), { path: '/' });
};

const setRefreshTokenCookie = (res: Response, refreshToken: string, type: TokenType) => {
  res.cookie(getRefreshCookieNameByType(type), refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { candidate, accessToken, refreshToken } =
    await authService.register(req.body);

  clearRefreshTokenCookie(res, 'user');
  setRefreshTokenCookie(res, refreshToken, 'candidate');

  const { passwordHash: _ph, ...candidateSafe } = candidate;

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { candidate: candidateSafe, accessToken },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { candidate, accessToken, refreshToken } =
    await authService.login(req.body);

  clearRefreshTokenCookie(res, 'user');
  setRefreshTokenCookie(res, refreshToken, 'candidate');

  const { passwordHash: _ph, ...candidateSafe } = candidate;

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { candidate: candidateSafe, accessToken },
  });
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } =
    await authService.loginAdmin(req.body);

  clearRefreshTokenCookie(res, 'candidate');
  setRefreshTokenCookie(res, refreshToken, 'user');

  const { passwordHash: _ph, ...adminSafe } = user;

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { admin: adminSafe, accessToken },
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const candidateId = req.user!.id;

  const candidate = await authService.getsProfile(candidateId);
  const {passwordHash: _ph, ...candidateSafe} = candidate;

  res.status(200).json({
    success: true,
    data: {candidate: candidateSafe},
  });
});

const refreshByCookie = async (req: Request, res: Response, type: TokenType) => {
  const cookieName = getRefreshCookieNameByType(type);
  const token = req.cookies[cookieName];

  if (!token) {
    throw new AppError('Session berakhir, silahkan login ulang', 401);
  }

  const refreshAction = type === 'candidate' ? authService.refreshCandidate : authService.refreshUser;
  const { accessToken } = await refreshAction(token);

  return res.status(200).json({ success: true, data: { accessToken } });
};

export const refreshCandidateToken = catchAsync(async (req: Request, res: Response) => {
  return refreshByCookie(req, res, 'candidate');
});

export const refreshUserToken = catchAsync(async (req: Request, res: Response) => {
  return refreshByCookie(req, res, 'user');
});

export const refreshToken = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('Gunakan endpoint refresh kandidat atau user yang sesuai', 400);
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('candidateRefreshToken');
  res.clearCookie('userRefreshToken');

  res.status(200).json({
    success: true,
    message: 'Logout Berhasil',
  });
});

export const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.updateAdminProfile(req.user!.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const getAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getAdminProfile(req.user!.id);

  res.status(200).json({ success: true, data: user });
});