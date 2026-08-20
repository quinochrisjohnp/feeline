import pool from "../database";

export interface Profile {
  profile_id: string;
  google_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function findProfileByGoogleId(
  googleId: string
): Promise<Profile | null> {
  const result = await pool.query<Profile>(
    "SELECT * FROM profiles WHERE google_id = $1",
    [googleId]
  );

  return result.rows[0] ?? null;
}

export async function findProfileById(
  profileId: string
): Promise<Profile | null> {
  const result = await pool.query<Profile>(
    "SELECT * FROM profiles WHERE profile_id = $1",
    [profileId]
  );

  return result.rows[0] ?? null;
}

export interface CreateProfileInput {
  googleId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export async function createProfile(
  input: CreateProfileInput
): Promise<Profile> {
  const result = await pool.query<Profile>(
    `INSERT INTO profiles (google_id, email, first_name, last_name, profile_image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.googleId,
      input.email,
      input.firstName,
      input.lastName,
      input.profileImageUrl,
    ]
  );

  return result.rows[0];
}