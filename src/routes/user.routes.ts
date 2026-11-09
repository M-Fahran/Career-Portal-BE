import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateAdminProfileSchema } from '../validators/auth.validator';
import { adminJobQuerySchema } from '../validators/job.validator';
import { createDepartmentSchema, createUserSchema, updateUserSchema,} from '../validators/user.validator';
import { createJobSchema, updateJobSchema, jobStatusSchema } from '../validators/job.validator';
import { applicantQuerySchema, changeStatusSchema } from '../validators/application.validator';
import * as jobController from '../controllers/job.controller';
import * as applicationController from '../controllers/application.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as authController from '../controllers/auth.controller';
import * as userController from '../controllers/user.controller';
import * as notificationController from '../controllers/notification.controller';
import { notificationListQuerySchema } from '../validators/notification.validator';

const router = Router();

router.use(authenticate, authorize('user'));

router.get('/notifications/unread-count', notificationController.unreadCount);
router.get('/notifications', validate(notificationListQuerySchema, 'query'), notificationController.list);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.put('/notifications/:id/read', notificationController.markAsRead);

router.get('/jobs', validate(adminJobQuerySchema, 'query'), jobController.listAdmin);
router.get('/jobs/:id', jobController.detailAdmin);
router.post('/jobs', validate(createJobSchema), jobController.create);
router.put('/jobs/:id', validate(updateJobSchema), jobController.update);
router.delete('/jobs/:id', jobController.remove);
router.put('/jobs/:id/status', validate(jobStatusSchema), jobController.changeStatus);
router.get('/jobs/:id/applicants', validate(applicantQuerySchema, 'query'), applicationController.applicants);

router.get('/applications', validate(applicantQuerySchema, 'query'), applicationController.allApplicants);
router.get('/applications/:id', applicationController.applicantDetail);
router.get('/applications/:id/resume', applicationController.downloadResume);
router.put('/applications/:id/status', validate(changeStatusSchema), applicationController.changeStatus);

router.get('/departments', userController.listDepartments);
router.post('/departments', validate(createDepartmentSchema), userController.createDepartment);
router.delete('/departments/:id', userController.deleteDepartment);

router.post('/users', validate(createUserSchema), userController.create);
router.get('/users', userController.list);
router.put('/users/:id', validate(updateUserSchema), userController.update);

router.put('/profile', validate(updateAdminProfileSchema), authController.updateAdminProfile);
router.get('/profile', authController.getAdminProfile);


router.get('/dashboard/stats', dashboardController.stats);

export default router;