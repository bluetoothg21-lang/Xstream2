'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';

interface MediaItem {
  id: string;
  media_id: string;
  media_type: string;
  title: string;
  poster_url: string;
  genre: string;
  year: string;
  rating: string;
  user_rating?: number;
  created_at: string;
}

type TabKey = 'favorites' | 'watchlist' | 'rated-movies' | 'rated-tv' | 'rated-episodes';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'favorites', label: 'Favorites', icon: '❤️' },
  { key: 'watchlist', label: 'Watchlist', icon: '🔖' },
  { key: 'rated-movies', label: 'Rated Movies', icon: '🎬' },
  { key: 'rated-tv', label: 'Rated TV Shows', icon: '📺' },
  { key: 'rated-episodes', label: 'Rated Episodes', icon: '▶️' },
];

export default function ListsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const initialTab = (searchParams?.get('tab') as TabKey) || 'favorites';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const supabase = createClient();
      let data: MediaItem[] = [];

      if (activeTab === 'favorites') {
        const { data: rows, error } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error) data = rows || [];
      } else if (activeTab === 'watchlist') {
        const { data: rows, error } = await supabase
          .from('user_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error) data = rows || [];
      } else if (activeTab === 'rated-movies') {
        const { data: rows, error } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_type', 'movie')
          .order('created_at', { ascending: false });
        if (!error) data = rows || [];
      } else if (activeTab === 'rated-tv') {
        const { data: rows, error } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_type', 'tv')
          .order('created_at', { ascending: false });
        if (!error) data = rows || [];
      } else if (activeTab === 'rated-episodes') {
        const { data: rows, error } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_type', 'episode')
          .order('created_at', { ascending: false });
        if (!error) data = rows || [];
      }

      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setDataLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user, fetchItems]);

  const handleRemove = async (item: MediaItem) => {
    if (!user) return;
    setRemoving(item.id);
    try {
      const supabase = createClient();
      const table =
        activeTab === 'favorites' ?'user_favorites'
          : activeTab === 'watchlist' ?'user_watchlist' :'user_ratings';

      await supabase.from(table).delete().eq('id', item.id).eq('user_id', user.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/lists?tab=${tab}`, { scroll: false });
  };

  if (loading) {
    return (
      <main style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}>
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
          />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const currentTab = TABS.find((t) => t.key === activeTab);

  return (
    <main style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}>
      <Header />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-10">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}
          >
            My Content
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            My Lists
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
              style={
                activeTab === tab.key
                  ? {
                      background: 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(123,47,255,0.35)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(240,240,240,0.55)',
                    }
              }
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
            />
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-5xl mb-4">{currentTab?.icon}</div>
            <h3 className="text-lg font-bold mb-2">Nothing here yet</h3>
            <p style={{ color: 'rgba(240,240,240,0.4)', fontSize: '14px' }}>
              {activeTab === 'favorites' ?'Add movies and TV shows to your favorites'
                : activeTab === 'watchlist' ?'Save content to watch later' :'Rate movies, shows, and episodes to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  aspectRatio: '2/3',
                }}
              >
                {item.poster_url ? (
                  <AppImage
                    src={item.poster_url}
                    alt={item.title}
                    fill
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'rgba(123,47,255,0.15)' }}
                  >
                    <span className="text-4xl">🎬</span>
                  </div>
                )}

                {/* Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.95) 100%)',
                  }}
                />

                {/* Genre badge */}
                {item.genre && (
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(123,47,255,0.35)',
                      border: '1px solid rgba(123,47,255,0.5)',
                      color: '#9B5FFF',
                      fontSize: '10px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {item.genre}
                  </div>
                )}

                {/* User rating badge */}
                {item.user_rating && (
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(255,184,0,0.2)',
                      border: '1px solid rgba(255,184,0,0.4)',
                      color: '#FFB800',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    ★ {item.user_rating}
                  </div>
                )}

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-xs font-bold text-white mb-1 leading-tight">{item.title}</div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      {item.year}
                    </span>
                    {item.rating && (
                      <span style={{ fontSize: '10px', color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>
                        ★ {item.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                {!item.user_rating && (
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removing === item.id}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background: 'rgba(255,75,110,0.85)',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                    title="Remove"
                  >
                    {removing === item.id ? '·' : '×'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
