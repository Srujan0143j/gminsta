import React, { useState } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Key } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useHookForm();
  const { token } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await api.put(`/auth/resetpassword/${token}`, { password: data.password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset token is invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-lightBg dark:bg-premium-darkBg px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full border-2 border-premium-lightBorder dark:border-premium-darkBorder flex items-center justify-center text-neutral-500 dark:text-neutral-300">
            <Key size={22} />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Create New Password</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs p-4 rounded-xl border border-green-100 dark:border-green-900/30 text-center font-medium space-y-2">
            <p>Password reset successful!</p>
            <p className="text-[10px] text-neutral-400">Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                placeholder="New Password"
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

            <div className="space-y-1">
              <input
                type="password"
                placeholder="Confirm New Password"
                {...register('confirmPassword', {
                  required: 'Confirm password is required',
                  validate: (val) => {
                    if (watch('password') !== val) {
                      return 'Passwords do not match';
                    }
                  },
                })}
                className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
              />
              {errors.confirmPassword && (
                <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
