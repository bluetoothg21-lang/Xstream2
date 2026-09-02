import { NextRequest, NextResponse } from 'next/server';

// Ad-blocking script injected directly into the proxied vidsrc page.
// Because this runs INSIDE the iframe's origin context (served from our proxy),
// it can intercept all network requests, DOM mutations, and navigation events
// that were previously unreachable from the parent page.
const AD_BLOCK_SCRIPT = `
<script>
(function() {
  'use strict';

  // ── 1. Domain blocklist (network-level) ──────────────────────────────
  var BLOCKED_DOMAINS = [
    'doubleclick.net','googlesyndication.com','googleadservices.com',
    'adnxs.com','rubiconproject.com','openx.net','pubmatic.com',
    'casalemedia.com','criteo.com','taboola.com','outbrain.com',
    'revcontent.com','mgid.com','adform.net','smartadserver.com',
    'advertising.com','yieldmo.com','sharethrough.com','triplelift.com',
    'sovrn.com','lijit.com','contextweb.com','appnexus.com',
    'adsrvr.org','bidswitch.net','emxdgt.com','indexexchange.com',
    'lkqd.net','media.net','moatads.com','quantserve.com',
    'scorecardresearch.com','serving-sys.com','spotxchange.com',
    'springserve.com','teads.tv','trafficjunky.net','undertone.com',
    'vidazoo.com','yieldlab.net','zedo.com','adtelligent.com',
    'aniview.com','connatix.com','freewheel.tv','imasdk.googleapis.com',
    'exoclick.com','juicyads.com','trafficstars.com','plugrush.com',
    'propellerads.com','hilltopads.net','popcash.net','popads.net',
    'clickadu.com','adcash.com','adsterra.com','adskeeper.com',
    'adcolony.com','bidvertiser.com','buysellads.com','carbonads.com',
    'demdex.net','doubleverify.com','everesttech.net','flashtalking.com',
    'imrworldwide.com','krxd.net','liveramp.com','lotame.com',
    'nexac.com','omtrdc.net','rfihub.com','rlcdn.com',
    'sizmek.com','stickyadstv.com','turn.com','tynt.com',
    'unrulymedia.com','w55c.net','weborama.fr','xaxis.com',
    'zemanta.com','amazon-adsystem.com',
    // VidSrc-specific redirect/ad domains
    'embedsito.com','moviesapi.club',
    'smashystream.com','autoembed.cc'];

  function isBlocked(url) {
    try {
      var h = new URL(url, location.href).hostname.toLowerCase();
      return BLOCKED_DOMAINS.some(function(d) {
        return h === d || h.endsWith('.' + d);
      });
    } catch(e) { return false; }
  }

  // ── 2. Block window.open / window.location redirects ─────────────────
  var _open = window.open;
  window.open = function(url, target, features) {
    if (url) {
      try {
        var u = new URL(String(url), location.href);
        if (u.origin !== location.origin) { return null; }
      } catch(e) { return null; }
    }
    return _open.apply(window, arguments);
  };

  // Intercept location.href / location.assign / location.replace
  var _assign = location.assign.bind(location);
  var _replace = location.replace.bind(location);
  Object.defineProperty(location, 'assign', {
    value: function(url) {
      try {
        var u = new URL(String(url), location.href);
        if (u.origin !== location.origin && isBlocked(url)) return;
      } catch(e) {}
      _assign(url);
    }, configurable: true
  });
  Object.defineProperty(location, 'replace', {
    value: function(url) {
      try {
        var u = new URL(String(url), location.href);
        if (u.origin !== location.origin && isBlocked(url)) return;
      } catch(e) {}
      _replace(url);
    }, configurable: true
  });

  // ── 3. Patch fetch ────────────────────────────────────────────────────
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input
      : (input && input.url) ? input.url
      : String(input);
    if (isBlocked(url)) {
      return Promise.reject(new TypeError('[AdBlock] Blocked: ' + url));
    }
    return _fetch.apply(window, arguments);
  };

  // ── 4. Patch XMLHttpRequest ───────────────────────────────────────────
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._blocked = isBlocked(String(url));
    if (!this._blocked) {
      _xhrOpen.apply(this, arguments);
    }
  };
  var _xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    if (this._blocked) return;
    _xhrSend.apply(this, arguments);
  };

  // ── 5. Block <script> tags loading from ad domains ───────────────────
  var _createElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _createElement(tag);
    if (tag.toLowerCase() === 'script') {
      var _setSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      if (_setSrc) {
        Object.defineProperty(el, 'src', {
          set: function(val) {
            if (isBlocked(String(val))) {
              Object.defineProperty(el, '_adBlocked', { value: true });
              return;
            }
            _setSrc.set.call(el, val);
          },
          get: function() { return _setSrc.get.call(el); },
          configurable: true
        });
      }
    }
    return el;
  };

  // ── 6. Block dynamically injected ad nodes ────────────────────────────
  var _appendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(node) {
    if (node && node.tagName) {
      var tag = node.tagName.toLowerCase();
      var src = node.src || node.href || '';
      if ((tag === 'script' || tag === 'iframe' || tag === 'img') && isBlocked(src)) {
        return node;
      }
    }
    return _appendChild.apply(this, arguments);
  };

  var _insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(node, ref) {
    if (node && node.tagName) {
      var tag = node.tagName.toLowerCase();
      var src = node.src || node.href || '';
      if ((tag === 'script' || tag === 'iframe' || tag === 'img') && isBlocked(src)) {
        return node;
      }
    }
    return _insertBefore.apply(this, arguments);
  };

  // ── 7. CSS cosmetic filtering ─────────────────────────────────────────
  var AD_SELECTORS = [
    '[id*="ad-container"],[id*="ad_container"],[class*="ad-container"]',
    '[id*="advert"],[class*="advert"]',
    '[id*="banner-ad"],[class*="banner-ad"]',
    '[id*="popup-ad"],[class*="popup-ad"]',
    '[id*="overlay-ad"],[class*="overlay-ad"]',
    'div[style*="z-index: 9999"][style*="position: fixed"]',
    'div[style*="z-index:9999"][style*="position:fixed"]',
    'div[style*="z-index: 99999"],div[style*="z-index:99999"]',
    '[data-ad],[data-ad-unit],[data-ad-slot]',
    '.ad-slot,.ad-unit,.ad-wrapper,.ad-placeholder',
    '#ad-overlay,#ad-modal,#ad-popup',
    'a[href*="exoclick"],a[href*="trafficjunky"],a[href*="propellerads"]',
    'a[href*="adsterra"],a[href*="popcash"],a[href*="popads"]'].join(',');

  function removeAdEls() {
    try {
      document.querySelectorAll(AD_SELECTORS).forEach(function(el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
      });
    } catch(e) {}
  }

  if (document.body) removeAdEls();
  var obs = new MutationObserver(removeAdEls);
  document.addEventListener('DOMContentLoaded', function() {
    removeAdEls();
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style','class','id'] });
  });

  // ── 8. Block postMessage-based ad triggers ────────────────────────────
  var _addEvt = EventTarget.prototype.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === 'message') {
      var wrapped = function(e) {
        try {
          var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && (data.type === 'ad' || data.ad || data.advertisement)) return;
        } catch(ex) {}
        listener.call(this, e);
      };
      return _addEvt.call(this, type, wrapped, options);
    }
    return _addEvt.apply(this, arguments);
  };

})();
</script>
`;

