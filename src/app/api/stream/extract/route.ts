import { NextRequest, NextResponse } from 'next/server';

// ── Multi-Provider Stream Extraction Handler ─────────────────────────────────
// Returns a uniform `sources` array consumed by the frontend tab/fallback loop.
// Only MoviesAPI and VidCore are active — the only reliably working sources.
// ────────────────────────────────────────────────────────────────────────────

interface StreamSource {
  name: string;
  url: string;
  type: 'iframe';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdb_id');
  const type = searchParams.get('type') as 'movie' | 'tv' | null;
  const season = searchParams.get('season') ? Number(searchParams.get('season')) : 1;
  const episode = searchParams.get('episode') ? Number(searchParams.get('episode')) : 1;

  if (!tmdbId || !type || !['movie', 'tv'].includes(type)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing or invalid parameters. Required: tmdb_id, type (movie|tv). For TV: season, episode.',
      },
      { status: 400 }
    );
  }

  const isMovie = type === 'movie';

  const sources: StreamSource[] = [
    {
      name: 'MoviesAPI',
      url: isMovie
        ? `https://moviesapi.to/movie/${tmdbId}`
        : `https://moviesapi.to/tv/${tmdbId}/${season}/${episode}`,
      type: 'iframe',
    },
    {
      name: 'VidCore',
      url: isMovie
        ? `https://vidcore.org/embed/movie/${tmdbId}`
        : `https://vidcore.org/embed/tv/${tmdbId}/${season}/${episode}`,
      type: 'iframe',
    },
  ];

  return NextResponse.json(
    { success: true, sources },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
