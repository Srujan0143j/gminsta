import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Camera } from 'lucide-react';

const Register = () => {
  const { register: authRegister } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Profile picture preview state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('/uploads/default-avatar.png');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');

    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('fullname', data.fullname);
    formData.append('email', data.email);
    formData.append('password', data.password);
    
    if (avatarFile) {
      formData.append('profilePic', avatarFile);
    }

    const result = await authRegister(formData);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setAuthError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-lightBg dark:bg-premium-darkBg px-4 py-8 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="font-extrabold text-4xl tracking-wide bg-gradient-to-r from-instagram-gradientStart via-instagram-gradientMiddle to-instagram-gradientEnd bg-clip-text text-transparent font-sans animate-fade-in">
            GMinsta
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sign up to share photos, reels, and stories with friends.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center font-medium">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Avatar upload */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group">
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-100 group-hover:opacity-85 transition"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-instagram-blue hover:bg-instagram-darkBlue text-white rounded-full cursor-pointer shadow-lg transition">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[11px] text-neutral-400">Upload profile picture</span>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Username"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.username && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.username.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Full Name"
              {...register('fullname', { required: 'Full name is required' })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.fullname && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.fullname.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="email"
              placeholder="Email address"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.email && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.email.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="password"
              placeholder="Password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.password && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.password.message}</span>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-instagram-blue/20"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center space-x-2 text-xs text-neutral-400">
          <div className="h-px bg-premium-lightBorder dark:bg-premium-darkBorder flex-1" />
          <span>OR</span>
          <div className="h-px bg-premium-lightBorder dark:bg-premium-darkBorder flex-1" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-instagram-blue hover:text-instagram-darkBlue font-semibold transition"
          >
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
