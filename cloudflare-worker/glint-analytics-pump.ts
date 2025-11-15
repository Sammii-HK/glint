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

interface KVNamespace {
	get(key: string): Promise<string | null>;
	put(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
}

interface ScheduledEvent {
	scheduledTime: number;
	cron: string;
}

export interface Env {
	GLINT_API_URL?: string; // Your Glint API URL, e.g., https://your-app.vercel.app/api/trackAnalytics
	LIVE_SITE?: string; // Alternative: base URL, will append /api/trackAnalytics
	GLINT_API_KEY?: string; // Optional: API key for authentication (if you add auth to your API)
	PUSHOVER_USER?: string; // Pushover user key for notifications
	PUSHOVER_TOKEN?: string; // Pushover app token for notifications
	LAST_POST_KV?: KVNamespace; // KV namespace for tracking last successful post
}

const COUNTRIES = [
	"US",
	"GB",
	"CA",
	"AU",
	"DE",
	"FR",
	"JP",
	"BR",
	"IN",
	"MX",
	"ES",
	"IT",
	"NL",
	"SE",
];
const REGIONS = [
	"California",
	"New York",
	"Texas",
	"London",
	"Ontario",
	"NSW",
	"Bavaria",
	"Île-de-France",
	"Tokyo",
	"São Paulo",
	"Madrid",
	"Lombardy",
];
const CITIES = [
	"San Francisco",
	"New York",
	"Austin",
	"London",
	"Toronto",
	"Sydney",
	"Munich",
	"Paris",
	"Tokyo",
	"São Paulo",
	"Madrid",
	"Milan",
];
const REFERRERS = [
	"google.com",
	"twitter.com",
	"facebook.com",
	"reddit.com",
	"github.com",
	"direct",
	"news.ycombinator.com",
	"linkedin.com",
	"youtube.com",
	"medium.com",
	"producthunt.com",
	"dev.to",
];

function randomChoice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendAnalytics(
	apiUrl: string,
	type: string,
	payload: Record<string, unknown>,
	apiKey?: string
): Promise<boolean> {
	try {
		const headers: HeadersInit = {
			"Content-Type": "application/json",
			"User-Agent": "Cloudflare-Worker/Glint-Pump",
		};

		// Add API key if provided
		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`;
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers,
			body: JSON.stringify({ type, payload }),
		});

		// Read response body to prevent deadlock warning
		// We don't need the content, but must consume the body
		await response.text();

		if (!response.ok) {
			console.error(`❌ ${type} failed: ${response.status}`);
			return false;
		}

		return true;
	} catch {
		console.error(`❌ ${type} error`);
		return false;
	}
}

function getApiUrl(env: Env): string {
	if (env.GLINT_API_URL) {
		return env.GLINT_API_URL;
	}
	if (env.LIVE_SITE) {
		// Remove trailing slash if present
		const baseUrl = env.LIVE_SITE.replace(/\/$/, "");
		return `${baseUrl}/api/trackAnalytics`;
	}
	throw new Error("Either GLINT_API_URL or LIVE_SITE must be configured");
}

async function sendPushoverNotification(
	env: Env,
	title: string,
	message: string
): Promise<void> {
	if (!env.PUSHOVER_USER || !env.PUSHOVER_TOKEN) {
		return; // Pushover not configured, silently skip
	}

	try {
		const formData = new FormData();
		formData.append("token", env.PUSHOVER_TOKEN);
		formData.append("user", env.PUSHOVER_USER);
		formData.append("title", title);
		formData.append("message", message);
		formData.append("priority", "1"); // High priority
		formData.append("sound", "siren"); // Alert sound

		const response = await fetch("https://api.pushover.net/1/messages.json", {
			method: "POST",
			body: formData,
		});

		await response.text(); // Consume response body
	} catch (error) {
		console.error("Failed to send Pushover notification:", error);
	}
}

// Cleanup threshold: delete entries older than this (in hours)
const KV_CLEANUP_THRESHOLD_HOURS = 2; // Delete entries older than 2 hours

async function cleanupOldKVEntries(env: Env): Promise<void> {
	if (!env.LAST_POST_KV) {
		return; // KV not configured
	}

	try {
		const lastPostStr = await env.LAST_POST_KV.get("last_successful_post");
		if (!lastPostStr) {
			return; // No entry to clean up
		}

		const lastPostTime = parseInt(lastPostStr, 10);
		const now = Date.now();
		const hoursSinceLastPost = (now - lastPostTime) / (1000 * 60 * 60);

		// Delete entry if older than threshold
		if (hoursSinceLastPost > KV_CLEANUP_THRESHOLD_HOURS) {
			await env.LAST_POST_KV.delete("last_successful_post");
			console.log(
				`🧹 Cleaned up old KV entry (${Math.floor(hoursSinceLastPost)}h old)`
			);
		}
	} catch (error) {
		console.error("Error cleaning up KV entries:", error);
	}
}

async function checkAndAlertIfStale(env: Env): Promise<void> {
	if (!env.LAST_POST_KV || !env.PUSHOVER_USER || !env.PUSHOVER_TOKEN) {
		return; // Not configured, skip
	}

	try {
		const lastPostStr = await env.LAST_POST_KV.get("last_successful_post");
		if (!lastPostStr) {
			return; // No previous post recorded yet
		}

		const lastPostTime = parseInt(lastPostStr, 10);
		const now = Date.now();
		const hoursSinceLastPost = (now - lastPostTime) / (1000 * 60 * 60);

		if (hoursSinceLastPost > 1) {
			const hours = Math.floor(hoursSinceLastPost);
			const minutes = Math.floor((hoursSinceLastPost - hours) * 60);
			await sendPushoverNotification(
				env,
				"⚠️ Glint Analytics Worker Alert",
				`No data posted for ${hours}h ${minutes}m. Last successful post: ${new Date(
					lastPostTime
				).toISOString()}`
			);
		}
	} catch (error) {
		console.error("Error checking stale status:", error);
	}
}

async function updateLastPostTime(env: Env): Promise<void> {
	if (!env.LAST_POST_KV) {
		return; // KV not configured
	}

	try {
		await env.LAST_POST_KV.put("last_successful_post", Date.now().toString());
	} catch (error) {
		console.error("Error updating last post time:", error);
	}
}

const worker = {
	async fetch(request: Request, env: Env): Promise<Response> {
		let apiUrl: string;
		try {
			apiUrl = getApiUrl(env);
		} catch (error) {
			return new Response(
				JSON.stringify({
					error:
						error instanceof Error ? error.message : "API URL not configured",
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		// Get location info from Cloudflare (CF-Country header available in workers)
		const country =
			request.headers.get("CF-IPCountry") || randomChoice(COUNTRIES);
		const region = randomChoice(REGIONS);
		const city = randomChoice(CITIES);
		const referrer = randomChoice(REFERRERS);

		// Generate multiple analytics events sequentially to avoid deadlock
		const locationResult = await sendAnalytics(
			apiUrl,
			"location",
			{
				country,
				region,
				city,
				visitCount: randomInt(1, 5),
			},
			env.GLINT_API_KEY
		);

		const referralResult = await sendAnalytics(
			apiUrl,
			"referral",
			{
				source: referrer,
				visitCount: randomInt(1, 10),
			},
			env.GLINT_API_KEY
		);

		const trafficResult = await sendAnalytics(
			apiUrl,
			"traffic",
			{
				sourceName: referrer,
				visitCount: randomInt(1, 8),
			},
			env.GLINT_API_KEY
		);

		const successCount = [locationResult, referralResult, trafficResult].filter(
			Boolean
		).length;

		return new Response(
			JSON.stringify({
				success: true,
				timestamp: new Date().toISOString(),
				events: successCount,
				location: { country, region, city },
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	},

	// Cron trigger handler (runs on schedule)
	async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
		// Clean up old KV entries first
		await cleanupOldKVEntries(env);
		// Check if we should alert about stale state before processing
		await checkAndAlertIfStale(env);

		let apiUrl: string;
		try {
			apiUrl = getApiUrl(env);
		} catch {
			console.error("❌ API URL not configured");
			return;
		}

		// Generate a small batch of events (3 events every 10 min = reasonable data flow)
		const batchSize = 3;
		const results: boolean[] = [];
		const addedData: { locations: number; referrals: number; traffic: number } =
			{
				locations: 0,
				referrals: 0,
				traffic: 0,
			};

		for (let i = 0; i < batchSize; i++) {
			const country = randomChoice(COUNTRIES);
			const region = randomChoice(REGIONS);
			const city = randomChoice(CITIES);
			const referrer = randomChoice(REFERRERS);

			// Send events sequentially to avoid deadlock from too many concurrent requests
			const locationResult = await sendAnalytics(
				apiUrl,
				"location",
				{
					country,
					region,
					city,
					visitCount: randomInt(1, 5),
				},
				env.GLINT_API_KEY
			);

			const referralResult = await sendAnalytics(
				apiUrl,
				"referral",
				{
					source: referrer,
					visitCount: randomInt(1, 10),
				},
				env.GLINT_API_KEY
			);

			const trafficResult = await sendAnalytics(
				apiUrl,
				"traffic",
				{
					sourceName: referrer,
					visitCount: randomInt(1, 8),
				},
				env.GLINT_API_KEY
			);

			if (locationResult) addedData.locations++;
			if (referralResult) addedData.referrals++;
			if (trafficResult) addedData.traffic++;

			results.push(locationResult, referralResult, trafficResult);
		}

		const successCount = results.filter((r) => r === true).length;
		if (successCount > 0) {
			console.log(
				`✅ Dashboard updated: ${addedData.locations} locations, ${addedData.referrals} referrals, ${addedData.traffic} traffic sources`
			);
			// Update last successful post time
			await updateLastPostTime(env);
		} else {
			console.error("❌ No data added to dashboard");
			// Check if we should alert about stale state
			await checkAndAlertIfStale(env);
		}
	},
};

export default worker;
