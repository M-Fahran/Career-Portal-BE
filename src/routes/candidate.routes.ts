import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { applySchema } from '../validators/application.validator';
import { requireOnboarded } from '../middlewares/onboarded.middleware';
import { uploadResume, uploadPhoto, uploadOnboarding } from '../middlewares/upload.middleware';
import { updateProfileSchema, createCertificateSchema, updateCertificateSchema, createExperienceSchema, updateExperienceSchema, onboardingSchema } from '../validators/candidate.validator';
import { jobQuerySchema } from '../validators/job.validator';
import * as applicationController from '../controllers/application.controller';
import * as candidateController from '../controllers/candidate.controller';
import * as jobController from '../controllers/job.controller';


const router = Router();

router.use(authenticate, authorize('candidate'));

router.put('/onboarding', uploadOnboarding, validate(onboardingSchema), candidateController.completeOnboarding);
router.get('/applications', requireOnboarded, applicationController.myApplications);
router.post('/apply/:id', authenticate, authorize('candidate'), uploadResume, validate(applySchema), applicationController.apply)
router.post('/photo', uploadPhoto, candidateController.uploadPhoto)

router.get('/profile', candidateController.getProfile);
router.put('/profile', validate(updateProfileSchema), candidateController.updateProfile);
router.get('/saved-jobs', candidateController.getSavedJobs);
router.post('/saved-jobs/:jobId', candidateController.saveJob);
router.delete('/saved-jobs/:jobId', candidateController.removeSavedJob);

router.get('/jobs', requireOnboarded, validate(jobQuerySchema, 'query'), jobController.listCandidate);
router.get('/jobs/:id', requireOnboarded, jobController.detailCandidate);
router.post('/jobs/:id/apply', requireOnboarded, uploadResume, validate(applySchema), applicationController.apply);

router.post('/resumes', uploadResume, candidateController.addResume);
router.put('/resumes/:id/primary', candidateController.setPrimaryResume);
router.get('/resumes/:id/file', candidateController.downloadResume);
router.delete('/resumes/:id', candidateController.removeResume);

router.post('/certificates', validate(createCertificateSchema), candidateController.addCertificate)
router.get('/certificates', candidateController.getCertificates);
router.put('/certificates/:id', validate(updateCertificateSchema), candidateController.updateCertificate);
router.delete('/certificates/:id', candidateController.deleteCertificate);

router.post('/experiences', validate(createExperienceSchema), candidateController.addExperience)
router.get('/experiences', candidateController.getExperiences);
router.put('/experiences/:id', validate(updateExperienceSchema) ,candidateController.updateExperience);
router.delete('/experiences/:id', candidateController.deleteExperience);

export default router;