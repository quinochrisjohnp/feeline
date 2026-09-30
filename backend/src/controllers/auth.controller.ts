import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.config.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Find existing profile or create a new one
    let profile = await prisma.profiles.findUnique({
      where: { google_id: googleId },
    });

    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          google_id: googleId,
          email,
          first_name: given_name ?? null,
          last_name: family_name ?? null,
          profile_image_url: picture ?? null,
        },
      });
    }

    // Generate backend JWT token
    const token = jwt.sign(
      { profileId: profile.profile_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      profile: {
        id: profile.profile_id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
};