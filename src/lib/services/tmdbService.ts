const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Genre ID → name map (TMDB standard)
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Docs', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'War',
};

const ACCENT_COLORS = ['#7B2FFF', '#FF4B6E', '#00E5FF', '#FFB800'];

function getColor(id: number): string {
  return ACCENT_COLORS[id % ACCENT_COLORS.length];
}

function getGenre(genreIds: number[]): string {
  for (const id of genreIds) {
    if (GENRE_MAP[id]) return GENRE_MAP[id];
  }
  return 'Drama';
}

/**
 * Core fetch helper — uses api_key query parameter as per TMDB API v3 docs.
 * The api_key param is the standard v3 authentication method.
 * Optionally appends extra query params (e.g. language, region, append_to_response).
 */
async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params,
  });
  const url = `${BASE_URL}${path}?${queryParams.toString()}`;
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status} for ${path}`);
  return res.json();
}

export interface TMDBMovie {
  id: number;
  title: string;
  genre: string;
  year: string;
  rating: string;
  color: string;
  img: string;
  alt: string;
  duration: string;
  overview: string;
  backdropImg: string;
}

export interface TMDBShow {
  id: number;
  title: string;
  genre: string;
  year: string;
  rating: string;
  color: string;
  img: string;
  alt: string;
  episodes: string;
  overview: string;
  backdropImg: string;
}

export interface TMDBLineupItem {
  id: number;
  title: string;
  genre: string;
  time: string;
  platform: string;
  views: number;
  color: string;
  img: string;
  alt: string;
  new?: boolean;
  mediaType: 'movie' | 'tv';
}

export interface TMDBForYouCard {
  id: number;
  title: string;
  type: string;
  match: number;
  color: string;
  img: string;
  alt: string;
  tag: string;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  year: string;
  rating: string;
  img: string;
  alt: string;
  overview: string;
  genre: string;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  rating: string;
  runtime: number;
  genres: string[];
  img: string;
  backdropImg: string;
  alt: string;
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  overview: string;
  firstAirDate: string;
  rating: string;
  numberOfSeasons: number;
  genres: string[];
  img: string;
  backdropImg: string;
  alt: string;
}

// Poster URL helper
export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return '/assets/images/no_image.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Backdrop URL helper
export function backdropUrl(path: string | null): string {
  if (!path) return '/assets/images/no_image.png';
  return `${TMDB_IMAGE_BASE}/w780${path}`;
}

export const tmdbService = {
  getTrendingMovies,
  getTrendingShows,
  getTonightLineup,
  getForYouCards,
  getFeaturedMovie,
  getPopularMovies,
  getMovieDetails,
  getTVDetails,
  searchMovies,
  searchTVShows,
  searchAll,
  getTrending,
  searchMulti,
};

// GET /trending/movie/week — weekly trending movies
export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch('/trending/movie/week');
    return (data.results || []).slice(0, 10).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      genre: getGenre(m.genre_ids || []),
      year: m.release_date ? m.release_date.slice(0, 4) : '2025',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      duration: '2h 00m',
      overview: m.overview || '',
      backdropImg: backdropUrl(m.backdrop_path),
    }));
  } catch {
    return [];
  }
}

// GET /trending/tv/week — weekly trending TV shows
export async function getTrendingShows(): Promise<TMDBShow[]> {
  try {
    const data = await tmdbFetch('/trending/tv/week');
    return (data.results || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      title: s.name || s.original_name,
      genre: getGenre(s.genre_ids || []),
      year: s.first_air_date ? s.first_air_date.slice(0, 4) : '2025',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      color: getColor(s.id),
      img: posterUrl(s.poster_path),
      alt: `${s.name || s.original_name} TV show poster`,
      episodes: 'S1 · New',
      overview: s.overview || '',
      backdropImg: backdropUrl(s.backdrop_path),
    }));
  } catch {
    return [];
  }
}

// GET /trending/movie/day + /trending/tv/day — tonight's lineup mix
export async function getTonightLineup(): Promise<TMDBLineupItem[]> {
  try {
    const [movies, shows] = await Promise.all([
      tmdbFetch('/trending/movie/day'),
      tmdbFetch('/trending/tv/day'),
    ]);

    const times = ['7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'];
    const baseViews = [44200, 67300, 89700, 98400, 142800, 178900, 211500, 250000];

    const movieItems: TMDBLineupItem[] = (movies.results || []).slice(0, 4).map((m: any, i: number) => ({
      id: m.id,
      title: m.title || m.original_title,
      genre: getGenre(m.genre_ids || []),
      time: times[i] || '9:00 PM',
      platform: 'Stream',
      views: baseViews[i] || 100000,
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      new: i < 2,
      mediaType: 'movie',
    }));

    const showItems: TMDBLineupItem[] = (shows.results || []).slice(0, 4).map((s: any, i: number) => ({
      id: s.id,
      title: s.name || s.original_name,
      genre: getGenre(s.genre_ids || []),
      time: times[i + 4] || '10:00 PM',
      platform: 'Stream',
      views: baseViews[i + 4] || 80000,
      color: getColor(s.id),
      img: posterUrl(s.poster_path),
      alt: `${s.name || s.original_name} TV show poster`,
      new: i === 0,
      mediaType: 'tv',
    }));

    return [...movieItems, ...showItems];
  } catch {
    return [];
  }
}

// GET /movie/top_rated — top rated movies for For You cards
export async function getForYouCards(): Promise<TMDBForYouCard[]> {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    const tags = ['New Episode', 'Trending', 'Fresh Drop', 'Staff Pick'];
    const matches = [97, 94, 91, 88];
    return (data.results || []).slice(0, 4).map((m: any, i: number) => ({
      id: m.id,
      title: m.title || m.original_title,
      type: `Film · ${getGenre(m.genre_ids || [])}`,
      match: matches[i] || 85,
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      tag: tags[i] || 'Trending',
    }));
  } catch {
    return [];
  }
}

// GET /movie/now_playing — featured movie for hero section
export async function getFeaturedMovie(): Promise<{ title: string; overview: string; backdropImg: string; rating: string } | null> {
  try {
    const data = await tmdbFetch('/movie/now_playing');
    const movie = (data.results || [])[0];
    if (!movie) return null;
    return {
      title: movie.title || movie.original_title,
      overview: movie.overview || '',
      backdropImg: backdropUrl(movie.backdrop_path),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
    };
  } catch {
    return null;
  }
}

// GET /movie/popular — popular movies list
export async function getPopularMovies(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch('/movie/popular');
    return (data.results || []).slice(0, 20).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      genre: getGenre(m.genre_ids || []),
      year: m.release_date ? m.release_date.slice(0, 4) : '2025',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      duration: '2h 00m',
      overview: m.overview || '',
      backdropImg: backdropUrl(m.backdrop_path),
    }));
  } catch {
    return [];
  }
}

// GET /movie/{movie_id} — full movie details (optionally with append_to_response)
export async function getMovieDetails(movieId: number, appendToResponse?: string): Promise<TMDBMovieDetail | null> {
  try {
    const params: Record<string, string> = {};
    if (appendToResponse) params.append_to_response = appendToResponse;
    const m = await tmdbFetch(`/movie/${movieId}`, params);
    return {
      id: m.id,
      title: m.title || m.original_title,
      overview: m.overview || '',
      releaseDate: m.release_date || '',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      runtime: m.runtime || 0,
      genres: (m.genres || []).map((g: any) => g.name),
      img: posterUrl(m.poster_path, 'w500'),
      backdropImg: backdropUrl(m.backdrop_path),
      alt: `${m.title || m.original_title} movie poster`,
    };
  } catch {
    return null;
  }
}

// GET /tv/{tv_id} — full TV show details (optionally with append_to_response)
export async function getTVDetails(tvId: number, appendToResponse?: string): Promise<TMDBTVDetail | null> {
  try {
    const params: Record<string, string> = {};
    if (appendToResponse) params.append_to_response = appendToResponse;
    const s = await tmdbFetch(`/tv/${tvId}`, params);
    return {
      id: s.id,
      name: s.name || s.original_name,
      overview: s.overview || '',
      firstAirDate: s.first_air_date || '',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      numberOfSeasons: s.number_of_seasons || 1,
      genres: (s.genres || []).map((g: any) => g.name),
      img: posterUrl(s.poster_path, 'w500'),
      backdropImg: backdropUrl(s.backdrop_path),
      alt: `${s.name || s.original_name} TV show poster`,
    };
  } catch {
    return null;
  }
}

// GET /search/movie?query={text} — search movies by title
export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await tmdbFetch('/search/movie', { query: query.trim() });
    return (data.results || []).slice(0, 10).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      mediaType: 'movie' as const,
      year: m.release_date ? m.release_date.slice(0, 4) : '',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      overview: m.overview || '',
      genre: getGenre(m.genre_ids || []),
    }));
  } catch {
    return [];
  }
}

// GET /search/tv?query={text} — search TV shows by title
export async function searchTVShows(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await tmdbFetch('/search/tv', { query: query.trim() });
    return (data.results || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      title: s.name || s.original_name,
      mediaType: 'tv' as const,
      year: s.first_air_date ? s.first_air_date.slice(0, 4) : '',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      img: posterUrl(s.poster_path),
      alt: `${s.name || s.original_name} TV show poster`,
      overview: s.overview || '',
      genre: getGenre(s.genre_ids || []),
    }));
  } catch {
    return [];
  }
}

// Search both movies and TV shows simultaneously
export async function searchAll(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const [movies, shows] = await Promise.all([
      searchMovies(query),
      searchTVShows(query),
    ]);
    return [...movies, ...shows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  } catch {
    return [];
  }
}

// Trending and multi-search helpers for the live browse/search UI
export async function getTrending(type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day'): Promise<any> {
  try {
    const mediaType = type === 'all' ? 'all' : type;
    return await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
  } catch {
    return { results: [] };
  }
}

export async function searchMulti(query: string): Promise<any> {
  if (!query.trim()) return { results: [] };
  try {
    const data = await tmdbFetch('/search/multi', { query: query.trim() });
    return {
      ...data,
      results: (data.results || []).filter((item: any) =>
        (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
      ),
    };
  } catch {
    return { results: [] };
  }
}
