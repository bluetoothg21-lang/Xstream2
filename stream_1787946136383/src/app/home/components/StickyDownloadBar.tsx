'use client';
import React, { useEffect, useState } from 'react';

const StickyDownloadBar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!dismissed) {
        setVisible(window.scrollY > 600);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  return (
    <div
      className={`sticky-download-bar ${visible ? 'visible' : ''}`}
      role="complementary"
      aria-label="Download Stream app"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '24px' }}>🎬</span>
          <div>
            <div
              className="text-sm font-bold text-white"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Stream — Free Download
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(240,240,240,0.5)' }}>
              28M+ users · 4.9★ rating
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <span>🍎</span> iOS
          </button>

          <button
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
              boxShadow: '0 0 20px rgba(123,47,255,0.4)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 35px rgba(123,47,255,0.7)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(123,47,255,0.4)';
            }}
          >
            <span>🤖</span> Android
          </button>

          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(240,240,240,0.4)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#F0F0F0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,240,0.4)';
            }}
            aria-label="Dismiss download bar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyDownloadBar;