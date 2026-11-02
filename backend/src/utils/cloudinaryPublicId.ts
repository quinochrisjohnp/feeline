
/**
 * Extracts a FeELINE legacy Cloudinary public ID.
 *
 * Example:
 * https://res.cloudinary.com/demo/image/upload/v123/
 * feeline/cats/example.jpg
 *
 * Returns:
 * feeline/cats/example
 *
 * Only accepts URLs from the configured Cloudinary account.
 */

export function getLegacyCloudinaryPublicId(
  imageUrl: string
): string | null {
  try {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      return null;
    }

    const url = new URL(imageUrl);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com"
    ) {
      return null;
    }

    const uploadPrefix =
      `/${cloudName}/image/upload/`;

    if (!url.pathname.startsWith(uploadPrefix)) {
      return null;
    }

    const uploadPath =
      url.pathname.slice(uploadPrefix.length);

    const legacyMarker = "feeline/cats/";
    const markerIndex = uploadPath.indexOf(
      legacyMarker
    );

    if (markerIndex < 0) {
      return null;
    }

    // Ensure the folder starts at a path boundary.
    if (
      markerIndex > 0 &&
      uploadPath[markerIndex - 1] !== "/"
    ) {
      return null;
    }

    const resourcePath =
      uploadPath.slice(markerIndex);

    // Reject encoded paths and path traversal.
    if (
      resourcePath.includes("%") ||
      resourcePath.split("/").includes("..") ||
      resourcePath.split("/").includes(".")
    ) {
      return null;
    }

    const publicId = resourcePath.replace(
      /\.(jpg|jpeg|png|webp|gif|avif)$/i,
      ""
    );

    if (
      !/^feeline\/cats\/[A-Za-z0-9_/-]+$/.test(
        publicId
      )
    ) {
      return null;
    }

    return publicId;
  } catch {
    return null;
  }
}
