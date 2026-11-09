import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
} from '../validators/auth.validator';
import * as authController from '../controllers/auth.controller';
import { changePasswordSchema } from '../validators/candidate.validator';
import * as candidateController from '../controllers/candidate.controller';

const router = Router();
// candidate
router.post('/candidate/register', validate(registerSchema), authController.register);
router.post('/candidate/login', validate(loginSchema), authController.login);

// user
router.post('/user/login', validate(loginSchema), authController.loginUser);

// user-candidate
router.post('/logout', authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), candidateController.changePassword);

router.post('/candidate/refresh', authController.refreshCandidateToken);
router.post('/user/refresh', authController.refreshUserToken);
export default router;