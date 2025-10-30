/**
 * Cloudflare Worker to continuously populate Glint Analytics API with test data
 * 
 * This worker runs on a cron schedule (e.g., every minute) to hit your API
 * from Cloudflare's edge locations, simulating traffic from different regions.
 * 
 * Setup:
 * 1. Deploy this to Cloudflare Workers
 * 2. Set GLINT_API_URL in Worker settings/secrets
 * 3. Set up a cron trigger
 * 
 * Or call it manually by hitting the worker URL
 */

export interface Env {
  GLINT_API_URL?: string; // Your Glint API URL, e.g., https://your-app.vercel.app/api/trackAnalytics
  LIVE_SITE?: string; // Alternative: base URL, will append /api/trackAnalytics
  GLINT_API_KEY?: string; // Optional: API key for authentication (if you add auth to your API)
}

const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX', 'ES', 'IT', 'NL', 'SE'];
const REGIONS = [
  'California', 'New York', 'Texas', 'London', 'Ontario', 'NSW',
  'Bavaria', 'Île-de-France', 'Tokyo', 'São Paulo', 'Madrid', 'Lombardy'
];
const CITIES = [
  'San Francisco', 'New York', 'Austin', 'London', 'Toronto', 'Sydney',
  'Munich', 'Paris', 'Tokyo', 'São Paulo', 'Madrid', 'Milan'
];
const REFERRERS = [
  'google.com',
  'twitter.com',
  'facebook.com',
  'reddit.com',
  'github.com',
  'direct',
  'news.ycombinator.com',
  'linkedin.com',
  'youtube.com',
  'medium.com',
  'producthunt.com',
  'dev.to'
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendAnalytics(apiUrl: string, type: string, payload: any, apiKey?: string): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare-Worker/Glint-Pump',
    };
    
    // Add API key if provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send ${type}: ${response.status} - ${errorText}`);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error(`Error sending ${type}:`, error);
    return false;
  }
}

function getApiUrl(env: Env): string {
  if (env.GLINT_API_URL) {
    return env.GLINT_API_URL;
  }
  if (env.LIVE_SITE) {
    // Remove trailing slash if present
    const baseUrl = env.LIVE_SITE.replace(/\/$/, '');
    return `${baseUrl}/api/trackAnalytics`;
  }
  throw new Error('Either GLINT_API_URL or LIVE_SITE must be configured');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let apiUrl: string;
    try {
      apiUrl = getApiUrl(env);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'API URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get location info from Cloudflare (CF-Country header available in workers)
    const country = request.headers.get('CF-IPCountry') || randomChoice(COUNTRIES);
    const region = randomChoice(REGIONS);
    const city = randomChoice(CITIES);
    const referrer = randomChoice(REFERRERS);

    // Generate multiple analytics events
    const results = await Promise.all([
      sendAnalytics(apiUrl, 'location', {
        country,
        region,
        city,
        visitCount: randomInt(1, 5),
      }, env.GLINT_API_KEY),
      sendAnalytics(apiUrl, 'referral', {
        source: referrer,
        visitCount: randomInt(1, 10),
      }, env.GLINT_API_KEY),
      sendAnalytics(apiUrl, 'traffic', {
        sourceName: referrer,
        visitCount: randomInt(1, 8),
      }, env.GLINT_API_KEY),
    ]);

    const successCount = results.filter(Boolean).length;

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        events: successCount,
        location: { country, region, city },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },

  // Cron trigger handler (runs on schedule)
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    let apiUrl: string;
    try {
      apiUrl = getApiUrl(env);
    } catch (error) {
      console.error('API URL not configured:', error instanceof Error ? error.message : 'Unknown error');
      return;
    }

    // Generate a small batch of events (3 events every 10 min = reasonable data flow)
    const batchSize = 3;
    const results: boolean[] = [];

    for (let i = 0; i < batchSize; i++) {
      const country = randomChoice(COUNTRIES);
      const region = randomChoice(REGIONS);
      const city = randomChoice(CITIES);
      const referrer = randomChoice(REFERRERS);

      const batchResults = await Promise.all([
        sendAnalytics(apiUrl, 'location', {
          country,
          region,
          city,
          visitCount: randomInt(1, 5),
        }, env.GLINT_API_KEY),
        sendAnalytics(apiUrl, 'referral', {
          source: referrer,
          visitCount: randomInt(1, 10),
        }, env.GLINT_API_KEY),
        sendAnalytics(apiUrl, 'traffic', {
          sourceName: referrer,
          visitCount: randomInt(1, 8),
        }, env.GLINT_API_KEY),
      ]);

      results.push(...batchResults);
    }

    const successCount = results.filter(r => r === true).length;
    console.log(`Cron job completed: ${successCount}/${results.length} events sent`);
  },
};

