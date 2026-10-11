import cloudinary from "../config/cloudinary.config.js";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

// Upload image to Cloudinary and return BOTH:
// - URL for storing/displaying
// - publicId for cleanup if the DB operation fails
export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,

          transformation: [
            {
              width: 1000,
              crop: "limit",
            },
            {
              quality: "auto:good",
            },
            {
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error ??
                new Error(
                  "Cloudinary upload failed"
                )
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

    uploadStream.end(
      fileBuffer
    );
  });
};

// Delete an uploaded image.
//
// Used when Cloudinary succeeds but the database operation
// afterward fails.
export const deleteImageFromCloudinary = async (
  publicId: string
): Promise<void> => {
  await cloudinary.uploader.destroy(
    publicId,
    {
      resource_type: "image",
    }
  );
};