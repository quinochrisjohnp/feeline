import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Returns JSON instead of Express's default HTML "Cannot GET ..." page
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Catches errors thrown by middleware (multer, JSON parsing, etc.) and returns JSON
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB)' : err.message;
    return res.status(400).json({ error: message });
  }

  if (err instanceof Error && err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
};