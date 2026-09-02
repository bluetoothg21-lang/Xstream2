'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import ContentUniverse from './components/ContentUniverse';
import TonightLineup from './components/TonightLineup';
import ForYouStack from './components/ForYouStack';
import SocialProof from './components/SocialProof';
import DownloadSection from './components/DownloadSection';
import StickyDownloadBar from './components/StickyDownloadBar';
import { watchHistoryService, HydratedWatchProgress } from '@/lib/services/watchHistoryService';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams?.get('search') || '';
  const [continueWatching, setContinueWatching] = useState<HydratedWatchProgress[]>([]);

  useEffect(() => {
    const hash = window.location?.hash?.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, []);

  useEffect(() => {
    let active = true;
    watchHistoryService.getHydratedWatchHistory().then((data) => {
      if (active) setContinueWatching(data);
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="relative" style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0' }}>
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <HeroSection />
      {continueWatching.length > 0 && (
        <section className="relative py-12" style={{ background: '#0D0D0D' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-lg text-purple-500">🍿</span>
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">Continue Watching</h2>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {continueWatching.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/media/${item.media_type}/${item.media_id}`)}
                  className="group relative w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-900/60 bg-[#13131A] text-left transition duration-300 hover:border-purple-500/30"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#09090C]">
                    <img src={item.img} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-zinc-900/80">
                      <div className="h-full bg-purple-600 transition-all" style={{ width: `${item.progress_percent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1 p-2.5">
                    <h3 className="truncate text-xs font-semibold text-zinc-200 group-hover:text-purple-400">{item.title}</h3>
                    <p className="text-[10px] font-medium text-zinc-500">{item.progress_percent}% watched</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      <ContentUniverse searchQuery={searchQuery} />
      <TonightLineup />
      <ForYouStack />
      <SocialProof />
      <DownloadSection />
      <Footer />
      <StickyDownloadBar />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main className="relative" style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0' }}>
        <div className="grain-overlay" aria-hidden="true" />
        <Header />
        <HeroSection />
        <ContentUniverse searchQuery="" />
        <TonightLineup />
        <ForYouStack />
        <SocialProof />
        <DownloadSection />
        <Footer />
        <StickyDownloadBar />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}