// ── Shared response builder ───────────────────────────────────────────────────
async function buildProxiedResponse(upstreamUrl: string): Promise<NextResponse> {
  let parsedOrigin: string;
  try {
    parsedOrigin = new URL(upstreamUrl).origin;
  } catch {
    return new NextResponse('Invalid upstream URL', { status: 400 });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': parsedOrigin,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    let html = await upstream.text();

    // ── Inject ad-blocking script as the very first thing in <head> ──
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + AD_BLOCK_SCRIPT);
    } else if (html.includes('<html')) {
      html = html.replace(/(<html[^>]*>)/i, '$1' + AD_BLOCK_SCRIPT);
    } else {
      html = AD_BLOCK_SCRIPT + html;
    }

    // ── Rewrite absolute URLs in the HTML to go through our proxy ──
    const escapedOrigin = parsedOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const originRegex = new RegExp(`(src|href)="(${escapedOrigin}\\/[^"]*)"`, 'gi');
    html = html.replace(originRegex, (match, attr, url) => {
      const proxied = `/api/proxy/vidsrc/resource?url=${encodeURIComponent(url)}`;
      return `${attr}="${proxied}"`;
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Strip X-Frame-Options and allow embedding from anywhere
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *",
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[VidSrc Proxy] Error:', err);
    // Fallback: return a minimal page that embeds the original URL directly
    const fallbackHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body,html{width:100%;height:100%;background:#000}iframe{width:100%;height:100%;border:none}</style></head>
<body><iframe src="${upstreamUrl}" allowfullscreen allow="autoplay;fullscreen"></iframe></body>
</html>`;
    return new NextResponse(fallbackHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Mode 1: Generic URL proxy (?url=...) ─────────────────────────────────
  // Used when the frontend rewrites embed source URLs through this proxy.
  const targetUrl = searchParams.get('url');
  if (targetUrl) {
    return buildProxiedResponse(targetUrl);
  }

  // ── Mode 2: Legacy type/id params ────────────────────────────────────────
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!type || !id) {
    return new NextResponse('Missing required parameter: provide either ?url= or ?type=&id=', { status: 400 });
  }

  let upstreamUrl: string;
  if (type === 'movie') {
    upstreamUrl = `https://vidsrc.sbs/embed/movie/${id}`;
  } else {
    upstreamUrl = `https://vidsrc.sbs/embed/tv/${id}/${season || 1}/${episode || 1}`;
  }

  return buildProxiedResponse(upstreamUrl);
}
