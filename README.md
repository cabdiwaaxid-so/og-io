# OG-io

A lightweight, universal SDK for fetching and parsing Open Graph, Twitter Card, and SEO metadata from any URL. Works seamlessly in browsers, Node.js, Deno, and Bun.

## Features

- 🚀 **Universal** - Works in browsers, Node.js, Deno, Bun, and edge environments
- 🔧 **Flexible** - Use your own fetch implementation (node-fetch, undici, etc.)
- 📦 **Lightweight** - Zero dependencies for the client SDK
- 🎯 **Accurate** - Properly parses Open Graph, Twitter Cards, and standard meta tags
- 🔄 **CORS-friendly** - Built for use with your own backend API
- 📝 **TypeScript** - Full type definitions included

## Installation

```bash
npm install @cabdi_waaxid/og-io
```

## Architecture

OG-io consists of two parts:
1. **Client SDK** (this package) - Universal JavaScript library for making requests
2. **Server API** - Your backend service that fetches and parses the actual metadata

### Use the client SDK

```javascript
// client.js - Browser or Node.js
import { og, setBaseUrl } from '@cabdi_waaxid/og-io';

// Point to your backend server
setBaseUrl('https://your-server.com');

// Fetch metadata
const data = await og('https://example.com');
console.log(data.standard.title);
console.log(data.og.image);
console.log(data.twitter.card);
```

## API Reference

### Core Functions

#### `og(url, options)`

Fetches Open Graph and SEO metadata from a URL.

**Parameters:**
- `url` (string) - The URL to fetch metadata from
- `options` (object) - Optional configuration
  - `baseUrl` (string) - Override the base URL for this request
  - `includeAllMeta` (boolean) - Include all meta tags in response
  - `includeHtml` (boolean) - Include raw HTML in response

**Returns:** `Promise<SEOData>`

#### `setBaseUrl(url)`

Sets the base URL for the OG fetcher API.

```javascript
setBaseUrl('https://your-og-server.com');
```

#### `setFetch(fetchFn)`

Sets a custom fetch implementation (required for Node.js).

```javascript
// Node.js
import fetch from 'node-fetch';
setFetch(fetch);
```

### Response Types

#### `SEOData`

```typescript
interface SEOData {
  standard: StandardTags;     // Standard HTML meta tags
  og: OGTags;                  // Open Graph protocol tags
  twitter: TwitterTags;        // Twitter Card tags
  other?: Record<string, string>; // All other meta tags (when includeAllMeta is true)
  html?: string;               // Raw HTML content (when includeHtml is true)
}
```

#### `StandardTags`

```typescript
interface StandardTags {
  title: string | null;        // Page title
  description: string | null;  // Meta description
  canonicalUrl: string | null; // Canonical URL
  favicon: string | null;      // Favicon URL
}
```

#### `OGTags`

```typescript
interface OGTags {
  title?: string;              // Open Graph title
  description?: string;        // Open Graph description
  image?: string;              // Open Graph image URL
  url?: string;                // Open Graph URL
  type?: string;               // Open Graph type
  site_name?: string;          // Site name
  [key: string]: string | undefined; // Other Open Graph tags
}
```

#### `TwitterTags`

```typescript
interface TwitterTags {
  card?: string;               // Twitter card type
  site?: string;               // Twitter site
  title?: string;              // Twitter title
  description?: string;        // Twitter description
  image?: string;              // Twitter image URL
  [key: string]: string | undefined; // Other Twitter tags
}
```

## Usage Examples

### Basic Usage

```javascript
import { og } from '@cabdi_waaxid/og-io';

try {
  const data = await og('https://github.com');
  console.log('Title:', data.standard.title);
  console.log('Description:', data.standard.description);
  console.log('OG Image:', data.og.image);
  console.log('Twitter Card:', data.twitter.card);
} catch (error) {
  console.error('Failed:', error.message);
}
```

### Include All Meta Tags

```javascript
const data = await og('https://example.com', {
  includeAllMeta: true
});

// Access any meta tag
console.log(data.other['viewport']);
console.log(data.other['theme-color']);
```

### Include Raw HTML

```javascript
const data = await og('https://example.com', {
  includeHtml: true
});

// Raw HTML for custom parsing
console.log(data.html.substring(0, 200) + '...');
```

### Node.js with node-fetch

```javascript
import { og, setFetch, setBaseUrl } from '@cabdi_waaxid/og-io';
import fetch from 'node-fetch';

// Required for Node.js environments
setFetch(fetch);
setBaseUrl('https://your-og-server.com');

const data = await og('https://example.com');
```

### Browser with Global Object

```html
<script src="https://cdn.jsdelivr.net/npm/@cabdi_waaxid/og-io@latest/index.js"></script>
<script>
  // Available as window.ogFetcher
  ogFetcher.setBaseUrl('https://your-server.com');
  
  ogFetcher.og('https://example.com').then(data => {
    console.log(data.og.title);
  });
</script>
```

### ES Modules Import

```javascript
// Named imports
import { og, setBaseUrl, setFetch } from '@cabdi_waaxid/og-io';

// Default import
import ogFetcher from '@cabdi_waaxid/og-io';
ogFetcher.og('https://example.com');
```

## Error Handling

```javascript
try {
  const data = await og('https://example.com');
} catch (error) {
  console.error(error.message); // "Request failed with status 404: Not Found"
}
```

## Environment Support

| Environment | Support | Notes |
|------------|---------|-------|
| Browsers | ✅ Full | Uses native fetch |
| Node.js | ✅ Full | Requires setFetch() |
| Deno | ✅ Full | Uses native fetch |
| Bun | ✅ Full | Uses native fetch |
| Cloudflare Workers | ✅ Full | Uses native fetch |
| React Native | ✅ Full | May need polyfill |

### Using the Included Server

The package includes a sample server using `novaxjs2`:

```bash
# Install server dependencies
npm install axios cheerio novaxjs2

# Run the server
node server.js
# Server running on port 3000
```

## TypeScript Support

Full type definitions are included:

```typescript
import { og, type SEOData, type FetchOptions } from '@cabdi_waaxid/og-io';

const options: FetchOptions = {
  includeAllMeta: true
};

const data: SEOData = await og('https://example.com', options);

if (data.og.image) {
  console.log(data.og.image);
}
```

## License

MIT © Cabdi Waaxid Siciid

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/cabdiwaaxid-so/og-io).