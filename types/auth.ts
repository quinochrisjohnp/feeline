export interface FeelineProfile {
  profileId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  profile: FeelineProfile;
}