'use client';

import React, { useState } from 'react';
import { useSudokuStore } from '@/lib/sudoku-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CloudOff,
  Mail,
  Lock,
  Phone,
} from 'lucide-react';

const AuthScreen: React.FC = () => {
  const setScreen = useSudokuStore((s) => s.setScreen);
  const signIn = useSudokuStore((s) => s.signIn);
  const signUp = useSudokuStore((s) => s.signUp);
  const signInWithProvider = useSudokuStore((s) => s.signInWithProvider);
  const isAuthLoading = useSudokuStore((s) => s.isAuthLoading);

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  const handleSignIn = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    try {
      await signIn(email, password);
      setSuccess('Signed in successfully! Redirecting...');
      setTimeout(() => setScreen('home'), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.';
      setError(message);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await signUp(email, password, phone || undefined);
      setSuccess('Account created! Check your email for verification, then sign in.');
      setTab('signin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setError(message);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'instagram') => {
    setError(null);
    setSuccess(null);

    if (provider === 'instagram') {
      setError('Instagram login uses Facebook. Please use the Facebook button above.');
      return;
    }

    try {
      await signInWithProvider(provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : `${provider} login failed. Please try again.`;
      setError(message);
    }
  };

  return (
    <div
      className="animate-fade-in relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Animated floating orbs background */}
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-gradient" aria-hidden="true">
        <div className="floating-orb absolute top-[8%] left-[12%] w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: '0s' }} />
        <div className="floating-orb absolute top-[35%] right-[8%] w-80 h-80 rounded-full bg-purple-500/12 blur-3xl" style={{ animationDelay: '1.5s' }} />
        <div className="floating-orb absolute bottom-[20%] left-[20%] w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" style={{ animationDelay: '3s' }} />
        <div className="floating-orb absolute bottom-[5%] right-[25%] w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" style={{ animationDelay: '4.5s' }} />
        <div className="floating-orb absolute top-[60%] left-[5%] w-48 h-48 rounded-full bg-cyan-500/8 blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="floating-orb absolute top-[15%] right-[30%] w-60 h-60 rounded-full bg-purple-500/8 blur-3xl" style={{ animationDelay: '5s' }} />
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setScreen('home')}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-6 sm:mb-8 mt-8">
        <div className="animate-float relative inline-block">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,211,238,0.3)]">
            Sudoku
          </h1>
          <div className="animate-glow-pulse absolute -inset-10 bg-gradient-to-r from-cyan-500/30 via-purple-500/35 to-cyan-500/30 blur-[80px] -z-10" />
        </div>
        <p className="animate-bounce-in text-muted-foreground text-sm sm:text-base mt-2">
          Sign in to sync your progress
        </p>
      </div>

      {/* Not configured banner */}
      {!supabaseReady && (
        <div className="w-full max-w-md mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <CloudOff className="w-5 h-5 shrink-0" />
          <span>Cloud sync is not configured. Your progress is saved locally.</span>
        </div>
      )}

      {/* Auth Form Card */}
      <div className="card-3d glass-card rounded-2xl p-5 sm:p-7 w-full max-w-md border border-white/10">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'signin' | 'signup'); setError(null); setSuccess(null); }}>
          <TabsList className="w-full grid grid-cols-2 mb-5 bg-white/5 dark:bg-white/5">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-foreground rounded-lg py-2"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-foreground rounded-lg py-2"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 dark:bg-white/5 border-white/10 focus-visible:border-cyan-400/50"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/5 dark:bg-white/5 border-white/10 focus-visible:border-cyan-400/50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="btn-3d w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-5 rounded-xl shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all duration-300"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-white/10 border border-white/20 dark:border-white/10 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Google</span>
              </button>

              <button
                onClick={() => handleSocialAuth('facebook')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877F2] border border-[#1877F2]/50 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-semibold text-white">Facebook</span>
              </button>

              <button
                onClick={() => handleSocialAuth('instagram')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] border border-pink-500/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span className="text-xs font-semibold text-white">Instagram</span>
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setTab('signup'); setError(null); setSuccess(null); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign Up
              </button>
            </p>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 dark:bg-white/5 border-white/10 focus-visible:border-cyan-400/50"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/5 dark:bg-white/5 border-white/10 focus-visible:border-cyan-400/50"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground pl-1">
                Phone Number <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-white/5 dark:bg-white/5 border-white/10 focus-visible:border-cyan-400/50"
                  autoComplete="tel"
                />
              </div>
            </div>

            <Button
              onClick={handleSignUp}
              disabled={isAuthLoading}
              className="btn-3d w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-5 rounded-xl shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all duration-300"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">or sign up with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-white/10 border border-white/20 dark:border-white/10 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Google</span>
              </button>

              <button
                onClick={() => handleSocialAuth('facebook')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877F2] border border-[#1877F2]/50 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-semibold text-white">Facebook</span>
              </button>

              <button
                onClick={() => handleSocialAuth('instagram')}
                disabled={isAuthLoading}
                className="btn-3d flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] border border-pink-500/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span className="text-xs font-semibold text-white">Instagram</span>
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Already have an account?{' '}
              <button
                onClick={() => { setTab('signin'); setError(null); setSuccess(null); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </TabsContent>
        </Tabs>

        {/* Inline error message */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-[bounceIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center animate-[bounceIn_0.3s_ease-out]">
            {success}
          </div>
        )}
      </div>

      {/* Not configured note */}
      {!supabaseReady && (
        <p className="text-xs text-muted-foreground/50 text-center mt-4 max-w-md">
          Authentication requires Supabase configuration. The form above is for demonstration purposes.
        </p>
      )}
    </div>
  );
};

export default AuthScreen;
