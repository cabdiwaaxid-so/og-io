/**
 * Open Graph Meta Tags Fetcher SDK
 * A universal JavaScript library for fetching Open Graph metadata from URLs
 * @module og-fetcher
 */

/**
 * @typedef {Object} SEOData
 * @property {StandardTags} standard - Standard HTML meta tags
 * @property {OGTags} og - Open Graph protocol tags
 * @property {TwitterTags} twitter - Twitter Card tags
 * @property {Object.<string, string>} [other] - All other meta tags (when includeAllMeta is true)
 * @property {string} [html] - Raw HTML content (when includeHtml is true)
 */

/**
 * @typedef {Object} StandardTags
 * @property {string|null} title - Page title
 * @property {string|null} description - Meta description
 * @property {string|null} canonicalUrl - Canonical URL
 * @property {string|null} favicon - Favicon URL
 */

/**
 * @typedef {Object} OGTags
 * @property {string} [title] - Open Graph title
 * @property {string} [description] - Open Graph description
 * @property {string} [image] - Open Graph image URL
 * @property {string} [url] - Open Graph URL
 * @property {string} [type] - Open Graph type
 * @property {string} [site_name] - Site name
 */

/**
 * @typedef {Object} TwitterTags
 * @property {string} [card] - Twitter card type
 * @property {string} [site] - Twitter site
 * @property {string} [title] - Twitter title
 * @property {string} [description] - Twitter description
 * @property {string} [image] - Twitter image URL
 */

/**
 * @typedef {Object} FetchOptions
 * @property {string} [baseUrl] - Override the base URL for the API
 * @property {boolean} [includeAllMeta] - Include all meta tags in response
 * @property {boolean} [includeHtml] - Include raw HTML in response
 */

let BASE_URL = 'http://localhost:3000';
let customFetch = null;

/**
 * Sets the base URL for the OG fetcher API
 * @param {string} url - The base URL of the OG fetcher server
 * @example
 * setBaseUrl('https://your-og-server.com');
 */
function setBaseUrl(url) {
  BASE_URL = url;
}

/**
 * Sets a custom fetch implementation
 * @param {Function} fetchFn - Custom fetch function compatible with the Fetch API
 * @example
 * // Use with node-fetch in Node.js
 * const fetch = require('node-fetch');
 * setFetch(fetch);
 */
function setFetch(fetchFn) {
  customFetch = fetchFn;
}

/**
 * Gets the appropriate fetch implementation
 * @private
 * @returns {Function} Fetch implementation
 * @throws {Error} If no fetch implementation is available
 */
function getFetch() {
  if (customFetch) return customFetch;
  if (typeof fetch !== 'undefined') return fetch;
  
  throw new Error(
    'No fetch implementation found. Please provide one using setFetch().\n' +
    'In Node.js: setFetch(require("node-fetch"));\n' +
    'In browsers: make sure fetch is supported or provide a polyfill.'
  );
}

/**
 * Fetches Open Graph and SEO metadata from a URL
 * @async
 * @param {string} url - The URL to fetch metadata from
 * @param {FetchOptions} [options] - Fetch options
 * @returns {Promise<SEOData>} SEO metadata including Open Graph, Twitter, and standard tags
 * @throws {Error} If URL is not provided or request fails
 * 
 * @example
 * // Basic usage in browser
 * const data = await og('https://example.com');
 * console.log(data.og.title);
 * 
 * @example
 * // With all meta tags included
 * const data = await og('https://example.com', {
 *   includeAllMeta: true,
 *   includeHtml: false
 * });
 * 
 * @example
 * // Node.js usage
 * const fetch = require('node-fetch');
 * setFetch(fetch);
 * setBaseUrl('https://your-og-server.com');
 * 
 * const data = await og('https://example.com');
 */
async function og(url, options = {}) {
  if (!url) throw new Error('URL is required');

  const baseUrl = options.baseUrl || BASE_URL;

  const params = new URLSearchParams({ url });

  if (options.includeAllMeta) params.append('includeAllMeta', 'true');
  if (options.includeHtml) params.append('includeHtml', 'true');

  const fetchImpl = getFetch();

  const response = await fetchImpl(`${baseUrl}/api/og?${params}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Create the API object
const api = {
  og,
  setBaseUrl,
  setFetch
};

// Environment detection and exports
(function(global) {
  if (typeof window !== 'undefined' && window) {
    // Browser environment
    window.ogFetcher = api;
  } else if (typeof globalThis !== 'undefined') {
    // Modern environments with globalThis
    globalThis.ogFetcher = api;
  } else if (typeof self !== 'undefined') {
    // Web Workers
    self.ogFetcher = api;
  } else if (typeof global !== 'undefined') {
    // Node.js global object
    global.ogFetcher = api;
  }
  
  // For Node.js CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  
  // For ES modules - export as named exports
})(typeof globalThis !== 'undefined' ? globalThis : 
   typeof global !== 'undefined' ? global : 
   typeof window !== 'undefined' ? window : 
   typeof self !== 'undefined' ? self : {});

// ES Module exports
export { og, setBaseUrl, setFetch };
export default api;