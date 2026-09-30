import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.config.js';
import { UNKNOWN_ALBUM_NAME } from '../utils/constants.js';
import { isUuid, parseIdParam } from '../utils/validators.js';

const cleanName = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const isReservedName = (name: string): boolean =>
  name.toLowerCase() === UNKNOWN_ALBUM_NAME.toLowerCase();

// Returns a whole number, null (no age given), or 'invalid'
const parseAge = (value: unknown): number | null | 'invalid' => {
  if (value === undefined || value === null || value === '') return null;
  const age = Number(value);
  return Number.isInteger(age) && age >= 0 ? age : 'invalid';
};

// Finds another album with the same name (case-insensitive) for this user
const findDuplicateName = (profileId: string, name: string, excludeCatId?: string) =>
  prisma.cats.findFirst({
    where: {
      profile_id: profileId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeCatId ? { cat_id: { not: excludeCatId } } : {}),
    },
  });

// Creates a new album (cat) under the logged-in user's profile
export const createCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body ?? {};
    const name = cleanName(body.name);

    if (!name) {
      return res.status(400).json({ error: 'Cat name is required' });
    }

    if (isReservedName(name)) {
      return res.status(400).json({ error: `"${UNKNOWN_ALBUM_NAME}" is a reserved album name` });
    }

    const age = parseAge(body.age);
    if (age === 'invalid') {
      return res.status(400).json({ error: 'Age must be a whole number' });
    }

    if (await findDuplicateName(req.profileId, name)) {
      return res.status(409).json({ error: 'You already have an album with this name' });
    }

    const cat = await prisma.cats.create({
      data: {
        profile_id: req.profileId,
        name,
        breed: body.breed ?? null,
        sex: body.sex ?? null,
        age,
        description: body.description ?? null,
      },
    });

    res.status(201).json({ cat });
  } catch (error) {
    console.error('Create cat error:', error);
    res.status(500).json({ error: 'Failed to create cat' });
  }
};

// Returns all of the user's albums with photos and detections
// Optional filter: ?name=...
export const getMyCats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const name = cleanName(req.query.name);

    const cats = await prisma.cats.findMany({
      where: {
        profile_id: req.profileId,
        ...(name ? { name: { equals: name, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        cat_images: true,
        emotion_detections: {
          include: { emotion_categories: true },
        },
      },
    });

    res.json({ cats });
  } catch (error) {
    console.error('Get cats error:', error);
    res.status(500).json({ error: 'Failed to fetch cats' });
  }
};

// Returns one album by name (works for "Unknown Cats" too)
export const getCatByName = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const name = cleanName(req.params.name);

    if (!name) {
      return res.status(400).json({ error: 'Album name is required' });
    }

    const cat = await prisma.cats.findFirst({
      where: {
        profile_id: req.profileId,
        name: { equals: name, mode: 'insensitive' },
      },
      include: {
        cat_images: true,
        emotion_detections: {
          include: { emotion_categories: true },
        },
      },
    });

    if (!cat) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json({ cat });
  } catch (error) {
    console.error('Get cat by name error:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
};

// Returns the detection history for one album
export const getCatDetections = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const catId = parseIdParam(req.params.catId);
    if (!catId) {
      return res.status(400).json({ error: 'Invalid cat ID' });
    }

    const cat = await prisma.cats.findFirst({
      where: { cat_id: catId, profile_id: req.profileId },
    });

    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    const detections = await prisma.emotion_detections.findMany({
      where: { cat_id: catId },
      orderBy: { detected_at: 'desc' },
      include: {
        cat_images: true,
        emotion_categories: true,
      },
    });

    res.json({ detections });
  } catch (error) {
    console.error('Get cat detections error:', error);
    res.status(500).json({ error: 'Failed to fetch detection history' });
  }
};

