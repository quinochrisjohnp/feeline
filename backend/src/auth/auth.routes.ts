import { Router } from "express";
import { verifyGoogleIdToken } from "./google";
import { signFeelineToken } from "./jwt";
import {
  createProfile,
  findProfileByGoogleId,
  findProfileById,
} from "./profiles.repository";
import { requireAuth } from "./auth.middleware";

const router = Router();

router.post("/google", async (req, res) => {
  const { idToken } = req.body ?? {};

  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ success: false, message: "Missing idToken." });
    return;
  }

  try {
    const googleUser = await verifyGoogleIdToken(idToken);

    if (!googleUser.emailVerified) {
      res
        .status(401)
        .json({ success: false, message: "Google email is not verified." });
      return;
    }

    let profile = await findProfileByGoogleId(googleUser.googleId);

    if (!profile) {
      profile = await createProfile({
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profileImageUrl: googleUser.profileImageUrl,
      });
    }

    const token = signFeelineToken({ profileId: String(profile.profile_id) });

    res.json({
      success: true,
      token,
      profile: {
        profileId: profile.profile_id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res
      .status(401)
      .json({ success: false, message: "Google authentication failed." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const profile = await findProfileById(req.profileId as string);

    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found." });
      return;
    }

    res.json({
      success: true,
      profile: {
        profileId: profile.profile_id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      },
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;