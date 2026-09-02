'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/account');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        router.replace('/account');
      } else {
        await signUp(email, password, { fullName });
        router.replace('/account');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main
        className="flex items-center justify-center"
        style={{ backgroundColor: '#0D0D0D', minHeight: '100vh' }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
        />
      </main>
    );
  }

  return (
    <main
      className="flex items-center justify-center px-4"
      style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}
    >
      {/* Background glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(123,47,255,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AppLogo text="Stream" iconName="FilmIcon" size={36} onClick={() => router.push('/')} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Mode toggle */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={
                  mode === m
                    ? {
                        background: 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
                        color: '#fff',
                        boxShadow: '0 0 15px rgba(123,47,255,0.3)',
                      }
                    : { color: 'rgba(240,240,240,0.45)' }
                }
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F0F0F0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(123,47,255,0.6)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F0F0F0',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(123,47,255,0.6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F0F0F0',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(123,47,255,0.6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,75,110,0.1)',
                  border: '1px solid rgba(255,75,110,0.25)',
                  color: '#FF4B6E',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 mt-2"
              style={{
                background: submitting
                  ? 'rgba(123,47,255,0.5)'
                  : 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
                color: '#fff',
                boxShadow: submitting ? 'none' : '0 0 20px rgba(123,47,255,0.4)',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? 'Please wait...'
                : mode === 'signin' ?'Sign In' :'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'rgba(240,240,240,0.35)' }}>
          <Link
            href="/"
            style={{ color: 'rgba(240,240,240,0.5)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.5)')}
          >
            ← Back to Stream
          </Link>
        </p>
      </div>
    </main>
  );
}
