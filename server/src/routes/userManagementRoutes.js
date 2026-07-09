import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, createUser, updateUser, toggleUserActive, deleteUser, resetPassword } from '../controller/userManagementController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/',                       getUsers);
router.post('/',                      createUser);
router.put('/:id',                    updateUser);
router.patch('/:id/toggle-active',    toggleUserActive);
router.patch('/:id/reset-password',   resetPassword);
router.delete('/:id',                 deleteUser);

export default router;
