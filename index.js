/**
 * OG.io - A lightweight library for fetching and parsing Open Graph, Twitter Card, and standard meta data from web pages.
 * @version 1.0.0
 * @license MIT
 * @author Cabdi Waaxid Siciid
 * @description This library provides a simple interface to fetch and parse Open Graph, Twitter Card, and standard meta tags from a given URL. It supports custom fetch options, timeout settings, and can include raw HTML and response headers in the output.
 * @async
 * @function og
 * @param {string} ogUrl - The URL to fetch and parse meta data from.
 * @param {Object} [options] - Optional configuration.
 * @param {Object} [options.fetchOptions] - Custom fetch options.
 * @param {boolean} [options.includeAllMeta=false] - Whether to include all meta tags.
 * @param {boolean} [options.includeHtml=false] - Whether to include the raw HTML.
 * @param {boolean} [options.includeResponseHeaders=false] - Whether to include response headers.
 * @param {number} [options.timeout=5000] - Request timeout in milliseconds.
 * @returns {Promise<Object>} A promise that resolves to an object containing parsed meta data.
 */
async function og(ogUrl, options = {}) {
  const {
    fetchOptions = {},
    includeAllMeta = false,
    includeHtml = false,
    includeResponseHeaders = false,
    timeout = 5000
  } = options;

  try {
    // Validate URL
    if (!isValidUrl(ogUrl)) {
      throw new Error('Invalid URL provided');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(ogUrl)}`;
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const result = parseOpenGraphData(data.contents, { includeAllMeta });

    // Additional metadata extraction
    const titleMatch = data.contents.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch && !result.standard?.title) {
      result.standard = result.standard || {};
      result.standard.title = titleMatch[1].trim();
    }

    // Extract canonical URL
    const canonicalMatch = data.contents.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      result.standard = result.standard || {};
      result.standard.canonicalUrl = canonicalMatch[1];
    }

    // Extract favicon
    const faviconMatch = data.contents.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (faviconMatch) {
      result.standard = result.standard || {};
      result.standard.favicon = absoluteUrl(faviconMatch[1], ogUrl);
    }

    if (includeHtml) {
      result.html = data.contents;
    }

    if (includeResponseHeaders) {
      result.headers = {
        'content-type': res.headers.get('content-type'),
        'content-length': res.headers.get('content-length'),
        'last-modified': res.headers.get('last-modified')
      };
    }

    return result;
  } catch (err) {
    // Enhanced error information
    const error = new Error(`Failed to fetch metadata: ${err.message}`);
    error.originalError = err;
    error.url = ogUrl;
    throw error;
  }
}

/**
 * Parses HTML content to extract Open Graph, Twitter Card, standard meta tags, and additional metadata.
 * @function parseOpenGraphData
 * @param {string} html - The HTML content to parse.
 * @param {Object} [options] - Optional configuration.
 * @param {boolean} [options.includeAllMeta=false] - Whether to include all meta tags.
 * @returns {Object} An object containing categorized meta data with properties:
 *                  - standard: Standard meta tags (title, description, etc.)
 *                  - og: Open Graph meta tags
 *                  - twitter: Twitter Card meta tags
 *                  - other: Other meta tags (when includeAllMeta is true)
 */
function parseOpenGraphData(html, options = {}) {
  const { includeAllMeta = false } = options;
  const metaTagRegex = /<meta\s+([^>]*)\s*\/?>/gi;
  const linkTagRegex = /<link\s+([^>]*)\s*\/?>/gi;
  const propertyRegex = /property=["'](og:|twitter:|article:|product:)([^"']+)["']/i;
  const nameRegex = /name=["'](twitter:|description|keywords|viewport|robots|generator|theme-color|author)([^"']*)["']/i;
  const contentRegex = /content=["']([^"']*)["']/i;
  
  const metaData = {
    standard: {},
    og: {},
    twitter: {},
    ...(includeAllMeta && { other: {} })
  };
  
  // Parse meta tags
  let match;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const metaAttributes = match[1];
    const propertyMatch = metaAttributes.match(propertyRegex);
    const nameMatch = metaAttributes.match(nameRegex);
    const contentMatch = metaAttributes.match(contentRegex);
    
    if (!contentMatch) continue;
    const content = contentMatch[1];
    
    if (propertyMatch) {
      const namespace = propertyMatch[1];
      const fullProperty = propertyMatch[2];
      const property = fullProperty.replace(/:([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (namespace === 'og:') {
        metaData.og[property] = content;
      } else if (namespace === 'twitter:') {
        metaData.twitter[property] = content;
      } else if (includeAllMeta) {
        metaData.other[`${namespace}${fullProperty}`] = content;
      }
    } else if (nameMatch) {
      const fullName = nameMatch[1] + nameMatch[2];
      
      if (fullName.startsWith('twitter:')) {
        const property = fullName.replace('twitter:', '').replace(/:([a-z])/g, (_, letter) => letter.toUpperCase());
        metaData.twitter[property] = content;
      } else {
        switch (nameMatch[1]) {
          case 'description':
          case 'keywords':
          case 'viewport':
          case 'robots':
          case 'generator':
          case 'theme-color':
          case 'author':
            metaData.standard[nameMatch[1]] = content;
            break;
          default:
            if (includeAllMeta) {
              metaData.other[fullName] = content;
            }
        }
      }
    } else if (metaAttributes.includes('charset=')) {
      const charsetMatch = metaAttributes.match(/charset=["']?([^"'\s>]+)/i);
      if (charsetMatch) {
        metaData.standard.charset = charsetMatch[1];
      }
    } else if (includeAllMeta) {
      // Capture other meta tags when includeAllMeta is true
      const nameMatch = metaAttributes.match(/name=["']([^"']+)["']/i);
      if (nameMatch) {
        metaData.other[nameMatch[1]] = content;
      }
    }
  }
  
  // Parse link tags for additional metadata
  while ((match = linkTagRegex.exec(html)) !== null) {
    const linkAttributes = match[1];
    const relMatch = linkAttributes.match(/rel=["']([^"']+)["']/i);
    const hrefMatch = linkAttributes.match(/href=["']([^"']+)["']/i);
    
    if (relMatch && hrefMatch && includeAllMeta) {
      metaData.other.links = metaData.other.links || [];
      metaData.other.links.push({
        rel: relMatch[1],
        href: hrefMatch[1]
      });
    }
  }
  
  // Clean up empty categories
  if (Object.keys(metaData.standard).length === 0) delete metaData.standard;
  if (Object.keys(metaData.og).length === 0) delete metaData.og;
  if (Object.keys(metaData.twitter).length === 0) delete metaData.twitter;
  if (includeAllMeta && Object.keys(metaData.other).length === 0) delete metaData.other;
  
  return metaData;
}

/**
 * Validates a URL string.
 * @private
 * @function isValidUrl
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a relative URL to absolute using a base URL.
 * @private
 * @function absoluteUrl
 * @param {string} relativeUrl - The relative URL.
 * @param {string} baseUrl - The base URL.
 * @returns {string} The absolute URL.
 */
function absoluteUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

//--- Export for different environments ---

if (typeof module !== 'undefined' && module.exports) {
  module.exports = og;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    return og;
  });
} else if (typeof window !== 'undefined') {
  window.og = og;
} else if (typeof global !== 'undefined') {
  global.og = og;
} else {
  throw new Error('Unable to export og function: unknown environment');
}