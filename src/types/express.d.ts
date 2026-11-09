declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: string;
      type?: 'candidate' | 'user';
    };
  }
}