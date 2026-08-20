function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  jwtSecret: () => required("JWT_SECRET"),
  googleClientIds: () => {
    const ids = [
      process.env.GOOGLE_CLIENT_ID_WEB,
      process.env.GOOGLE_CLIENT_ID_IOS,
      process.env.GOOGLE_CLIENT_ID_ANDROID,
    ].filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      throw new Error(
        "No Google client IDs configured. Set at least one of GOOGLE_CLIENT_ID_WEB, GOOGLE_CLIENT_ID_IOS, GOOGLE_CLIENT_ID_ANDROID."
      );
    }

    return ids;
  },
};