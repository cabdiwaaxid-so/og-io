import novax from'novaxjs2';
import axios from'axios';
import * as cheerio from 'cheerio';

const app = new novax();
app.cors({
  origins: ['*'],
  methods: ['GET']
});

async function getSEO(url, includeAllMeta, includeHtml) {
  if(!url) throw { error: 'URL is required' };

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const seo = {
    standard: {},
    og: {},
    twitter: {}
  };

  // Standard tags
  seo.standard.title = $('title').text() || null;
  seo.standard.description = $('meta[name="description"]').attr('content') || null;
  seo.standard.canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  seo.standard.favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || null;

  // Open Graph tags
  $('meta[property^="og:"]').each((i, el) => {
    const property = $(el).attr('property').replace('og:', '');
    seo.og[property] = $(el).attr('content');
  });

  // Twitter tags
  $('meta[name^="twitter:"]').each((i, el) => {
    const name = $(el).attr('name').replace('twitter:', '');
    seo.twitter[name] = $(el).attr('content');
  });

  // All meta tags
  if(includeAllMeta) {
    seo.other = {};
    $('meta').each((i, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const content = $(el).attr('content');
      if(name && content) {
        seo.other[name] = content;
      }
    });
  }

  // Include HTML
  if(includeHtml) {
    seo.html = html;
  }

  return seo;
}

app.get('/api/og', async(req, res) => {
  try {
    const { url, includeAllMeta, includeHtml } = req.query;
    const seo = await getSEO(url,includeAllMeta,includeHtml);
    res.json(seo);
  } catch(err) {
    res.json(err);
    console.log(err);
  }
});

app.at(3000, '0.0.0.0', () => console.log('Server is running on port 3000'))
