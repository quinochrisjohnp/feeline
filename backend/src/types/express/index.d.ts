import "express";

declare global {
  namespace Express {
    interface Request {
      profileId?: string;
    }
  }
}

export {};