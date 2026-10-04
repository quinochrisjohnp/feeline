import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

import {
  createCat,
  getMyCats,
  getCatDetections,
  updateCat,
  deleteCat,
} from '../controllers/cats.controller.js';

const router = Router();

router.post('/', authenticate, createCat);

router.get('/', authenticate, getMyCats);

router.put(
  '/:catId',
  authenticate,
  upload.single('profile_image'),
  updateCat
);

router.delete('/:catId', authenticate, deleteCat);

router.get(
  '/:catId/detections',
  authenticate,
  getCatDetections
);

export default router;