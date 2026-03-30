import * as cheerio from 'cheerio';

// Helper to get KV, handling missing environment variables gracefully
async function getKV() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv');
      return kv;
    }
  } catch (e) {
    console.warn('Vercel KV module found but could not be initialized:', e.message);
  }
  return null;
}

let kvPromise = getKV();

// Constants
const CACHE_TTL = 3600; // 1 hour in seconds
const IN_MEMORY_TTL = 60000; // 1 minute in ms
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS_PER_WINDOW = 100;
const FETCH_TIMEOUT = 8000; // 8 seconds

// In-memory cache for ultra-fast hits and deduplication
// In serverless, this persists across requests to the same instance
const memoryCache = new Map();
const pendingRequests = new Map();

/**
 * Rate limiting helper using Vercel KV
 */
async function isRateLimited(ip, kv) {
  if (!kv) return false;
  try {
    const key = `ratelimit:${ip}`;
    const requests = await kv.incr(key);
    if (requests === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW);
    }
    return requests > MAX_REQUESTS_PER_WINDOW;
  } catch (err) {
    console.error('Rate limit error:', err.message);
    return false; // Fail open
  }
}

/**
 * Metadata extraction logic
 */
async function fetchMetadata(url, options = {}) {
  const { includeAllMeta, includeHtml } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`External site returned ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error('URL did not return HTML content');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seo = {
      standard: {
        title: $('title').first().text().trim() || $('meta[name="title"]').attr('content') || null,
        description: $('meta[name="description"]').attr('content') ||
                     $('meta[name="Description"]').attr('content') || null,
        canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
        favicon: $('link[rel="icon"]').attr('href') ||
                 $('link[rel="shortcut icon"]').attr('href') ||
                 $('link[rel="apple-touch-icon"]').attr('href') || null,
      },
      og: {},
      twitter: {}
    };

    // Open Graph tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property')?.replace('og:', '');
      const content = $(el).attr('content');
      if (property && content) seo.og[property] = content;
    });

    // Twitter tags
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')?.replace('twitter:', '');
      const content = $(el).attr('content');
      if (name && content) seo.twitter[name] = content;
    });

    if (includeAllMeta === 'true' || includeAllMeta === true) {
      seo.other = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          seo.other[name] = content;
        }
      });
    }

    if (includeHtml === 'true' || includeHtml === true) {
      seo.html = html;
    }

    return seo;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request to external site timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req, res) {
  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, includeAllMeta, includeHtml } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  let normalizedUrl;
  try {
    normalizedUrl = new URL(url).toString();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  const kv = await kvPromise;

  // 1. Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  if (await isRateLimited(ip, kv)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const cacheKey = `og:${normalizedUrl}:m${includeAllMeta}:h${includeHtml}`;

  // 2. Memory Cache Check
  const memCached = memoryCache.get(cacheKey);
  if (memCached && Date.now() < memCached.expiry) {
    res.setHeader('X-Cache', 'HIT-MEMORY');
    return res.json(memCached.data);
  }

  // 3. Request Deduplication
  if (pendingRequests.has(cacheKey)) {
    try {
      const result = await pendingRequests.get(cacheKey);
      res.setHeader('X-Cache', 'DEDUPLICATED');
      return res.json(result);
    } catch (err) {
      // If the original request failed, we'll fall through and retry or error
    }
  }

  // 4. Distributed Cache Check
  if (kv) {
    try {
      const distributedCached = await kv.get(cacheKey);
      if (distributedCached) {
        memoryCache.set(cacheKey, {
          data: distributedCached,
          expiry: Date.now() + IN_MEMORY_TTL
        });
        res.setHeader('X-Cache', 'HIT-KV');
        return res.json(distributedCached);
      }
    } catch (err) {
      console.error('KV get error:', err.message);
    }
  }

  // 5. Fetch and Parse
  const fetchPromise = (async () => {
    try {
      const seoData = await fetchMetadata(normalizedUrl, { includeAllMeta, includeHtml });

      // Save to KV (Non-blocking)
      if (kv) {
        kv.set(cacheKey, seoData, { ex: CACHE_TTL }).catch(e => console.error('KV set error:', e.message));
      }

      // Save to Memory
      memoryCache.set(cacheKey, {
        data: seoData,
        expiry: Date.now() + IN_MEMORY_TTL
      });

      return seoData;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);

  try {
    const result = await fetchPromise;
    res.setHeader('X-Cache', 'MISS');
    return res.json(result);
  } catch (err) {
    console.error(`Metadata extraction failed for ${normalizedUrl}:`, err.message);
    return res.status(500).json({
      error: 'Failed to extract metadata',
      message: err.message
    });
  }
}
