'use client';
import React, { useRef, useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import { useRouter } from 'next/navigation';
import { getForYouCards, TMDBForYouCard } from '@/lib/services/tmdbService';

const reasons = [
  'Based on your 47 saved titles',
  'Because you watched a top-rated film',
  'Matches your midnight activity',
  'Trending in your city',
];

const ForYouStack: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [cards, setCards] = useState<TMDBForYouCard[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getForYouCards();
        setCards(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (hovered || cards.length === 0) return;
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [hovered, cards.length]);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0A0514 50%, #0D0D0D 100%)' }}>

      <div className="ambient-violet" style={{ bottom: '-100px', left: '50%', transform: 'translateX(-50%)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: Text */}
          <div className={`reveal-up ${visible ? 'visible' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}>
              Personalized For You
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.15 }}>
              Your Algorithm <br />
              <span className="gradient-text">Knows You.</span>
            </h2>
            <p className="text-base mb-8" style={{ color: 'rgba(240,240,240,0.55)', lineHeight: 1.7 }}>
              Stream's recommendation engine learns from every tap, pause, and replay.
              The longer you use it, the sharper it gets — no two feeds look the same.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: '⚡', label: 'Real-time taste profiling', desc: 'Updates every 90 seconds based on behavior' },
                { icon: '🎯', label: 'Cross-genre matching', desc: "Connects your movie tastes to shows you'll love" },
                { icon: '🌙', label: 'Time-aware curation', desc: 'Different picks for 11pm vs 7am' },
              ].map((feat, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,255,0.3)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(123,47,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}>
                  <span style={{ fontSize: '20px' }}>{feat.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{feat.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(240,240,240,0.45)' }}>{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 rounded-2xl" style={{ background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.25)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(240,240,240,0.5)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                WHY THIS PICK
              </p>
              <p className="text-sm font-medium text-white transition-all duration-500">
                {reasons[activeCard % reasons.length]}
              </p>
            </div>
          </div>

          {/* Right: Fan card stack */}
          <div
            className={`reveal-up flex justify-center items-center ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: '150ms', minHeight: '380px' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>

            {loading ? (
              <div className="w-64 h-80 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ) : (
              <div className="relative" style={{ width: '260px', height: '360px' }}>
                {cards.map((card, i) => {
                  const offset = i - activeCard;
                  const absOffset = Math.abs(offset);
                  const fanRotation = offset * 7;
                  const fanX = offset * 30;
                  const fanY = absOffset * 8;
                  const scale = 1 - absOffset * 0.06;
                  const zIndex = cards.length - absOffset;

                  return (
                    <div
                      key={card.id}
                      className="absolute rounded-2xl overflow-hidden cursor-pointer"
                      style={{
                        width: '220px', height: '300px',
                        left: '50%', top: '50%',
                        transform: `translateX(calc(-50% + ${fanX}px)) translateY(calc(-50% + ${fanY}px)) rotate(${fanRotation}deg) scale(${scale})`,
                        zIndex,
                        transition: 'all 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
                        border: `1px solid ${i === activeCard ? card.color + '66' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: i === activeCard ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${card.color}25` : '0 10px 30px rgba(0,0,0,0.4)',
                      }}
                      onClick={() => {
                        if (i === activeCard) {
                          router.push(`/media/movie/${card.id}`);
                        } else {
                          setActiveCard(i);
                        }
                      }}>
                      <AppImage src={card.img} alt={card.alt} fill className="object-cover w-full h-full" />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.95) 100%)' }} />

                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full"
                        style={{ background: `${card.color}33`, border: `1px solid ${card.color}55`, fontSize: '9px', fontWeight: 700, color: card.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {card.tag}
                      </div>

                      {i === activeCard && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                          {card.match}% match
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-sm font-bold text-white mb-0.5 truncate">{card.title}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{card.type}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForYouStack;