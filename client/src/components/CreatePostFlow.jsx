import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image, Video, MapPin, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';

const CreatePostFlow = ({ onSuccess }) => {
  const { register, handleSubmit, reset } = useForm();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Handle files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError('');
    
    // Validate count (max 10)
    if (mediaFiles.length + files.length > 10) {
      setError('You can upload a maximum of 10 images/videos.');
      return;
    }

    const newFiles = [];
    const newPreviews = [];
    const maxSize = 50 * 1024 * 1024; // 50MB limit

    files.forEach((file) => {
      // Validate file size
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds the 50MB upload limit.`);
        return;
      }

      newFiles.push(file);
      const isVideo = file.type.startsWith('video');
      newPreviews.push({
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    });

    setMediaFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove preview
  const removeFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (mediaFiles.length === 0 && !data.isDraft) {
      setError('Please upload at least one image or video.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      let uploadedMedia = [];
      let uploadFailed = false;

      // 1. Attempt to upload all files to Cloudinary from client side
      try {
        for (const file of mediaFiles) {
          const isVideo = file.type.startsWith('video');
          const folder = isVideo ? 'gminsta/videos' : 'gminsta/posts';
          const result = await uploadToCloudinary(file, folder);
          uploadedMedia.push({
            url: result.url,
            public_id: result.public_id,
            type: isVideo ? 'video' : 'image',
          });
        }
      } catch (cloudinaryErr) {
        console.warn('Direct Cloudinary upload failed, falling back to server-side upload:', cloudinaryErr.message);
        uploadFailed = true;
      }

      let res;
      if (!uploadFailed && uploadedMedia.length === mediaFiles.length) {
        // Send JSON payload with media array
        res = await api.post('/posts', {
          caption: data.caption || '',
          location: data.location || '',
          isDraft: data.isDraft || false,
          media: uploadedMedia,
        });
      } else {
        // Fallback: send standard multipart/form-data payload to backend
        const formData = new FormData();
        formData.append('caption', data.caption || '');
        formData.append('location', data.location || '');
        formData.append('isDraft', data.isDraft || false);

        mediaFiles.forEach((file) => {
          formData.append('media', file);
        });

        res = await api.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (res.data.success) {
        reset();
        setMediaFiles([]);
        setPreviews([]);
        if (onSuccess) onSuccess(res.data.post);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      {/* Previews and file selector zone */}
      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-premium-lightBorder dark:border-premium-darkBorder rounded-xl">
          {previews.map((prev, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-black">
              {prev.type === 'video' ? (
                <video src={prev.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={prev.url} alt="preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add more grid square */}
          {previews.length < 10 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-premium-lightBorder dark:border-premium-darkBorder rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-premium-darkCard transition aspect-square">
              <PlusIcon className="w-6 h-6 text-neutral-400" />
              <span className="text-[10px] text-neutral-400 mt-1">Add More</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-premium-lightBorder dark:border-premium-darkBorder rounded-xl p-8 text-center flex flex-col items-center justify-center hover:bg-neutral-50 dark:hover:bg-premium-darkCard/30 transition duration-300">
          <div className="flex space-x-2 mb-3 text-neutral-400">
            <Image size={36} />
            <Video size={36} />
          </div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
            Drag and drop media files
          </p>
          <p className="text-xs text-neutral-400 mb-4">
            PNG, JPEG, GIF, MP4 (Max 50MB per file)
          </p>
          <label className="px-4 py-2 bg-instagram-blue text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-instagram-darkBlue transition shadow-sm">
            Select files from device
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Caption Textarea */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Caption</label>
        <textarea
          placeholder="Write a caption... Use #hashtags and mention friends @username"
          {...register('caption')}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
        />
      </div>

      {/* Location Input */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Location</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Add location"
            {...register('location')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-premium-darkBorder pt-4">
        {/* Draft toggle option */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isDraft')}
            className="rounded text-instagram-blue focus:ring-instagram-blue border-premium-lightBorder dark:border-premium-darkBorder"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Save as draft</span>
        </label>

        <button
          type="submit"
          disabled={isUploading}
          className="px-5 py-2.5 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <span>Share Post</span>
          )}
        </button>
      </div>
    </form>
  );
};

const PlusIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default CreatePostFlow;
