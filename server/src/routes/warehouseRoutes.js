import express from 'express';
import { getAll, create, update, remove } from '../controller/warehouseController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/',       getAll);
router.post('/',      create);
router.put('/:id',    update);
router.delete('/:id', remove);

export default router;
