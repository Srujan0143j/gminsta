import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Storage Integration Active');
} else {
  console.log('Local File Storage System Active (Fallback Mode)');
}

/**
 * Uploads a local file (from Multer temp storage) to Cloudinary or keeps it locally
 * @param {Object} file - Multer file object
 * @param {string} folder - Destination folder name
 * @returns {Promise<Object>} - Contains url and public_id (or local path reference)
 */
export const uploadMedia = async (file, folder = 'gminsta') => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: 'auto',
      });
      // Delete temporary local file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
      return {
        url: result.secure_url,
        public_id: result.public_id,
        isCloud: true,
      };
    } catch (error) {
      console.error('Cloudinary upload error, falling back to local storage:', error);
      // Fallback to local
    }
  }

  // Local Storage Fallback:
  // Move file from temp upload path to public uploads path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadsDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'gminsta-uploads')
    : path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err.message);
    }
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  const destinationPath = path.join(uploadsDir, filename);

  try {
    fs.renameSync(file.path, destinationPath);
    const serverUrl = `/uploads/${filename}`;
    return {
      url: serverUrl,
      public_id: filename,
      isCloud: false,
    };
  } catch (error) {
    console.error('Local file storage failed:', error);
    throw new Error('Failed to save file locally');
  }
};

/**
 * Deletes media from Cloudinary or local storage
 * @param {string} publicId - Cloudinary public_id or local filename
 * @param {boolean} isCloud - Whether the media is stored on Cloudinary
 */
export const deleteMedia = async (publicId, isCloud = false) => {
  if (!publicId) return;

  if (isCloud && isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
    }
  } else {
    // Delete local file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = process.env.VERCEL
      ? path.join(os.tmpdir(), 'gminsta-uploads')
      : path.join(__dirname, '..', 'uploads');

    const filePath = path.join(uploadsDir, publicId);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Local file deletion error:', error);
    }
  }
};
