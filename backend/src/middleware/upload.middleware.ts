import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max upload size (before Cloudinary compresses it)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageMimetype = file.mimetype.startsWith('image/');
    const isImageExtension = allowedExtensions.includes(ext);

    // Accept the file if EITHER the mimetype OR the extension looks like an image
    // (some clients like Postman on Windows can send incorrect mimetypes)
    if (isImageMimetype || isImageExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export default upload;