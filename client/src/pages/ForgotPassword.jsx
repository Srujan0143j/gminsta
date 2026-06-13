import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/forgotpassword', { email: data.email });
      if (res.data.success) {
        setMessage(
          'A password reset link has been dispatched to your email. (Note: Since we are in development mode, please also check your Node server console log for the reset link.)'
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request reset. Verify your email.');
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
            <Mail size={22} />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Trouble Logging In?</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 px-4">
            Enter your email address and we'll send you a link to get back into your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center font-medium">
            {error}
          </div>
        )}

        {message ? (
          <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs p-4 rounded-xl border border-green-100 dark:border-green-900/30 space-y-3">
            <p className="font-medium text-center">{message}</p>
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-bold text-instagram-blue hover:text-instagram-darkBlue">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email Address"
                {...register('email', {
                  required: 'Email address is required',
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <span>Send Login Link</span>
              )}
            </button>
          </form>
        )}

        {!message && (
          <div className="text-center border-t border-premium-lightBorder dark:border-premium-darkBorder pt-4">
            <Link to="/login" className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition">
              Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
