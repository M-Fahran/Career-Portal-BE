import jwt from 'jsonwebtoken';
import env from '../config/env';

export type TokenType = 'candidate' | 'user';

export type TokenPayload = {
  id: string;
  role: string;
  type: TokenType;
};

export const getRefreshCookieNameByType = (type: TokenType): string => {
  return type === 'candidate' ? 'candidateRefreshToken' : 'userRefreshToken';
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const generateCandidateAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return generateAccessToken({ ...payload, type: 'candidate' });
};

export const generateUserAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return generateAccessToken({ ...payload, type: 'user' });
};

export const generateCandidateRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return generateRefreshToken({ ...payload, type: 'candidate' });
};

export const generateUserRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return generateRefreshToken({ ...payload, type: 'user' });
};