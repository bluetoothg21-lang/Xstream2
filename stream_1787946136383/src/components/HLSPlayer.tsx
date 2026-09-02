'use client';
import React, { useEffect, useRef, useState } from 'react';

interface SubtitleTrack {
  url: string;
  label: string;
  lang: string;
}

interface HLSPlayerProps {
  hlsUrl?: string;
  mediaId?: string;
  mediaType?: 'movie' | 'tv';
  src?: string;
  subtitles?: SubtitleTrack[];
  title?: string;
  provider?: string;
  onError?: () => void;
}

export default function HLSPlayer({ hlsUrl, mediaId, mediaType, src, subtitles = [], title, provider, onError }: HLSPlayerProps) {
  const resolvedHlsUrl = hlsUrl ?? src ?? (mediaId && mediaType
    ? `/api/stream/proxy?id=${encodeURIComponent(mediaId)}&type=${mediaType}`
    : '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number>(-1);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Proxy the HLS URL through our server to handle CORS
  const proxiedUrl = `/api/stream/proxy?url=${encodeURIComponent(resolvedHlsUrl)}&referer=${encodeURIComponent('https://vidsrc.net/')}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedHlsUrl) return;

    let hlsInstance: import('hls.js').default | null = null;

    async function initPlayer() {
      setIsLoading(true);
      setError(null);

      try {
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });

          hlsInstance.loadSource(proxiedUrl);
          hlsInstance.attachMedia(video!);

          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video!.play().catch(() => {
              // Autoplay blocked — user must click play
            });
          });

          hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setError('Stream error. The source may be unavailable.');
              setIsLoading(false);
              onError?.();
            }
          });
        } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          video!.src = proxiedUrl;
          video!.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
          video!.addEventListener('error', () => {
            setError('Stream error. The source may be unavailable.');
            setIsLoading(false);
            onError?.();
          }, { once: true });
        } else {
          setError('HLS playback is not supported in this browser.');
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to initialize player.');
        setIsLoading(false);
      }
    }

    initPlayer();

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [resolvedHlsUrl, proxiedUrl, onError]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Number(e.target.value);
    video.volume = v;
    video.muted = v === 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-2xl overflow-hidden select-none"
      style={{
        aspectRatio: '16/9',
        border: '1px solid rgba(123,47,255,0.3)',
        boxShadow: '0 8px 40px rgba(123,47,255,0.2)',
      }}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        {subtitles.map((sub, i) => (
          <track
            key={i}
            kind="subtitles"
            src={`/api/stream/proxy?url=${encodeURIComponent(sub.url)}&referer=${encodeURIComponent('https://vidsrc.net/')}`}
            srcLang={sub.lang}
            label={sub.label}
            default={i === 0}
          />
        ))}
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
              Loading stream…
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center px-6">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-white font-semibold mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Stream Unavailable
            </p>
            <p style={{ color: 'rgba(240,240,240,0.5)', fontSize: '13px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Play button overlay (when paused and not loading) */}
      {!isLoading && !error && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: 'rgba(123,47,255,0.85)',
              boxShadow: '0 0 40px rgba(123,47,255,0.5)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-300"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '32px 16px 12px',
        }}
      >
        {/* Progress bar */}
        <div className="relative mb-2 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 appearance-none cursor-pointer rounded-full"
            style={{
              background: `linear-gradient(to right, #7B2FFF ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
              outline: 'none',
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:bg-white hover:bg-opacity-10"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <button onClick={toggleMute} className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:bg-white hover:bg-opacity-10">
            {isMuted || volume === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            className="w-16 h-1 appearance-none cursor-pointer rounded-full"
            style={{
              background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
              outline: 'none',
            }}
          />

          {/* Time */}
          <span
            className="text-xs ml-1"
            style={{ color: 'rgba(240,240,240,0.7)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Provider badge */}
          {provider && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs hidden sm:inline-block"
              style={{
                background: 'rgba(123,47,255,0.2)',
                border: '1px solid rgba(123,47,255,0.35)',
                color: 'rgba(240,240,240,0.6)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {provider.replace('https://', '')}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Subtitle selector */}
          {subtitles.length > 0 && (
            <select
              value={selectedSubtitle}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedSubtitle(idx);
                const video = videoRef.current;
                if (!video) return;
                for (let i = 0; i < video.textTracks.length; i++) {
                  video.textTracks[i].mode = i === idx ? 'showing' : 'hidden';
                }
              }}
              className="text-xs px-2 py-1 rounded-lg cursor-pointer outline-none"
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(240,240,240,0.8)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <option value={-1}>CC Off</option>
              {subtitles.map((sub, i) => (
                <option key={i} value={i}>{sub.label}</option>
              ))}
            </select>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:bg-white hover:bg-opacity-10"
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Title overlay */}
      {title && showControls && (
        <div
          className="absolute top-0 left-0 right-0 px-4 py-3 transition-all duration-300"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          }}
        >
          <p
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {title}
          </p>
        </div>
      )}
    </div>
  );
}
