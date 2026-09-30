const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value);

// Express route params can be typed as string | string[] | undefined,
// so this returns a valid UUID string or null
export const parseIdParam = (value: string | string[] | undefined): string | null =>
  isUuid(value) ? value : null;