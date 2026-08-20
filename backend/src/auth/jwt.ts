import jwt from "jsonwebtoken";
import { env } from "../env";

export interface FeelineTokenPayload {
  profileId: string;
}

const TOKEN_EXPIRY = "30d";

export function signFeelineToken(payload: FeelineTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifyFeelineToken(token: string): FeelineTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret());

  if (
    typeof decoded === "string" ||
    typeof (decoded as any).profileId !== "string"
  ) {
    throw new Error("Invalid token payload.");
  }

  return { profileId: (decoded as any).profileId };
}