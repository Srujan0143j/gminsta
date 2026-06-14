import axios from 'axios';
import api from './api';

/**
 * Uploads a file directly from the browser to Cloudinary using a secure signature from the backend.
 * Falls back to throwing an error if Cloudinary is not configured or fails.
 * 
 * @param {File} file - Browser File object
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadToCloudinary = async (file, folder = 'gminsta') => {
  // 1. Fetch secure signature and parameters from the backend
  const sigRes = await api.get(`/upload/signature?folder=${folder}`);
  if (!sigRes.data.success) {
    throw new Error(sigRes.data.error || 'Failed to generate secure upload signature.');
  }

  const { signature, timestamp, cloudName, apiKey } = sigRes.data;

  // 2. Build direct Cloudinary upload payload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const fileType = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'video' : 'image';

  // 3. Post directly to Cloudinary's API endpoints
  const uploadResponse = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/${fileType}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return {
    url: uploadResponse.data.secure_url,
    public_id: uploadResponse.data.public_id,
  };
};
