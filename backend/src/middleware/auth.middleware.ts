import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import jwt from 'jsonwebtoken';

// Custom Express Request type so controllers
// can access profileId after authentication.
export interface AuthRequest extends Request {
  profileId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // ==========================================================
  // CHECK AUTHORIZATION HEADER
  // ==========================================================

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      error: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
    });
  }

  // ==========================================================
  // CHECK JWT SECRET
  // ==========================================================

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error(
      'JWT_SECRET is not configured'
    );

    return res.status(500).json({
      error: 'Server configuration error',
    });
  }

  // ==========================================================
  // VERIFY TOKEN
  // ==========================================================

  try {
    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    // jwt.verify() can technically return a string.
    // We need an object containing profileId.
    if (
      typeof decoded === 'string' ||
      !decoded.profileId ||
      typeof decoded.profileId !== 'string'
    ) {
      return res.status(401).json({
        error: 'Invalid token payload',
      });
    }

    // Make profileId available to the next middleware/controller.
    req.profileId = decoded.profileId;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};