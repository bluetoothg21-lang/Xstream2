'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tmdbService } from '@/lib/services/tmdbService';

type SearchItem = {
  id: number;
  title: string;
  name?: string;
  mediaType?: string;
  type?: string;
  media_type?: 'movie' | 'tv';
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  air_date?: string;
};

const posterUrl = (path?: string | null, size: 'w342' | 'w500' | 'original' = 'w342') => {
  if (!path) return '/assets/images/no_image.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export default function BrowseSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    async function loadTrending() {
      if (searchQuery.trim() !== '') return;

      setLoading(true);
      try {
        const data = await tmdbService.getTrending('all', 'day');
        const validMedia = (data.results || []).filter((item: SearchItem) => item.poster_path);
        setMovies(validMedia);
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
      const data = await tmdbService.searchMulti(searchQuery);
      const searchResults = (data.results || []).filter(
        (item: SearchItem) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
      );
      setMovies(searchResults);
    } catch (error) {
      console.error('Search query fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movie') return item.media_type === 'movie' || !item.media_type;
    if (activeFilter === 'tv') return item.media_type === 'tv';
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 px-8 py-6 text-white">
      <form onSubmit={handleSearchSubmit} className="mx-auto mb-8 flex max-w-4xl gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search global database for movies, shows, genres..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-white placeholder-zinc-500 transition focus:border-purple-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700"
        >
          Search
        </button>
      </form>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'movie', 'tv'] as const).map((type) => (
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
        <span className="text-sm font-medium text-zinc-500">{filteredMovies.length} results matching filter</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {filteredMovies.map((item) => {
            const title = item.title || item.name || 'Untitled Content';
            const releaseDate = item.release_date || item.first_air_date || 'N/A';
            const year = releaseDate.split('-')[0];
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
            const explicitType = item.mediaType || item.media_type;
            let safeType = explicitType?.toLowerCase() || 'movie';

            if (!explicitType && item.type?.toLowerCase().includes('tv')) {
              safeType = 'tv';
            } else if (!explicitType && (item.first_air_date || item.air_date)) {
              safeType = 'tv';
            }

            if (safeType !== 'tv' && safeType !== 'movie') {
              safeType = 'movie';
            }

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/media/${safeType}/${item.id}`)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900 transition hover:border-zinc-800"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={posterUrl(item.poster_path)}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {item.vote_average && item.vote_average > 0 && (
                    <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                      ★ {rating}
                    </div>
                  )}
                </div>

                <div className="flex flex-grow flex-col justify-between p-3">
                  <h3 className="line-clamp-1 text-xs font-semibold text-zinc-100 transition group-hover:text-purple-400">
                    {title}
                  </h3>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-zinc-500">
                    <span>{year}</span>
                    <span className="rounded border border-zinc-800 px-1 text-[8px] uppercase">
                      {safeType}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredMovies.length === 0 && (
        <div className="py-20 text-center font-medium text-zinc-500">No matches found. Try widening your search terms!</div>
      )}
    </div>
  );
}
