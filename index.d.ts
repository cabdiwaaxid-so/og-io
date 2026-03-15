/**
 * Open Graph Meta Tags Fetcher SDK
 */

export interface StandardTags {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  favicon: string | null;
}

export interface OGTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  site_name?: string;
  [key: string]: string | undefined;
}

export interface TwitterTags {
  card?: string;
  site?: string;
  title?: string;
  description?: string;
  image?: string;
  [key: string]: string | undefined;
}

export interface SEOData {
  standard: StandardTags;
  og: OGTags;
  twitter: TwitterTags;
  other?: Record<string, string>;
  html?: string;
}

export interface FetchOptions {
  baseUrl?: string;
  includeAllMeta?: boolean;
  includeHtml?: boolean;
}

/**
 * Sets the base URL for the OG fetcher API
 */
export function setBaseUrl(url: string): void;

/**
 * Sets a custom fetch implementation
 */
export function setFetch(fetchFn: typeof fetch): void;

/**
 * Fetches Open Graph and SEO metadata from a URL
 */
export function og(url: string, options?: FetchOptions): Promise<SEOData>;