import React, { useState, useEffect } from 'react';
import { Film, Plus, Loader2 } from 'lucide-react';
import api from '../services/api';
import ReelCard from '../components/ReelCard';
import Modal from '../components/Modal';

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  // Create Reels states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchReels = async () => {
    try {
      const res = await api.get('/reels');
      if (res.data.success) {
        setReels(res.data.reels);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleUploadReel = async (e) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', caption);

    try {
      const res = await api.post('/reels', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setIsCreateOpen(false);
        setVideoFile(null);
        setVideoPreview(null);
        setCaption('');
        fetchReels(); // Reload reels list
      }
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload reel.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-4">
      {/* Header bar containing upload trigger */}
      <div className="w-full max-w-[360px] flex justify-between items-center mb-4 px-2">
        <div className="flex items-center space-x-1.5 text-neutral-800 dark:text-white font-extrabold text-lg">
          <Film size={20} className="text-instagram-blue" />
          <span>Reels</span>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-instagram-blue hover:bg-instagram-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-sm"
        >
          <Plus size={14} />
          <span>Create Reel</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 size={36} className="animate-spin text-neutral-400" />
        </div>
      ) : (
        /* Snap-scroll container for reels */
        <div className="w-full max-w-[360px] h-[calc(100vh-180px)] overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-2xl border border-premium-lightBorder dark:border-premium-darkBorder space-y-4">
          {reels.map((reel) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              isMuted={isMuted}
              toggleMute={() => setIsMuted(!isMuted)}
            />
          ))}

          {reels.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Film size={48} className="text-neutral-300 mb-4" />
              <p className="font-bold text-sm">No reels yet</p>
              <p className="text-xs text-neutral-400 mt-1">Be the first to share a reel video!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Reel Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Upload Reel">
        <form onSubmit={handleUploadReel} className="space-y-4">
          {uploadError && (
            <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30">
              {uploadError}
            </div>
          )}

          {videoPreview ? (
            <div className="relative aspect-[9/16] max-h-60 rounded-xl overflow-hidden bg-black mx-auto">
              <video src={videoPreview} className="w-full h-full object-contain" controls />
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-premium-lightBorder dark:border-premium-darkBorder rounded-xl p-8 text-center flex flex-col items-center justify-center hover:bg-neutral-50 dark:hover:bg-premium-darkCard/30 transition">
              <Film size={36} className="text-neutral-400 mb-3" />
              <p className="text-xs text-neutral-400 mb-4">Select short video (MP4/MOV up to 50MB)</p>
              <label className="px-4 py-2 bg-instagram-blue text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-instagram-darkBlue transition shadow-sm">
                Choose Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Caption</label>
            <textarea
              placeholder="Add reel caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkCard text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !videoFile}
            className="w-full py-3 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading Reel...</span>
              </>
            ) : (
              <span>Share Reel</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Reels;
