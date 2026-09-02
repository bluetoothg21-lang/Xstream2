'use client';
import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import ContentUniverse from './components/ContentUniverse';
import TonightLineup from './components/TonightLineup';
import ForYouStack from './components/ForYouStack';
import SocialProof from './components/SocialProof';
import DownloadSection from './components/DownloadSection';
import StickyDownloadBar from './components/StickyDownloadBar';

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';

  useEffect(() => {
    const hash = window.location?.hash?.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, []);

  return (
    <main className="relative" style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0' }}>
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <HeroSection />
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