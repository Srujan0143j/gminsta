import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Loader2, User, Key, Shield, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  
  // Forms setup
  const { register: profileRegister, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      fullname: user?.fullname || '',
      bio: user?.bio || '',
      website: user?.website || '',
      gender: user?.gender || 'prefer-not-to-say',
      isPrivate: user?.isPrivate || false,
    },
  });

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm();

  // Loaders & Alerts
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password'
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Profile picture upload states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePic || '/uploads/default-avatar.png');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError('');

    const formData = new FormData();
    formData.append('fullname', data.fullname);
    formData.append('bio', data.bio);
    formData.append('website', data.website);
    formData.append('gender', data.gender);
    formData.append('isPrivate', data.isPrivate);
    
    if (avatarFile) {
      formData.append('profilePic', avatarFile);
    }

    try {
      const res = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess(true);
        setAvatarFile(null);
      }
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setPasswordLoading(true);
    setPasswordSuccess(false);
    setPasswordError('');

    try {
      const res = await api.put('/auth/changepassword', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (res.data.success) {
        setPasswordSuccess(true);
        resetPasswordForm();
      }
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
      
      {/* Settings Navigation Sidebar */}
      <div className="md:col-span-1 space-y-1.5">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 px-2">Settings</h2>
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'profile'
              ? 'bg-neutral-100 dark:bg-premium-darkCard text-instagram-blue'
              : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-premium-darkCard hover:text-neutral-700 dark:hover:text-white'
          }`}
        >
          <User size={14} />
          <span>Edit Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === 'password'
              ? 'bg-neutral-100 dark:bg-premium-darkCard text-instagram-blue'
              : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-premium-darkCard hover:text-neutral-700 dark:hover:text-white'
          }`}
        >
          <Key size={14} />
          <span>Change Password</span>
        </button>
      </div>

      {/* Main Settings Details Content Pane */}
      <div className="md:col-span-3 border border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkCard rounded-2xl p-6 shadow-sm">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Edit Profile Details</h3>
            
            {profileSuccess && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs p-3 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center space-x-2 font-medium">
                <CheckCircle size={14} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                {profileError}
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex items-center space-x-4 border-b border-neutral-50 dark:border-premium-darkBorder pb-4">
              <img
                src={avatarPreview}
                alt="Profile Preview"
                className="w-16 h-16 rounded-full object-cover border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50"
              />
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100">@{user?.username}</span>
                <label className="block text-[11px] text-instagram-blue font-semibold cursor-pointer hover:text-instagram-darkBlue transition">
                  Change profile photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Fullname */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Full Name</label>
              <input
                type="text"
                {...profileRegister('fullname')}
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
            </div>

            {/* Website */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Website</label>
              <input
                type="text"
                {...profileRegister('website')}
                placeholder="website.com"
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Bio</label>
              <textarea
                {...profileRegister('bio')}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Gender</label>
              <select
                {...profileRegister('gender')}
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue text-neutral-800 dark:text-neutral-100 transition"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Privacy toggle */}
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-premium-darkBg rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder">
              <Shield className="text-instagram-blue" size={20} />
              <div className="flex-1 space-y-0.5">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 block">Private Account</span>
                <span className="text-[10px] text-neutral-400 block">Only approved followers can view your content.</span>
              </div>
              <input
                type="checkbox"
                {...profileRegister('isPrivate')}
                className="rounded text-instagram-blue focus:ring-instagram-blue border-premium-lightBorder dark:border-premium-darkBorder"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2"
            >
              {profileLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Change Password</h3>

            {passwordSuccess && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs p-3 rounded-xl border border-green-100 dark:border-green-900/30 flex items-center space-x-2 font-medium">
                <CheckCircle size={14} />
                <span>Password updated successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                {passwordError}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Current Password</label>
              <input
                type="password"
                {...passwordRegister('currentPassword', { required: 'Current password is required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">New Password</label>
              <input
                type="password"
                {...passwordRegister('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="w-full px-4 py-2.5 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
              {passwordErrors.newPassword && (
                <span className="text-[10px] text-instagram-red px-1 font-medium">{passwordErrors.newPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2"
            >
              {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Update Password</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default Settings;
