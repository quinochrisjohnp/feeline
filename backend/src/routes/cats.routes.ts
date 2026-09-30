import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createCat,
  getMyCats,
  getCatByName,
  getCatDetections,
  updateCat,
  deleteCat,
  moveImageToCat,
  deleteImage,
} from '../controllers/cats.controller.js';

const router = Router();

router.post('/', authenticate, createCat);
router.get('/', authenticate, getMyCats);
router.get('/by-name/:name', authenticate, getCatByName);
router.patch('/images/:imageId/move', authenticate, moveImageToCat);
router.delete('/images/:imageId', authenticate, deleteImage);
router.put('/:catId', authenticate, updateCat);
router.delete('/:catId', authenticate, deleteCat);
router.get('/:catId/detections', authenticate, getCatDetections);

export default router;