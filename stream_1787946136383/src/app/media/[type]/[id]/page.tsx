import React from 'react';
import HLSPlayer from '@/components/HLSPlayer';

interface MediaPageProps {
  params: Promise<{
    type: 'movie' | 'tv';
    id: string;
  }>;
}

export default async function MediaPlaybackPage({ params }: MediaPageProps) {
  const { type, id } = await params;
  const streamSrc = `/api/stream/proxy?id=${id}&type=${type}`;

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <HLSPlayer hlsUrl={streamSrc} title={`Item ${id}`} provider={type} />

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight">Active Stream: Item #{id}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-purple-400">
            Category Core: {type}
          </p>
        </div>
      </div>
    </div>
  );
}

