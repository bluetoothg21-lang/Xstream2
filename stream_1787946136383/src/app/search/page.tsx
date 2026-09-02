'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as tmdb from '@/lib/services/tmdbService';

type SearchItem = {
  id: number;
  title: string;
  name?: string;
  media_type?: 'movie' | 'tv';
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre?: string;
  color?: string;
  img?: string;
  alt?: string;
  mediaType?: 'movie' | 'tv';
  year?: string;
  rating?: string;
};

const normalizeItem = (item: any): SearchItem | null => {
  if (!item || !item.poster_path) return null;

  const mediaType = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie';
  const title = item.title || item.name || 'Untitled Content';
  const releaseDate = item.release_date || item.first_air_date || 'N/A';
  const year = releaseDate.split('-')[0] || 'N/A';

  return {
    id: item.id,
    title,
    name: item.name,
    media_type: mediaType,
    mediaType,
    poster_path: item.poster_path,
    vote_average: item.vote_average,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    genre: item.genre || 'Drama',
    color: item.color || '#A855F7',
    img: `https://image.tmdb.org/t/p/w342${item.poster_path}`,
    alt: title,
    year,
    rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
  };
};

export default function BrowseSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function loadTrending() {
      if (searchQuery.trim() !== '') return;
      setLoading(true);
      try {
        const data = await tmdb.getTrending('all', 'day');
        const validMedia = (data.results || [])
          .map(normalizeItem)
          .filter(Boolean) as SearchItem[];
        setItems(validMedia);
      } catch (error) {
        console.error('Failed to load catalog:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, [searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await tmdb.searchMulti(searchQuery);
      const searchResults = (data.results || [])
        .map(normalizeItem)
        .filter(Boolean) as SearchItem[];
      setItems(searchResults);
    } catch (error) {
      console.error('Search query fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movie') return item.mediaType === 'movie' || !item.mediaType;
    if (activeFilter === 'tv') return item.mediaType === 'tv';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0F0F14] px-8 py-6 text-white select-none">
      <form onSubmit={handleSearchSubmit} className="mx-auto mb-8 flex max-w-4xl gap-3">
        <input
          type="text"
          placeholder="Search global database for movies, shows, genres..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-white placeholder-zinc-500 transition focus:border-purple-600 focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700">
          Search
        </button>
      </form>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'movie', 'tv'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                activeFilter === type ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {type === 'all' ? '🟢 All Catalog' : type === 'movie' ? '🎬 Films' : '📺 Series'}
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-zinc-500">{displayItems.length} results matching filter</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-[#1A1A24]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {displayItems.map((item) => {
            const mediaType = item.mediaType || (item.first_air_date ? 'tv' : 'movie');

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/media/${mediaType}/${item.id}`)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-900/60 bg-[#13131A] transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#09090C]">
                  <img
                    src={item.img}
                    alt={item.alt || item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {item.rating && item.rating !== 'N/A' && (
                    <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                      ★ {item.rating}
                    </div>
                  )}

                  {item.genre && (
                    <span
                      className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold text-zinc-950 backdrop-blur-md"
                      style={{ backgroundColor: item.color || '#A855F7' }}
                    >
                      {item.genre}
                    </span>
                  )}
                </div>

                <div className="flex flex-grow flex-col justify-between bg-gradient-to-t from-[#0D0D12] to-[#13131A] p-3.5">
                  <h3 className="line-clamp-1 text-xs font-semibold text-zinc-200 transition-colors duration-200 group-hover:text-purple-400">
                    {item.title}
                  </h3>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-zinc-500">
                    <span>{item.year}</span>
                    <span className="rounded border border-zinc-800 bg-zinc-900/50 px-1.5 py-0.2 text-[8px] uppercase tracking-wider">
                      {mediaType}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