// Updates an album's details. Only the fields you send are changed.
export const updateCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const catId = parseIdParam(req.params.catId);
    if (!catId) {
      return res.status(400).json({ error: 'Invalid cat ID' });
    }

    const existingCat = await prisma.cats.findFirst({
      where: { cat_id: catId, profile_id: req.profileId },
    });

    if (!existingCat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    const body = req.body ?? {};

    let name: string | undefined;
    if (body.name !== undefined) {
      if (existingCat.name === UNKNOWN_ALBUM_NAME) {
        return res.status(400).json({ error: `The "${UNKNOWN_ALBUM_NAME}" album can't be renamed` });
      }

      name = cleanName(body.name);
      if (!name) {
        return res.status(400).json({ error: 'Cat name cannot be empty' });
      }
      if (isReservedName(name)) {
        return res.status(400).json({ error: `"${UNKNOWN_ALBUM_NAME}" is a reserved album name` });
      }
      if (await findDuplicateName(req.profileId, name, catId)) {
        return res.status(409).json({ error: 'You already have an album with this name' });
      }
    }

    let age: number | null | undefined;
    if (body.age !== undefined) {
      const parsedAge = parseAge(body.age);
      if (parsedAge === 'invalid') {
        return res.status(400).json({ error: 'Age must be a whole number' });
      }
      age = parsedAge;
    }

    const updatedCat = await prisma.cats.update({
      where: { cat_id: catId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(body.breed !== undefined ? { breed: body.breed } : {}),
        ...(body.sex !== undefined ? { sex: body.sex } : {}),
        ...(age !== undefined ? { age } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.profile_image_url !== undefined
          ? { profile_image_url: body.profile_image_url }
          : {}),
      },
    });

    res.json({ cat: updatedCat });
  } catch (error) {
    console.error('Update cat error:', error);
    res.status(500).json({ error: 'Failed to update cat' });
  }
};

// Deletes an album. Its photos and detections are removed by the schema's cascade.
export const deleteCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const catId = parseIdParam(req.params.catId);
    if (!catId) {
      return res.status(400).json({ error: 'Invalid cat ID' });
    }

    const existingCat = await prisma.cats.findFirst({
      where: { cat_id: catId, profile_id: req.profileId },
    });

    if (!existingCat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    await prisma.cats.delete({ where: { cat_id: catId } });

    res.json({ message: 'Cat deleted successfully' });
  } catch (error) {
    console.error('Delete cat error:', error);
    res.status(500).json({ error: 'Failed to delete cat' });
  }
};

// Moves a photo (and its detection) from one album to another
export const moveImageToCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const imageId = parseIdParam(req.params.imageId);
    if (!imageId) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    const targetCatId = (req.body ?? {}).catId;
    if (!isUuid(targetCatId)) {
      return res.status(400).json({ error: 'A valid target catId is required' });
    }

    // The photo must be in one of the logged-in user's albums
    const image = await prisma.cat_images.findFirst({
      where: { image_id: imageId, cats: { profile_id: req.profileId } },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.cat_id === targetCatId) {
      return res.status(400).json({ error: 'Image is already in this album' });
    }

    // The target album must also belong to the logged-in user
    const targetCat = await prisma.cats.findFirst({
      where: { cat_id: targetCatId, profile_id: req.profileId },
    });

    if (!targetCat) {
      return res.status(404).json({ error: 'Target album not found' });
    }

    // Move the photo and its detection together so they never get out of sync
    const [updatedImage] = await prisma.$transaction([
      prisma.cat_images.update({
        where: { image_id: imageId },
        data: { cat_id: targetCatId },
      }),
      prisma.emotion_detections.updateMany({
        where: { image_id: imageId },
        data: { cat_id: targetCatId },
      }),
    ]);

    res.json({ image: updatedImage });
  } catch (error) {
    console.error('Move image error:', error);
    res.status(500).json({ error: 'Failed to move image' });
  }
};

// Deletes a single photo from an album
export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const imageId = parseIdParam(req.params.imageId);
    if (!imageId) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    const image = await prisma.cat_images.findFirst({
      where: { image_id: imageId, cats: { profile_id: req.profileId } },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete the detection first, since the schema has no cascade
    // from cat_images to emotion_detections
    await prisma.$transaction([
      prisma.emotion_detections.deleteMany({ where: { image_id: imageId } }),
      prisma.cat_images.delete({ where: { image_id: imageId } }),
    ]);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};