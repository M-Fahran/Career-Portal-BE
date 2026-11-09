import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env';
import { authenticate } from './middlewares/auth.middleware';
import { authorize } from './middlewares/role.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import path from 'node:path';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/user.routes';
import candidateRoutes from './routes/candidate.routes'

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  '/uploads/photos',
  express.static(path.join(process.cwd(), 'uploads', 'photos')),
);

app.get('/api', (_req, res) => {
  res.json({ message: 'API Career Portal berjalan' });
});

app.use('/api/auth', authRoutes);

app.use('/api/user', adminRoutes);

app.use('/api/candidate', candidateRoutes);



app.use(errorMiddleware);

export default app;