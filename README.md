# OG-io

A lightweight library for fetching and parsing Open Graph, Twitter Card, and standard meta data from web pages.

## Features

- Fetch and parse Open Graph, Twitter Card, and standard meta tags from any URL
- Supports custom fetch options and timeout settings
- Optionally include raw HTML and response headers in the output
- Automatic URL validation and relative-to-absolute URL conversion
- Lightweight with no external dependencies (uses native Fetch API)

## Installation

### Node.js

```bash
npm install og-io
```

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/og-io@1.0.0/index.min.js"></script>
```

## Usage

### Basic Usage

```javascript
import og from 'og-io';

try {
  const result = await og('https://example.com');
  console.log(result);
} catch (error) {
  console.error('Error fetching metadata:', error);
}
```

### Advanced Usage with Options

```javascript
const result = await og('https://example.com', {
  fetchOptions: {
    headers: {
      'User-Agent': 'MyCustomUserAgent/1.0'
    }
  },
  includeAllMeta: true,
  includeHtml: true,
  includeResponseHeaders: true,
  timeout: 10000 // 10 seconds
});
```

## API Reference

### `og(url, [options])`

#### Parameters

- `url` (String): The URL to fetch and parse meta data from.
- `options` (Object): Optional configuration.
  - `fetchOptions` (Object): Custom fetch options.
  - `includeAllMeta` (Boolean): Whether to include all meta tags (default: `false`).
  - `includeHtml` (Boolean): Whether to include the raw HTML (default: `false`).
  - `includeResponseHeaders` (Boolean): Whether to include response headers (default: `false`).
  - `timeout` (Number): Request timeout in milliseconds (default: `5000`).

#### Returns

Returns a Promise that resolves to an object containing parsed meta data with the following structure:

```javascript
{
  standard: {
    title: 'Page Title',
    description: 'Page description',
    canonicalUrl: 'https://example.com/canonical',
    favicon: 'https://example.com/favicon.ico',
    // Other standard meta tags...
  },
  og: {
    title: 'Open Graph Title',
    description: 'Open Graph Description',
    image: 'https://example.com/og-image.jpg',
    // Other Open Graph tags...
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Card Title',
    // Other Twitter Card tags...
  },
  other: {
    // Other meta tags when includeAllMeta is true
  },
  html: '<html>...</html>', // When includeHtml is true
  headers: {
    // Response headers when includeResponseHeaders is true
  }
}
```

## Response Structure

The library categorizes meta tags into the following groups:

1. **standard**: Standard meta tags like title, description, keywords, etc.
2. **og**: Open Graph meta tags (prefixed with `og:`)
3. **twitter**: Twitter Card meta tags (prefixed with `twitter:`)
4. **other**: Other meta tags (only included when `includeAllMeta` is true)
5. **html**: Raw HTML content (only included when `includeHtml` is true)
6. **headers**: Response headers (only included when `includeResponseHeaders` is true)

## Error Handling

The library throws errors with enhanced information when something goes wrong:

```javascript
try {
  const result = await og('invalid-url');
} catch (error) {
  console.error(error.message); // "Failed to fetch metadata: Invalid URL provided"
  console.error(error.url); // "invalid-url"
  console.error(error.originalError); // Original error object
}
```

## Examples

### Get Basic Metadata

```javascript
const { standard, og, twitter } = await og('https://example.com');
```

### Get All Metadata Including Raw HTML

```javascript
const result = await og('https://example.com', {
  includeAllMeta: true,
  includeHtml: true
});
```

### Custom Fetch Options

```javascript
const result = await og('https://example.com', {
  fetchOptions: {
    headers: {
      'Accept-Language': 'en-US'
    }
  }
});
```

## License

[MIT](https://github.com/cabdiwaaxid-so/og-io/blob/main/LICENSE)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Author

Cabdi Waaxid Siciid