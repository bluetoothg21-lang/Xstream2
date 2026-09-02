import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic resource proxy for vidsrc.sbs sub-resources.
 * Rewrites absolute vidsrc.sbs URLs so they pass through our server,
 * allowing the main proxy to serve a fully self-contained page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }

  // Only proxy vidsrc.sbs resources
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('vidsrc.sbs')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://vidsrc.sbs/',
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[VidSrc Resource Proxy] Error:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
