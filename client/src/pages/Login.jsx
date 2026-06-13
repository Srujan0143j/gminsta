import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    const result = await login(data.emailOrUsername, data.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setAuthError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-lightBg dark:bg-premium-darkBg px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-premium-darkCard border border-premium-lightBorder dark:border-premium-darkBorder rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="font-extrabold text-4xl tracking-wide bg-gradient-to-r from-instagram-gradientStart via-instagram-gradientMiddle to-instagram-gradientEnd bg-clip-text text-transparent font-sans">
            GMinsta
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Welcome back! Please login to your account.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-950/20 text-instagram-red text-xs p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center font-medium">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Username or Email"
              {...register('emailOrUsername', { required: 'Username or email is required' })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.emailOrUsername && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.emailOrUsername.message}</span>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="password"
              placeholder="Password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-3 rounded-xl border border-premium-lightBorder dark:border-premium-darkBorder bg-neutral-50 dark:bg-premium-darkBg text-sm focus:outline-none focus:ring-2 focus:ring-instagram-blue transition"
            />
            {errors.password && (
              <span className="text-[10px] text-instagram-red px-1 font-medium">{errors.password.message}</span>
            )}
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 text-neutral-500 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-instagram-blue border-premium-lightBorder dark:border-premium-darkBorder"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-instagram-blue hover:text-instagram-darkBlue font-semibold transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-instagram-blue hover:bg-instagram-darkBlue disabled:bg-neutral-300 dark:disabled:bg-premium-darkBorder text-white rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-instagram-blue/20"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Log In</span>
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
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-instagram-blue hover:text-instagram-darkBlue font-semibold transition"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
