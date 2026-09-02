'use client';
import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import { getTrendingMovies, TMDBMovie } from '@/lib/services/tmdbService';

const HEADLINE = "Your Next Obsession Lives Here";

const phoneCardColors = ['#C8860A', '#7B2FFF', '#00E5FF'];

const HeroSection: React.FC = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCard, setCurrentCard] = useState(0);
  const [favorited, setFavorited] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [archMovies, setArchMovies] = useState<TMDBMovie[]>([]);
  const [phoneCards, setPhoneCards] = useState<{ title: string; genre: string; rating: string; color: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch TMDB data
  useEffect(() => {
    async function fetchData() {
      try {
        const movies = await getTrendingMovies();
        setArchMovies(movies.slice(0, 8));
        setPhoneCards(
          movies.slice(0, 3).map((m, i) => ({
            title: m.title,
            genre: m.genre,
            rating: m.rating,
            color: phoneCardColors[i % phoneCardColors.length],
          }))
        );
      } catch {
        // silent — keep empty
      }
    }
    fetchData();
  }, []);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= HEADLINE.length) {
        setDisplayedText(HEADLINE.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 55);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance phone cards
  useEffect(() => {
    if (phoneCards.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % phoneCards.length);
      setFlipped(null);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phoneCards.length]);

  const handleCardTap = (idx: number) => {
    setFlipped(flipped === idx ? null : idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const toggleFavorite = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorited((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  };

  // Arch card positions
  const archPositions = [
    { left: '2%', top: '72%', transform: 'rotate(-38deg)' },
    { left: '11%', top: '42%', transform: 'rotate(-26deg)' },
    { left: '22%', top: '16%', transform: 'rotate(-14deg)' },
    { left: '36%', top: '4%', transform: 'rotate(-4deg)' },
    { left: '53%', top: '4%', transform: 'rotate(4deg)' },
    { left: '66%', top: '16%', transform: 'rotate(14deg)' },
    { left: '77%', top: '42%', transform: 'rotate(26deg)' },
    { left: '86%', top: '72%', transform: 'rotate(38deg)' },
  ];

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-20"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(123,47,255,0.18) 0%, transparent 65%)' }}>

      <div className="ambient-violet" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="ambient-cyan" style={{ bottom: '0', right: '-100px' }} />

      {/* Arch gallery */}
      <div className="absolute w-full pointer-events-none" style={{ top: '80px', left: 0, height: '380px' }} aria-hidden="true">
        {archMovies.map((movie, i) => (
          <div
            key={movie.id}
            className="arch-card pointer-events-auto"
            style={{ ...archPositions[i], animationDelay: `${i * 0.4}s` }}>
            <AppImage src={movie.img} alt={movie.alt} fill className="object-cover w-full h-full" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-40 md:mt-48 px-6">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
          style={{ fontFamily: 'JetBrains Mono, monospace', maxWidth: '720px' }}>
          {displayedText}
          <span className="typewriter-cursor" />
        </h1>

        <p className="text-lg mb-10 max-w-md" style={{ color: 'rgba(240,240,240,0.55)', fontFamily: 'DM Sans, sans-serif' }}>
          Movies, shows, and series — curated for your taste, updated in real time.
        </p>

        {/* Phone mockup */}
        <div className="relative flex items-center justify-center float-anim">
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.35) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div className="phone-frame glow-pulse-anim">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-8 pb-2 z-10"
              style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
              <span>9:41</span>
              <span>Stream</span>
              <span>●●●</span>
            </div>

            <div className="absolute inset-0 pt-16 overflow-hidden">
              <div className="px-4 pb-3 flex items-center justify-between">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}>STREAM</span>
                <div className="flex gap-1">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7B2FFF' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                </div>
              </div>

              <div className="px-4 mb-2">
                <span style={{ fontSize: '9px', color: '#00E5FF', fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>
                  TRENDING NOW
                </span>
              </div>

              <div className="relative px-4" style={{ height: '340px' }}>
                {phoneCards.map((card, idx) => {
                  const isActive = idx === currentCard;
                  const isFlippedCard = flipped === idx;
                  const offset = idx - currentCard;

                  return (
                    <div
                      key={idx}
                      className="absolute inset-x-4 flip-card"
                      style={{
                        height: '200px',
                        top: `${Math.abs(offset) * 8}px`,
                        zIndex: isActive ? 10 : 10 - Math.abs(offset),
                        transform: `scale(${1 - Math.abs(offset) * 0.05}) translateY(${offset * 16}px)`,
                        opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.3,
                        transition: 'all 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)',
                        cursor: isActive ? 'pointer' : 'default',
                      }}
                      onClick={() => isActive && handleCardTap(idx)}>

                      <div className="flip-card-inner" style={{ width: '100%', height: '100%', ...(isFlippedCard ? { transform: 'rotateY(180deg)' } : {}) }}>
                        {/* Front */}
                        <div
                          className="flip-card-front rounded-2xl overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${card.color}33, rgba(0,0,0,0.9))`, border: `1px solid ${card.color}44` }}>
                          <div className="absolute inset-0 flex flex-col justify-end p-4">
                            <div style={{ fontSize: '8px', color: card.color, fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
                              {card.genre}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                              {card.title}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Tap to flip</span>
                              <button
                                onClick={(e) => toggleFavorite(idx, e)}
                                style={{ fontSize: '14px', color: favorited.includes(idx) ? '#FF4B6E' : 'rgba(255,255,255,0.3)' }}>
                                ❤
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Back */}
                        <div
                          className="flip-card-back rounded-2xl overflow-hidden"
                          style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.95), ${card.color}22)`, border: `1px solid ${card.color}44` }}>
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3">
                            <div style={{ fontSize: '28px', fontWeight: 800, color: card.color, fontFamily: 'JetBrains Mono, monospace' }}>
                              ★ {card.rating}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                              TMDB Rating
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                              {card.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;