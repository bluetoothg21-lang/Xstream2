'use client';
import React, { useRef, useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import { useRouter } from 'next/navigation';
import { getTonightLineup, TMDBLineupItem } from '@/lib/services/tmdbService';

type GenreKey = 'All' | 'Action' | 'Drama' | 'Sci-Fi' | 'Comedy' | 'Docs' | 'Thriller' | 'Crime' | 'Horror' | 'Romance' | 'Animation';

const GENRES: GenreKey[] = ['All', 'Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller'];

const LiveCounter: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const [count, setCount] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 12 + 1));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <div className="live-dot" style={{ background: color }} />
      <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(240,240,240,0.6)' }}>
        {count.toLocaleString()} watching
      </span>
    </div>
  );
};

const TonightLineup: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [allItems, setAllItems] = useState<TMDBLineupItem[]>([]);
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
        const items = await getTonightLineup();
        setAllItems(items);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = activeGenre === 'All' ? allItems : allItems.filter((i) => i.genre === activeGenre);

  return (
    <section ref={sectionRef} className="relative py-28 overflow-hidden" style={{ background: '#0D0D0D' }}>
      <div className="ambient-cyan" style={{ top: '20%', right: '-150px' }} />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`reveal-up mb-8 ${visible ? 'visible' : ''}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00E5FF', fontFamily: 'JetBrains Mono, monospace' }}>
                Live Now
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Tonight's <span className="gradient-text">Lineup</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#00E5FF', fontWeight: 700 }}>
                LIVE COUNTERS
              </span>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className={`reveal-up mb-10 ${visible ? 'visible' : ''}`} style={{ transitionDelay: '80ms' }}>
          <div className="flex gap-3 flex-wrap">
            {GENRES.map((genre) => (
              <button
                key={genre}
                className={`filter-chip ${activeGenre === genre ? 'active' : ''}`}
                onClick={() => setActiveGenre(genre)}>
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ height: '240px', background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className={`reveal-up content-card relative cursor-pointer ${visible ? 'visible' : ''}`}
                style={{ height: '240px', transitionDelay: `${(i % 4) * 60}ms` }}
                onClick={() => router.push(`/media/${item.mediaType}/${item.id}`)}>
                <div className="card-glow" />
                <AppImage src={item.img} alt={item.alt} fill className="object-cover w-full h-full" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.9) 100%)' }} />

                {item.new && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #7B2FFF, #00E5FF)', color: '#fff', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}>
                    NEW
                  </div>
                )}

                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.time}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-sm font-bold text-white mb-1 truncate">{item.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${item.color}22`, border: `1px solid ${item.color}44`, color: item.color, fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.genre}
                    </span>
                    <LiveCounter value={item.views} color={item.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TonightLineup;