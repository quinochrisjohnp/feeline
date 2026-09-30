import cloudinary from '../config/cloudinary.config.js';

// Uploads the image buffer to Cloudinary, while automatically optimizing/
// reducing its size to help save on the free tier quota
export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  folder: string 
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        // Resize to max 1000px width (enough for mobile display)
        // "limit" crop mode = won't upscale small images, only downscales large ones
        transformation: [
          { width: 1000, crop: 'limit' },
          { quality: 'auto:good' }, // automatically optimizes quality/compression
          { fetch_format: 'auto' }, // picks the most efficient format (e.g. WebP)
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Upload failed'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};