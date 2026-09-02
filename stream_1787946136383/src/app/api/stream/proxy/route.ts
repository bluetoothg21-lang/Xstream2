import { NextRequest, NextResponse } from 'next/server';

// HLS Stream Proxy — forwards .m3u8 and .ts segment requests with proper headers
// This is needed because HLS streams from VidSrc require specific Referer/Origin headers
// that browsers block via CORS when making direct requests from our domain.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const referer = searchParams.get('referer') ?? 'https://vidsrc.net/';

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Security: only allow proxying from known streaming domains
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const allowedHosts = [
    'vidsrc.net', 'vidsrc.me', 'vidsrc.xyz', 'vidsrc.in', 'vidsrc.io',
    'whisperingauroras.com', 'vidplay.online', 'vidplay.site',
    // Common CDN patterns for HLS streams
  ];
  const isAllowed = allowedHosts.some(
    (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h)
  ) || parsedUrl.pathname.endsWith('.m3u8') || parsedUrl.pathname.endsWith('.ts')
    || parsedUrl.pathname.endsWith('.vtt') || parsedUrl.pathname.endsWith('.srt');

  if (!isAllowed) {
    // Allow any .m3u8 / .ts / subtitle URL regardless of domain (needed for CDN segments)
    const ext = parsedUrl.pathname.split('.').pop()?.toLowerCase();
    if (!['m3u8', 'ts', 'vtt', 'srt', 'key'].includes(ext ?? '')) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: referer,
        Origin: new URL(referer).origin,
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    // For .m3u8 playlists, rewrite segment URLs to go through this proxy
    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      let playlist = new TextDecoder().decode(body);
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

      // Rewrite relative segment URLs to absolute, then proxy them
      playlist = playlist.replace(/^(?!#)(.+\.(?:ts|m3u8|key))(\?.*)?$/gm, (match, path, qs) => {
        const absoluteUrl = path.startsWith('http') ? path + (qs ?? '') : baseUrl + path + (qs ?? '');
        return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
      });

      return new NextResponse(playlist, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[Stream Proxy] Error:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
