import { Router } from 'express';
import upload from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { detectEmotion } from '../controllers/detection.controller.js';

const router = Router();

router.post('/', authenticate, upload.single('image'), detectEmotion);

export default router;