'use client';
import React, { useRef, useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';

const stats = [
{ value: 28, suffix: 'M+', label: 'Active Users', color: '#7B2FFF' },
{ value: 4.9, suffix: '/5', label: 'App Store Rating', color: '#FFB800' },
{ value: 180, suffix: '+', label: 'Countries', color: '#00E5FF' },
{ value: 99, suffix: '%', label: 'Uptime SLA', color: '#7B2FFF' }];


const testimonials = [
{
  quote: "I found three shows I\'m obsessed with in my first 20 minutes. The recommendations are genuinely scary good.",
  name: 'Priya Mehta',
  handle: '@priya_watches',
  avatar: "https://images.unsplash.com/photo-1575090973814-063b180ffef9",
  altAvatar: 'Young woman with warm smile and dark hair',
  platform: 'iOS · New York',
  color: '#7B2FFF'
},
{
  quote: "Finally an app that connects my movie taste to music. It recommended a whole playlist based on what I was watching.",
  name: 'Marcus Delacroix',
  handle: '@mdelacroix',
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_118a7c3e7-1763294171595.png",
  altAvatar: 'Young man with confident expression in casual wear',
  platform: 'Android · Chicago',
  color: '#00E5FF'
},
{
  quote: "The podcast discovery is unreal. I found episodes from creators I\'d never heard of that are now my commute staples.",
  name: 'Yuki Tanaka',
  handle: '@yukipodcasts',
  avatar: "https://images.unsplash.com/photo-1600228976035-42e543eaf8db",
  altAvatar: 'Smiling woman with short hair in urban setting',
  platform: 'iOS · San Francisco',
  color: '#FF4B6E'
}];


const liveActivity = [
{ action: 'just saved', title: 'Void Protocol', user: 'Taylor M.', time: '2s ago' },
{ action: 'started watching', title: 'Neon Wolves', user: 'Jordan K.', time: '5s ago' },
{ action: 'added to playlist', title: 'Midnight Circuit', user: 'Sam R.', time: '8s ago' },
{ action: 'just finished', title: 'The Overlap #112', user: 'Alex V.', time: '12s ago' }];


const CountUp: React.FC<{target: number;suffix: string;color: string;visible: boolean;}> = ({
  target, suffix, color, visible
}) => {
  const [count, setCount] = useState(0);
  const isDecimal = target % 1 !== 0;

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.min(start, target));
      }
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <span className="stat-number" style={{ color, fontSize: '3rem', lineHeight: 1 }}>
      {isDecimal ? count.toFixed(1) : Math.floor(count)}
      <span style={{ fontSize: '1.8rem' }}>{suffix}</span>
    </span>);

};

const SocialProof: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activityIdx, setActivityIdx] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {if (entry.isIntersecting) setVisible(true);},
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIdx((prev) => (prev + 1) % liveActivity.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 overflow-hidden"
      style={{ background: '#0D0D0D' }}>
      
      <div className="ambient-violet" style={{ top: '30%', right: '-100px' }} />
      <div className="ambient-cyan" style={{ bottom: '10%', left: '-100px' }} />

      <div className="max-w-7xl mx-auto px-6">
        {/* Stats */}
        <div className={`reveal-up mb-24 ${visible ? 'visible' : ''}`}>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4 text-center"
            style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}>
            
            By The Numbers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) =>
            <div
              key={i}
              className="text-center p-6 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
              
                <CountUp target={stat.value} suffix={stat.suffix} color={stat.color} visible={visible} />
                <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(240,240,240,0.45)' }}>
                  {stat.label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Testimonials + Live Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) =>
          <div
            key={i}
            className={`reveal-up glass-card p-6 ${visible ? 'visible' : ''}`}
            style={{
              transitionDelay: `${i * 80}ms`,
              borderColor: `${t.color}22`
            }}>
            
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, si) =>
              <span key={si} style={{ color: '#FFB800', fontSize: '14px' }}>★</span>
              )}
              </div>

              <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: 'rgba(240,240,240,0.7)', fontStyle: 'italic' }}>
              
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <AppImage src={t.avatar} alt={t.altAvatar} width={40} height={40} className="object-cover w-full h-full" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs" style={{ color: t.color }}>{t.platform}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Activity Ticker */}
        <div
          className={`reveal-up mt-8 ${visible ? 'visible' : ''}`}
          style={{ transitionDelay: '300ms' }}>
          
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-2xl"
            style={{
              background: 'rgba(0,229,255,0.05)',
              border: '1px solid rgba(0,229,255,0.15)'
            }}>
            
            <div className="live-dot flex-shrink-0" />
            <div className="text-sm overflow-hidden" style={{ height: '24px' }}>
              <div
                key={activityIdx}
                style={{
                  animation: 'slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  color: 'rgba(240,240,240,0.7)'
                }}>
                
                <span className="font-semibold text-white">{liveActivity[activityIdx].user}</span>
                {' '}{liveActivity[activityIdx].action}{' '}
                <span style={{ color: '#00E5FF', fontWeight: 600 }}>"{liveActivity[activityIdx].title}"</span>
                <span
                  className="ml-3"
                  style={{ color: 'rgba(240,240,240,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                  
                  {liveActivity[activityIdx].time}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>);

};

export default SocialProof;