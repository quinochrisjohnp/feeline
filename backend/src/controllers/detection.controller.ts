import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { uploadImageToCloudinary } from '../services/cloudinary.service.js';
import { UNKNOWN_ALBUM_NAME } from '../utils/constants.js';
import { isUuid } from '../utils/validators.js';
import prisma from '../config/db.config.js';

export const detectEmotion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { catId } = req.body;
    if (catId !== undefined && catId !== '' && !isUuid(catId)) {
      return res.status(400).json({ error: 'Invalid catId' });
    }

    let targetCatId: string;

    if (catId) {
      const cat = await prisma.cats.findFirst({
        where: { cat_id: catId, profile_id: req.profileId },
      });

      if (!cat) {
        return res.status(404).json({ error: 'Cat not found' });
      }

      targetCatId = cat.cat_id;
    } else {
      // Find or create ONE shared "Unknown Cats" bucket for this user,
      // instead of creating a new one every time
      let unknownCat = await prisma.cats.findFirst({
        where: { profile_id: req.profileId, name: 'Unknown Cats' },
      });

      if (!unknownCat) {
        unknownCat = await prisma.cats.create({
          data: {
            profile_id: req.profileId,
            name: 'Unknown Cats',
          },
        });
      }

      targetCatId = unknownCat.cat_id;
    }

    // Upload the image to Cloudinary
    const imageUrl = await uploadImageToCloudinary(
      req.file.buffer,
      `feeline/${req.profileId}`
    );

    // TODO: Call the teammate's Python/FastAPI AI service here.
    const detectionResult = {
      emotion: 'Angry',
      confidence: 0.9,
      recommendations: [
        'Avoid physical interaction for now, as your cat may react defensively.',
        'Give your cat space and allow them time to calm down.',
        'Identify and remove possible triggers such as loud noise, sudden movements, or overstimulation.',
      ],
    };

    // Find or create the matching emotion category
    let emotionCategory = await prisma.emotion_categories.findUnique({
      where: { emotion_name: detectionResult.emotion },
    });

    if (!emotionCategory) {
      emotionCategory = await prisma.emotion_categories.create({
        data: { emotion_name: detectionResult.emotion },
      });
    }

    // Save the image record
    const catImage = await prisma.cat_images.create({
      data: {
        cat_id: targetCatId,
        image_url: imageUrl,
      },
    });

    // Save the detection record
    const detection = await prisma.emotion_detections.create({
      data: {
        cat_id: targetCatId,
        image_id: catImage.image_id,
        emotion_id: emotionCategory.emotion_id,
        confidence_score: detectionResult.confidence,
      },
    });

    res.status(201).json({
      catId: targetCatId,
      imageUrl,
      emotion: detectionResult.emotion,
      confidence: detectionResult.confidence,
      recommendations: detectionResult.recommendations,
      detectionId: detection.detection_id,
    });
  } catch (error) {
    console.error('Emotion detection error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
};