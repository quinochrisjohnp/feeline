import { OAuth2Client } from "google-auth-library";
import { env } from "../env";

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const client = new OAuth2Client();

export async function verifyGoogleIdToken(
  idToken: string
): Promise<VerifiedGoogleUser> {
  const audience = env.googleClientIds();

  const ticket = await client.verifyIdToken({
    idToken,
    audience,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token payload.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    firstName: payload.given_name ?? null,
    lastName: payload.family_name ?? null,
    profileImageUrl: payload.picture ?? null,
  };
}