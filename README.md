# OG-io

A lightweight, universal SDK for fetching and parsing Open Graph, Twitter Card, and SEO metadata from any URL. Works seamlessly in browsers, Node.js, Deno, and Bun.

## Features

- 🚀 **Universal** - Works in browsers, Node.js, Deno, Bun, and edge environments
- 🔧 **Flexible** - Use your own backend server or the default public API
- 📦 **Lightweight** - Zero dependencies for the client SDK
- 🎯 **Accurate** - Properly parses Open Graph, Twitter Cards, and standard meta tags
- 🔄 **CORS-friendly** - Built for use with your own backend API or the hosted service
- 📝 **TypeScript** - Full type definitions included

## Installation

```bash
npm install @cabdi_waaxid/og-io
```

## Quick Start

### Using the Default Public API (No Backend Required)

The SDK comes pre-configured to use the public API at `https://og-io.vercel.app/` - no setup required!

```javascript
// Browser or Node.js with fetch polyfill
import { og } from '@cabdi_waaxid/og-io';

// Just works out of the box!
const data = await og('https://github.com');
console.log(data.standard.title); // GitHub: Let's build from here
console.log(data.og.image); // https://github.githubassets.com/images/modules/open_graph/github-logo.png
```

### Using Your Own Backend Server

You can also use your own backend server for complete control:

```javascript
import { og, setBaseUrl } from '@cabdi_waaxid/og-io';

// Point to your own backend server
setBaseUrl('https://your-og-server.com');

const data = await og('https://example.com');
```

## Architecture

OG-io consists of two parts:

1. **Client SDK** (this package) - Universal JavaScript library for making requests
2. **Server API** - Backend service that fetches and parses metadata
   - **Default Public API**: `https://og-io.vercel.app/` (free to use)
   - **Custom Server**: You can host your own backend

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

Sets a custom base URL for the OG fetcher API.

```javascript
setBaseUrl('https://your-og-server.com');
```

#### `resetBaseUrl()`

Resets the base URL to the default public API (`https://og-io.vercel.app/`).

```javascript
resetBaseUrl();
```

#### `getBaseUrl()`

Returns the current base URL being used.

```javascript
console.log(getBaseUrl()); // 'https://og-io.vercel.app/' or your custom URL
```

#### `setFetch(fetchFn)`

Sets a custom fetch implementation (required for Node.js).

```javascript
// Node.js
import fetch from 'node-fetch';
setFetch(fetch);
```

### Constants

#### `DEFAULT_BASE_URL`

The default public API endpoint.

```javascript
import { DEFAULT_BASE_URL } from '@cabdi_waaxid/og-io';
console.log(DEFAULT_BASE_URL); // 'https://og-io.vercel.app'
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

### Basic Usage with Default API

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

### Using Custom Backend Server

```javascript
import { og, setBaseUrl } from '@cabdi_waaxid/og-io';

// Switch to your own backend
setBaseUrl('https://my-og-server.com');

// All subsequent calls will use your server
const data = await og('https://example.com');

// Switch back to default public API if needed
resetBaseUrl();
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
import { og, setFetch } from '@cabdi_waaxid/og-io';
import fetch from 'node-fetch';

// Required for Node.js environments
setFetch(fetch);

// Uses default public API at https://og-io.vercel.app
const data = await og('https://example.com');
```

### Browser with Global Object

```html
<script src="https://cdn.jsdelivr.net/npm/@cabdi_waaxid/og-io@latest/index.js"></script>
<script>
  // Available as window.ogFetcher
  // Uses default public API automatically
  ogFetcher.og('https://example.com').then(data => {
    console.log(data.og.title);
  });
  
  // Or use your own server
  ogFetcher.setBaseUrl('https://your-server.com');
</script>
```

### ES Modules Import

```javascript
// Named imports
import { og, setBaseUrl, resetBaseUrl, DEFAULT_BASE_URL } from '@cabdi_waaxid/og-io';

// Default import
import ogFetcher from '@cabdi_waaxid/og-io';
ogFetcher.og('https://example.com');
```

## Error Handling

```javascript
try {
  const data = await og('https://example.com');
} catch (error) {
  console.error(error.message);
}
```

## Environment Support

| Environment | Support | Notes |
|------------|---------|-------|
| Browsers | ✅ Full | Uses native fetch, default API works out of the box |
| Node.js | ✅ Full | Requires setFetch(), default API works with polyfill |
| Deno | ✅ Full | Uses native fetch, default API works out of the box |
| Bun | ✅ Full | Uses native fetch, default API works out of the box |
| Cloudflare Workers | ✅ Full | Uses native fetch, default API works out of the box |
| React Native | ✅ Full | May need polyfill, default API works with fetch support |

The default public API at `https://og-io.vercel.app/` is free to use. For production applications with high volume, consider [hosting your own backend server](#hosting-your-own-backend-server).

## Hosting Your Own Backend Server

The package includes a sample server using `novaxjs2`:

[Server file code](https://github.com/cabdiwaaxid-so/og-io/api/index.js)

```bash
# Install server dependencies
npm install axios cheerio novaxjs2

# Run the server
node index.js
# Server running on port 3000
```

Then configure your client:

```javascript
setBaseUrl('http://localhost:3000');
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

[MIT © Cabdi Waaxid Siciid](https://github.com/cabdiwaaxid-so/og-io/src/LICENSE)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/cabdiwaaxid-so/og-io).