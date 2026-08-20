import type { NextFunction, Request, Response } from "express";
import { verifyFeelineToken } from "./jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Not authenticated." });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyFeelineToken(token);
    req.profileId = payload.profileId;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired session." });
  }
}