'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/contexts/AuthContext';
import { userListsService } from '@/lib/services/userListsService';
import { useRouter } from 'next/navigation';
import { getTrendingMovies, getTrendingShows, TMDBMovie, TMDBShow } from '@/lib/services/tmdbService';

interface CardActionsProps {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl: string;
  genre: string;
  year: string;
  rating: string;
}

const CardActions: React.FC<CardActionsProps> = ({ mediaId, mediaType, title, posterUrl, genre, year, rating }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const [fav, watch] = await Promise.all([
        userListsService.isFavorite(user.id, mediaId, mediaType),
        userListsService.isInWatchlist(user.id, mediaId, mediaType),
      ]);
      setIsFav(fav);
      setIsWatchlist(watch);
    } catch {
      // silent
    }
  }, [user, mediaId, mediaType]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    setFavLoading(true);
    try {
      if (isFav) {
        await userListsService.removeFavorite(user.id, mediaId, mediaType);
        setIsFav(false);
      } else {
        await userListsService.addFavorite(user.id, { mediaId, mediaType, title, posterUrl, genre, year, rating });
        setIsFav(true);
      }
    } catch {
      // silent
    } finally {
      setFavLoading(false);
    }
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    setWatchLoading(true);
    try {
      if (isWatchlist) {
        await userListsService.removeFromWatchlist(user.id, mediaId, mediaType);
        setIsWatchlist(false);
      } else {
        await userListsService.addToWatchlist(user.id, { mediaId, mediaType, title, posterUrl, genre, year, rating });
        setIsWatchlist(true);
      }
    } catch {
      // silent
    } finally {
      setWatchLoading(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={handleFavorite}
        disabled={favLoading}
        title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-150"
        style={{
          background: isFav ? 'rgba(255,75,110,0.9)' : 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,75,110,0.5)',
          color: isFav ? '#fff' : '#FF4B6E',
          backdropFilter: 'blur(8px)',
        }}
      >
        {favLoading ? '·' : '❤'}
      </button>
      <button
        onClick={handleWatchlist}
        disabled={watchLoading}
        title={isWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-150"
        style={{
          background: isWatchlist ? 'rgba(0,229,255,0.9)' : 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(0,229,255,0.5)',
          color: isWatchlist ? '#0D0D0D' : '#00E5FF',
          backdropFilter: 'blur(8px)',
        }}
      >
        {watchLoading ? '·' : '🔖'}
      </button>
    </div>
  );
};

interface ContentUniverseProps {
  searchQuery?: string;
}

const ContentUniverse: React.FC<ContentUniverseProps> = ({ searchQuery = '' }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [shows, setShows] = useState<TMDBShow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesData, showsData] = await Promise.all([
          getTrendingMovies(),
          getTrendingShows(),
        ]);
        setMovies(moviesData);
        setShows(showsData);
      } catch {
        // silent — keep empty arrays
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredMovies = searchQuery
    ? movies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    : movies;

  const filteredShows = searchQuery
    ? shows.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    : shows;

  return (
    <section
      ref={sectionRef}
      className="relative py-28 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0F0A1A 50%, #0D0D0D 100%)' }}>

      <div className="ambient-violet" style={{ top: '50%', left: '-200px', transform: 'translateY(-50%)' }} />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className={`reveal-up mb-16 ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}>
            Content Universe
          </p>
          {searchQuery ? (
            <>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Results for <span className="gradient-text">"{searchQuery}"</span>
              </h2>
              <p className="mt-3 text-base" style={{ color: 'rgba(240,240,240,0.5)' }}>
                {filteredMovies.length + filteredShows.length} result{filteredMovies.length + filteredShows.length !== 1 ? 's' : ''} found
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                What's Playing <span className="gradient-text">Right Now</span>
              </h2>
              <p className="mt-3 text-base" style={{ color: 'rgba(240,240,240,0.5)' }}>
                Trending on TMDB today. Your next favorite film or show is in here somewhere.
              </p>
            </>
          )}
        </div>

        {/* Movies horizontal scroll */}
        <div id="movies" className={`reveal-up mb-16 ${visible ? 'visible' : ''}`} style={{ transitionDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">🎬 Films</h3>
            <button
              className="text-xs font-semibold transition-colors"
              style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.4)')}>
              VIEW ALL →
            </button>
          </div>

          {loading ? (
            <div className="flex gap-4 pb-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 rounded-xl animate-pulse" style={{ width: '200px', height: '280px', background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <p className="text-sm py-8" style={{ color: 'rgba(240,240,240,0.4)' }}>No movies found matching "{searchQuery}"</p>
          ) : (
            <div className="h-scroll flex gap-4 pb-3">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="content-card flex-shrink-0 relative group cursor-pointer" style={{ width: '200px', height: '280px' }} onClick={() => router.push(`/media/movie/${movie.id}`)}>
                  <div className="card-glow" />
                  <AppImage src={movie.img} alt={movie.alt} fill className="object-cover w-full h-full" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.95) 100%)' }} />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: `${movie.color}33`, border: `1px solid ${movie.color}55`, color: movie.color, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                    {movie.genre}
                  </div>
                  <CardActions
                    mediaId={String(movie.id)}
                    mediaType="movie"
                    title={movie.title}
                    posterUrl={movie.img}
                    genre={movie.genre}
                    year={movie.year}
                    rating={movie.rating}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-sm font-bold text-white mb-1">{movie.title}</div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{movie.year}</span>
                      <span style={{ fontSize: '11px', color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>★ {movie.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shows horizontal scroll */}
        <div id="shows" className={`reveal-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">📺 Series & Shows</h3>
            <button
              className="text-xs font-semibold transition-colors"
              style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.4)')}>
              VIEW ALL →
            </button>
          </div>

          {loading ? (
            <div className="flex gap-4 pb-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 rounded-xl animate-pulse" style={{ width: '200px', height: '280px', background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : filteredShows.length === 0 ? (
            <p className="text-sm py-8" style={{ color: 'rgba(240,240,240,0.4)' }}>No shows found matching "{searchQuery}"</p>
          ) : (
            <div className="h-scroll flex gap-4 pb-3">
              {filteredShows.map((show) => (
                <div key={show.id} className="content-card flex-shrink-0 relative group cursor-pointer" style={{ width: '200px', height: '280px' }} onClick={() => router.push(`/media/tv/${show.id}`)}>
                  <div className="card-glow" />
                  <AppImage src={show.img} alt={show.alt} fill className="object-cover w-full h-full" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.95) 100%)' }} />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: `${show.color}33`, border: `1px solid ${show.color}55`, color: show.color, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                    {show.genre}
                  </div>
                  <CardActions
                    mediaId={String(show.id)}
                    mediaType="tv"
                    title={show.title}
                    posterUrl={show.img}
                    genre={show.genre}
                    year={show.year}
                    rating={show.rating}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-sm font-bold text-white mb-1">{show.title}</div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{show.year} · {show.episodes}</span>
                      <span style={{ fontSize: '11px', color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>★ {show.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContentUniverse;