'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        // Fallback to auth user data
        setProfile({
          id: user?.id || '',
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || '',
          avatar_url: user?.user_metadata?.avatar_url || '',
          created_at: user?.created_at || '',
        });
      }
    } catch {
      setProfile({
        id: user?.id || '',
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
        avatar_url: user?.user_metadata?.avatar_url || '',
        created_at: user?.created_at || '',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/');
    } catch {
      setSigningOut(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  if (loading || profileLoading) {
    return (
      <main style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}>
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
              Loading account...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const initials = getInitials(profile?.full_name || '', profile?.email || '');

  return (
    <main style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}>
      <Header />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        {/* Page Title */}
        <div className="mb-10">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Your Account
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Account Details
          </h1>
        </div>

        {/* Profile Card */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-6 mb-8">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #7B2FFF, #00E5FF)',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">
                {profile?.full_name || 'Stream User'}
              </h2>
              <p style={{ color: 'rgba(240,240,240,0.5)', fontSize: '14px' }}>
                {profile?.email}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: profile?.full_name || 'Not set' },
              { label: 'Email Address', value: profile?.email || 'N/A' },
              { label: 'Member Since', value: formatDate(profile?.created_at || '') },
              { label: 'Account Status', value: 'Active' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(240,240,240,0.35)', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {item.label}
                </p>
                <p className="text-sm font-medium" style={{ color: '#F0F0F0' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3
            className="text-sm font-bold uppercase tracking-widest mb-4"
            style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            My Content
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Favorites', href: '/lists?tab=favorites', icon: '❤️' },
              { label: 'Watchlist', href: '/lists?tab=watchlist', icon: '🔖' },
              { label: 'Rated Movies', href: '/lists?tab=rated-movies', icon: '⭐' },
              { label: 'Rated TV Shows', href: '/lists?tab=rated-tv', icon: '📺' },
              { label: 'Rated Episodes', href: '/lists?tab=rated-episodes', icon: '🎬' },
              { label: 'All Lists', href: '/lists', icon: '📋' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-xl p-4 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  color: 'rgba(240,240,240,0.7)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(123,47,255,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,255,0.3)';
                  (e.currentTarget as HTMLElement).style.color = '#F0F0F0';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,240,0.7)';
                }}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-4 rounded-xl font-semibold text-sm transition-all duration-300"
          style={{
            background: 'rgba(255,75,110,0.1)',
            border: '1px solid rgba(255,75,110,0.25)',
            color: '#FF4B6E',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            opacity: signingOut ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!signingOut) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,75,110,0.2)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,75,110,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,75,110,0.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,75,110,0.25)';
          }}
        >
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <Footer />
    </main>
  );
}
