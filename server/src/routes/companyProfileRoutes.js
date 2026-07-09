import express from 'express';
import { getCompanyProfile, updateCompanyProfile } from '../controller/companyProfileController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// ============ COMPANY PROFILE ROUTES ============

// GET  /api/company-profile  — fetch active profile (auto-seeds default)
router.get('/', getCompanyProfile);

// PUT  /api/company-profile  — upsert active profile
router.put('/', updateCompanyProfile);

export default router;
