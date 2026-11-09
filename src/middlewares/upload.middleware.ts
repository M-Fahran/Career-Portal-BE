import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import AppError from '../utils/AppError';

type UploadConfig = {
  folder: string;
  field: string;
  allowedExts: string[];
  maxBytes: number;
  errorMessage: string;
};

const createUploader = ({
  folder,
  field,
  allowedExts,
  maxBytes,
  errorMessage,
}: UploadConfig) => {
  const dir = path.join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new AppError(errorMessage, 422));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxBytes },
  }).single(field);
};

export const uploadResume = createUploader({
  folder: 'resumes',
  field: 'resume',
  allowedExts: ['.pdf', '.doc', '.docx'],
  maxBytes: 5 * 1024 * 1024, // 5MB
  errorMessage: 'Format CV harus PDF, DOC, atau DOCX',
});

export const uploadPhoto = createUploader({
  folder: 'photos',
  field: 'photo',
  allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
  maxBytes: 2 * 1024 * 1024, // 2MB
  errorMessage: 'Format foto harus JPG, PNG, atau WEBP',
});

export const uploadOnboarding = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      const folder = file.fieldname === 'photo' ? 'photos' : 'resumes';
      const dir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedByField: Record<string, string[]> = {
      resume: ['.pdf', '.doc', '.docx'],
      photo: ['.jpg', '.jpeg', '.png', '.webp'],
    };

    const allowed = allowedByField[file.fieldname] ?? [];
    if (allowed.length === 0 || !allowed.includes(ext)) {
      const message =
        file.fieldname === 'photo'
          ? 'Format foto harus JPG, PNG, atau WEBP'
          : 'Format CV harus PDF, DOC, atau DOCX';
      return cb(new AppError(message, 422));
    }

    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);