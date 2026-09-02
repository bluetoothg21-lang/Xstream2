'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import { getMovieDetails, getTVDetails, TMDBMovieDetail, TMDBTVDetail } from '@/lib/services/tmdbService';
import { useAuth } from '@/contexts/AuthContext';
import { userListsService } from '@/lib/services/userListsService';

type MediaDetail = (TMDBMovieDetail & { mediaType: 'movie' }) | (TMDBTVDetail & { mediaType: 'tv'; title: string });

// ── Embed source definitions ──────────────────────────────────────────────────
interface EmbedSource {
  name: string;
  color: string;
  getUrl: (tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number) => string;
}

// Helper: rewrite any external embed URL through our backend proxy so that
// X-Frame-Options / CSP framing headers are stripped server-side.
function proxyUrl(externalUrl: string): string {
  return `/api/proxy/vidsrc?url=${encodeURIComponent(externalUrl)}`;
}

const EMBED_SOURCES: EmbedSource[] = [
  {
    name: 'MoviesAPI',
    color: '#FF9500',
    getUrl: (id, type, s, e) =>
      type === 'movie'
        ? `https://moviesapi.to/movie/${id}`
        : `https://moviesapi.to/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    name: 'VidCore',
    color: '#A78BFA',
    getUrl: (id, type, s, e) =>
      type === 'movie'
        ? `https://vidcore.org/embed/movie/${id}`
        : `https://vidcore.org/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
];

// Known ad/tracker domains to block at network level
const AD_DOMAINS = [
  'exoclick.com', 'exosrv.com', 'trafficjunky.net', 'traffichaus.com',
  'adnxs.com', 'doubleclick.net', 'googlesyndication.com', 'popads.net',
  'popcash.net', 'propellerads.com', 'hilltopads.net', 'adsterra.com',
  'juicyads.com', 'plugrush.com', 'revcontent.com', 'outbrain.com',
  'taboola.com', 'mgid.com', 'zedo.com', 'clickadu.com', 'adcash.com',
  'adskeeper.co.uk', 'bidvertiser.com', 'yllix.com', 'adfly.net',
  'shorte.st', 'adf.ly', 'linkbucks.com', 'ouo.io', 'bc.vc',
  'clkmon.com', 'clkrev.com', 'go2speed.org', 'redirect.disqus.com',
  'popunder.net', 'pounder.io', 'pop.cash', 'popuptraffic.com',
  // Referral / redirect ad networks
  'track.clicksfly.com', 'go.redirectingat.com', 'redirect.viglink.com',
  'shrinkme.io', 'shortearn.eu', 'earnow.online', 'clk.sh', 'za.gl',
  'fc.lc', 'oke.io', 'shrinkearn.com', 'link1s.com', 'gplinks.in',
  'earnads.net', 'adshort.im', 'exe.io', 'adshrink.it', 'adrinolinks.com',
  'financemonk.net', 'techgeek.digital', 'techymedies.com',
];

function isAdDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AD_DOMAINS.some((d) => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const mediaType = params.type as 'movie' | 'tv';
  const mediaId = params.id as string;

  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  // Player state
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [adBlockActive, setAdBlockActive] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const originalFetch = useRef<typeof fetch | null>(null);
  const originalXHROpen = useRef<typeof XMLHttpRequest.prototype.open | null>(null);

  // ── Ad & Popup Blocking ───────────────────────────────────────────────────
  useEffect(() => {
    // 1. Block window.open popups
    const nativeOpen = window.open;
    window.open = function (url?: string | URL, name?: string, specs?: string) {
      const urlStr = url ? (typeof url === 'string' ? url : (url as URL).href) : '';
      console.warn(`[AdBlock] Blocked automated outbound pop-up route: ${urlStr}`);
      return null;
    };

    // 2. Intercept click-based anchor redirects (ExoClick, PopAds, etc.)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (anchor && anchor.hasAttribute('target')) {
        const href = anchor.getAttribute('href') || '';
        if (
          href.includes('exoclick') ||
          href.includes('popads') ||
          isAdDomain(href)
        ) {
          e.preventDefault();
          e.stopPropagation();
          console.warn(`[AdBlock] Blocked suspicious click anchor redirection: ${href}`);
        }
      }
    };

    // 3. Intercept fetch to block known ad domains
    const originalFetchRef = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;
      if (isAdDomain(url)) {
        console.warn('[AdBlock] Blocked fetch:', url);
        return Promise.reject(new Error('Blocked by ad filter'));
      }
      return originalFetchRef(input, init);
    };

    // 4. Intercept XHR to block known ad domains
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
      const urlStr = typeof url === 'string' ? url : url.href;
      if (isAdDomain(urlStr)) {
        console.warn('[AdBlock] Blocked XHR:', urlStr);
        return;
      }
      return origXHROpen.apply(this, [method, url, ...args] as any);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      window.open = nativeOpen;
      window.fetch = originalFetchRef;
      XMLHttpRequest.prototype.open = origXHROpen;
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        if (mediaType === 'movie') {
          const data = await getMovieDetails(Number(mediaId));
          if (data) setDetail({ ...data, mediaType: 'movie' });
        } else {
          const data = await getTVDetails(Number(mediaId));
          if (data) setDetail({ ...data, mediaType: 'tv', title: data.name });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (mediaId && mediaType) fetchDetail();
  }, [mediaId, mediaType]);

  useEffect(() => {
    async function checkStatus() {
      if (!user || !detail) return;
      try {
        const [fav, watch] = await Promise.all([
          userListsService.isFavorite(user.id, mediaId, mediaType),
          userListsService.isInWatchlist(user.id, mediaId, mediaType),
        ]);
        setIsFav(fav);
        setIsWatchlist(watch);
      } catch { /* silent */ }
    }
    checkStatus();
  }, [user, detail, mediaId, mediaType]);

  const getEmbedUrl = useCallback(() => {
    const source = EMBED_SOURCES[activeSourceIndex];
    return source.getUrl(mediaId, mediaType, selectedSeason, selectedEpisode);
  }, [mediaId, mediaType, selectedSeason, selectedEpisode, activeSourceIndex]);

  const handleWatchNow = () => {
    setShowPlayer(true);
    setActiveSourceIndex(0);
    setLoadError(false);
    setIframeKey((k) => k + 1);
  };

  const handleSourceChange = (index: number) => {
    setActiveSourceIndex(index);
    setLoadError(false);
    setIframeKey((k) => k + 1);
  };

  // Auto-advance to next source on load error
  const handleIframeError = useCallback(() => {
    setLoadError(true);
  }, []);

  const handleNextSource = () => {
    const next = (activeSourceIndex + 1) % EMBED_SOURCES.length;
    handleSourceChange(next);
  };

  const handleFavorite = async () => {
    if (!user) { router.push('/login'); return; }
    if (!detail) return;
    setFavLoading(true);
    try {
      const genre = detail.mediaType === 'movie'
        ? (detail as TMDBMovieDetail).genres?.[0] || ''
        : (detail as TMDBTVDetail).genres?.[0] || '';
      const year = detail.mediaType === 'movie' ? (detail as TMDBMovieDetail).releaseDate?.slice(0, 4) ||'' : (detail as TMDBTVDetail).firstAirDate?.slice(0, 4) ||'';
      if (isFav) {
        await userListsService.removeFavorite(user.id, mediaId, mediaType);
        setIsFav(false);
      } else {
        await userListsService.addFavorite(user.id, {
          mediaId, mediaType, title: detail.title,
          posterUrl: detail.img, genre, year, rating: detail.rating,
        });
        setIsFav(true);
      }
    } catch { /* silent */ } finally { setFavLoading(false); }
  };

  const handleWatchlist = async () => {
    if (!user) { router.push('/login'); return; }
    if (!detail) return;
    setWatchLoading(true);
    try {
      const genre = detail.mediaType === 'movie'
        ? (detail as TMDBMovieDetail).genres?.[0] || ''
        : (detail as TMDBTVDetail).genres?.[0] || '';
      const year = detail.mediaType === 'movie' ? (detail as TMDBMovieDetail).releaseDate?.slice(0, 4) ||'' : (detail as TMDBTVDetail).firstAirDate?.slice(0, 4) ||'';
      if (isWatchlist) {
        await userListsService.removeFromWatchlist(user.id, mediaId, mediaType);
        setIsWatchlist(false);
      } else {
        await userListsService.addToWatchlist(user.id, {
          mediaId, mediaType, title: detail.title,
          posterUrl: detail.img, genre, year, rating: detail.rating,
        });
        setIsWatchlist(true);
      }
    } catch { /* silent */ } finally { setWatchLoading(false); }
  };

  const tvDetail = mediaType !== 'movie' ? (detail as TMDBTVDetail) : null;
  const totalSeasons = tvDetail?.numberOfSeasons || 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }} />
          <p style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-4">Not Found</p>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(123,47,255,0.2)', border: '1px solid rgba(123,47,255,0.4)', color: '#fff' }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const isMovie = detail.mediaType === 'movie';
  const movieDetail = isMovie ? (detail as TMDBMovieDetail) : null;
  const releaseYear = isMovie
    ? movieDetail?.releaseDate?.slice(0, 4)
    : (detail as TMDBTVDetail)?.firstAirDate?.slice(0, 4);
  const extraInfo = isMovie
    ? movieDetail?.runtime ? `${Math.floor(movieDetail.runtime / 60)}h ${movieDetail.runtime % 60}m` : null
    : totalSeasons ? `${totalSeasons} Season${totalSeasons > 1 ? 's' : ''}` : null;

  const activeSource = EMBED_SOURCES[activeSourceIndex];

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      {/* Backdrop */}
      <div className="relative w-full" style={{ height: '520px' }}>
        <AppImage src={detail.backdropImg} alt={`${detail.title} backdrop`} fill className="object-cover" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.7) 60%, #0D0D0D 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,13,13,0.8) 0%, transparent 60%)' }} />
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(12px)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,255,0.5)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-48 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ width: '220px', height: '330px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <AppImage src={detail.img} alt={detail.alt} fill className="object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            {/* Type badge */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: isMovie ? 'rgba(123,47,255,0.2)' : 'rgba(0,229,255,0.15)', border: `1px solid ${isMovie ? 'rgba(123,47,255,0.4)' : 'rgba(0,229,255,0.3)'}`, color: isMovie ? '#7B2FFF' : '#00E5FF', fontFamily: 'JetBrains Mono, monospace' }}>
                {isMovie ? '🎬 Movie' : '📺 TV Show'}
              </span>
              {detail.genres?.slice(0, 2).map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,240,240,0.6)' }}>
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.15 }}>
              {detail.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-5 mb-6 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>
                ★ {detail.rating}
              </span>
              {releaseYear && <span className="text-sm" style={{ color: 'rgba(240,240,240,0.5)' }}>{releaseYear}</span>}
              {extraInfo && <span className="text-sm" style={{ color: 'rgba(240,240,240,0.5)' }}>{extraInfo}</span>}
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(0,200,100,0.12)',
                  border: '1px solid rgba(0,200,100,0.35)',
                  color: '#00C864',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                🛡 Ad-Block Active
              </span>
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(123,47,255,0.12)',
                  border: '1px solid rgba(123,47,255,0.3)',
                  color: '#A78BFA',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                ▶ {EMBED_SOURCES.length} Sources
              </span>
            </div>

            {/* Overview */}
            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(240,240,240,0.7)', maxWidth: '640px' }}>
              {detail.overview || 'No overview available.'}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleWatchNow}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #7B2FFF 0%, #5B1FDF 100%)',
                  border: '1px solid rgba(123,47,255,0.6)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(123,47,255,0.35)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 28px rgba(123,47,255,0.55)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(123,47,255,0.35)'; }}
              >
                ▶ Watch Now
              </button>

              <button
                onClick={handleFavorite}
                disabled={favLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: isFav ? 'rgba(255,75,110,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isFav ? 'rgba(255,75,110,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  color: isFav ? '#FF4B6E' : 'rgba(240,240,240,0.7)',
                }}
                onMouseEnter={(e) => { if (!isFav) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,75,110,0.4)'; }}
                onMouseLeave={(e) => { if (!isFav) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {favLoading ? '...' : isFav ? '❤ Favorited' : '♡ Add to Favorites'}
              </button>

              <button
                onClick={handleWatchlist}
                disabled={watchLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: isWatchlist ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isWatchlist ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  color: isWatchlist ? '#00E5FF' : 'rgba(240,240,240,0.7)',
                }}
                onMouseEnter={(e) => { if (!isWatchlist) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)'; }}
                onMouseLeave={(e) => { if (!isWatchlist) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {watchLoading ? '...' : isWatchlist ? '🔖 In Watchlist' : '+ Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Streaming Player Section ── */}
        {showPlayer && (
          <div className="mt-12">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Now Streaming
                </h2>
                {/* Ad block status badge */}
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(0,200,100,0.12)',
                    border: '1px solid rgba(0,200,100,0.3)',
                    color: '#00C864',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  🛡 Popup Blocker ON
                </span>
              </div>
              <button
                onClick={() => { setShowPlayer(false); setActiveSourceIndex(0); setLoadError(false); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(240,240,240,0.5)' }}
              >
                ✕ Close Player
              </button>
            </div>

            {/* TV Show season/episode selectors */}
            {!isMovie && (
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); setLoadError(false); setIframeKey((k) => k + 1); }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s} style={{ background: '#1a1a2e' }}>Season {s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Episode</label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => { setSelectedEpisode(Number(e.target.value)); setLoadError(false); setIframeKey((k) => k + 1); }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((ep) => (
                      <option key={ep} value={ep} style={{ background: '#1a1a2e' }}>Episode {ep}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Source selector tabs — orange active style */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest mr-1" style={{ color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>Source:</span>
              {EMBED_SOURCES.map((src, i) => (
                <button
                  key={src.name}
                  onClick={() => handleSourceChange(i)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeSourceIndex === i
                      ? 'bg-orange-600 text-white shadow'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {src.name}
                </button>
              ))}
            </div>

            {/* Load error banner */}
            {loadError && (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
                style={{
                  background: 'rgba(255,75,110,0.1)',
                  border: '1px solid rgba(255,75,110,0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: '#FF4B6E', fontSize: '14px' }}>⚠</span>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(240,240,240,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Source failed to load. Try another source.
                  </span>
                </div>
                <button
                  onClick={handleNextSource}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: 'rgba(123,47,255,0.3)',
                    border: '1px solid rgba(123,47,255,0.5)',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  → Try Next Source
                </button>
              </div>
            )}

            {/* Iframe player container */}
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{
                aspectRatio: '16/9',
                border: `1px solid ${activeSource.color}4D`,
                boxShadow: `0 8px 40px ${activeSource.color}33`,
                background: '#000',
              }}
            >
              {/* Transparent overlay to intercept ad clicks outside the video area */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
              <iframe
                ref={iframeRef}
                key={`${iframeKey}-${activeSourceIndex}-${selectedSeason}-${selectedEpisode}`}
                src={getEmbedUrl()}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                sandbox="allow-scripts allow-same-origin allow-forms"
                referrerPolicy="no-referrer"
                style={{ border: 'none', display: 'block', position: 'relative', zIndex: 0 }}
                title={`${detail.title} - ${activeSource.name}`}
                onError={handleIframeError}
              />
            </div>

            {/* Source info + fallback controls */}
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              <p className="text-sm" style={{ color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                Currently watching: <span className="text-orange-500 font-semibold">{activeSource.name}</span>
                {!isMovie ? ` · S${selectedSeason}E${selectedEpisode}` : ''}
              </p>
              <button
                onClick={handleNextSource}
                disabled={activeSourceIndex === EMBED_SOURCES.length - 1}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded font-medium text-xs tracking-wide transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Try Next Source →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
