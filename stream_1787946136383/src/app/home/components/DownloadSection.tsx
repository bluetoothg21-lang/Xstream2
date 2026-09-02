'use client';
import React, { useRef, useState, useEffect } from 'react';


const DownloadSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="download"
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #0A0514 40%, #0D0D0D 100%)',
      }}
    >
      {/* Large ambient glows */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,47,255,0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className={`reveal-up ${visible ? 'visible' : ''}`}>
          {/* Mascot emoji */}
          <div className="mascot text-6xl mb-8 inline-block">🎬</div>

          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#7B2FFF', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Ready to Obsess?
          </p>

          <h2
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}
          >
            Download Free.
            <br />
            <span className="gradient-text">Start Streaming.</span>
          </h2>

          <p
            className="text-lg mb-12 max-w-lg mx-auto"
            style={{ color: 'rgba(240,240,240,0.55)', lineHeight: 1.7 }}
          >
            28 million people already know what you're missing. Join them — it's free, 
            no credit card required, no commitment.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-white font-bold text-base transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,255,0.5)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(123,47,255,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '24px' }}>🍎</span>
              <div className="text-left">
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                  DOWNLOAD ON THE
                </div>
                <div className="font-bold">App Store</div>
              </div>
            </button>

            <button
              className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-white font-bold text-base transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
                boxShadow: '0 0 30px rgba(123,47,255,0.4)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 50px rgba(123,47,255,0.6), 0 0 80px rgba(0,229,255,0.2)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(123,47,255,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '24px' }}>🤖</span>
              <div className="text-left">
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
                  GET IT ON
                </div>
                <div className="font-bold">Google Play</div>
              </div>
            </button>
          </div>

          {/* QR Code section */}
          <div
            className={`reveal-up inline-flex flex-col items-center gap-4 ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: '200ms' }}
          >
            <p style={{ fontSize: '12px', color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
              DESKTOP? POINT YOUR CAMERA HERE
            </p>

            <div className="qr-border">
              <div
                className="rounded-[18px] p-6 flex flex-col items-center gap-3"
                style={{ background: '#0D0D0D' }}
              >
                {/* QR code grid simulation */}
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    background: `
                      repeating-conic-gradient(
                        rgba(123,47,255,0.8) 0% 25%,
                        rgba(13,13,13,0.95) 0% 50%
                      ) 0 0 / 12px 12px
                    `,
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* QR corner squares */}
                  {[
                    { top: 0, left: 0 },
                    { top: 0, right: 0 },
                    { bottom: 0, left: 0 },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: '28px',
                        height: '28px',
                        border: '4px solid #7B2FFF',
                        borderRadius: '4px',
                        ...pos,
                        background: 'rgba(13,13,13,0.9)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: '4px',
                          background: '#7B2FFF',
                          borderRadius: '1px',
                        }}
                      />
                    </div>
                  ))}
                  {/* Center logo */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #7B2FFF, #00E5FF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                  >
                    🎬
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'rgba(240,240,240,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                  stream.app/get
                </p>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(240,240,240,0.3)' }}>
              Free forever · No ads on content · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;