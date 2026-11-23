import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseRows,
  loadStoredPanels,
  loadSnapshot,
  resolveSnapshot,
  loadingPanels,
  DEMO_PANELS,
  PANEL_INFO,
  PANEL_KEYS,
  visibleVisits,
  total,
} from "../src/lib/dashboard.ts";

test("stored daily values use UTC dates, preserve zeroes and combine duplicate records", () => {
  assert.deepEqual(
    normaliseRows("visits", [
      { timestamp: "2026-11-19T23:30:00-02:00", averageVisits: 0 },
      { timestamp: "2026-11-20T08:00:00Z", averageVisits: 3 },
    ]),
    [{ label: "2026-11-20", value: 3 }],
  );
  assert.deepEqual(
    normaliseRows("visits", [
      { timestamp: "2026-11-19T00:00:00Z", averageVisits: 0 },
    ]),
    [{ label: "2026-11-19", value: 0 }],
  );
});
test("invalid payloads and counts cannot become an empty success chart", () => {
  for (const data of [
    { error: "failed" },
    [{ label: "Direct", value: "5" }],
    [{ label: "Direct", value: -1 }],
    [{ label: "Direct", value: Infinity }],
  ])
    assert.throws(() => normaliseRows("sources", data));
  assert.throws(() => normaliseRows("hours", [{ hour: 24, visits: 2 }]));
  assert.throws(() =>
    normaliseRows("visits", [{ timestamp: "not a date", averageVisits: 2 }]),
  );
});
test("country and source aggregation is deterministic without mutating returned records", () => {
  const rows = [
    { country: "GB", visitCount: 2 },
    { country: "US", visitCount: 1 },
    { country: "GB", visitCount: 4 },
  ];
  assert.deepEqual(normaliseRows("locations", rows), [
    { label: "GB", value: 6 },
    { label: "US", value: 1 },
  ]);
  assert.equal(rows.length, 3);
});
test("a failing stored panel stays an error while other panels can remain genuinely empty", async () => {
  const results = await loadStoredPanels(
    async (input) =>
      new Response(input === "/api/averageMetrics" ? "unavailable" : "[]", {
        status: input === "/api/averageMetrics" ? 503 : 200,
      }),
  );
  assert.equal(results.visits.status, "error");
  assert.match(results.visits.error!, /503/);
  assert.equal(results.sources.status, "ready");
  assert.deepEqual(results.sources.rows, []);
  assert.ok(
    !JSON.stringify(results).includes(String(DEMO_PANELS.visits.rows[0].value)),
  );
});
test("network and malformed JSON failures are separate from a valid zero dataset", async () => {
  const failed = await loadStoredPanels(async () => {
    throw new Error("Offline");
  });
  assert.equal(failed.hours.status, "error");
  const malformed = await loadStoredPanels(
    async () => new Response("not JSON"),
  );
  assert.equal(malformed.devices.status, "error");
});
test("the visible date selection changes totals without changing the original illustrative dataset", () => {
  const all = DEMO_PANELS.visits.rows;
  const recent = visibleVisits(DEMO_PANELS.visits, 7);
  assert.equal(recent.length, 7);
  assert.equal(all.length, 14);
  assert.ok(total(recent) < total(all));
});

test("device records are summed per type and shown as a share of the summed total, as live does", () => {
  // /api/deviceMetrics returns { label, value } with value = the stored percentage.
  assert.deepEqual(
    normaliseRows("devices", [
      { label: "desktop", value: 30 },
      { label: "desktop", value: 30 },
      { label: "mobile", value: 25 },
      { label: "tablet", value: 15 },
    ]),
    [
      { label: "desktop", value: 60 },
      { label: "mobile", value: 25 },
      { label: "tablet", value: 15 },
    ],
  );
  const shares = normaliseRows("devices", [
    { label: "desktop", value: 60 },
    { label: "mobile", value: 30 },
    { label: "tablet", value: 30 },
  ]);
  assert.deepEqual(
    shares.map((row) => row.value),
    [50, 25, 25],
  );
  assert.equal(total(shares), 100);
  assert.deepEqual(normaliseRows("devices", [{ label: "mobile", value: 0 }]), [
    { label: "mobile", value: 0 },
  ]);
});
test("session durations from /api/sessionDuration are averaged per UTC date in date order", () => {
  // Route shape: { time: timestamp, averageSessionDuration: duration in seconds }.
  assert.deepEqual(
    normaliseRows("sessions", [
      { time: "2026-11-20T09:00:00.000Z", averageSessionDuration: 300 },
      { time: "2026-11-19T22:30:00.000Z", averageSessionDuration: 90 },
      { time: "2026-11-20T18:00:00.000Z", averageSessionDuration: 120 },
    ]),
    [
      { label: "2026-11-19", value: 90 },
      { label: "2026-11-20", value: 210 },
    ],
  );
  assert.throws(() =>
    normaliseRows("sessions", [{ time: "never", averageSessionDuration: 1 }]),
  );
  assert.throws(() =>
    normaliseRows("sessions", [
      { time: "2026-11-20T09:00:00Z", averageSessionDuration: null },
    ]),
  );
});
test("referral records from /api/referralMetrics are summed by source", () => {
  // Route shape: raw ReferralMetrics rows.
  assert.deepEqual(
    normaliseRows("referrals", [
      {
        id: "a",
        timestamp: "2026-11-20T09:00:00.000Z",
        source: "direct",
        visitCount: 3,
      },
      {
        id: "b",
        timestamp: "2026-11-20T10:00:00.000Z",
        source: "https://news.ycombinator.com/",
        visitCount: 5,
      },
      {
        id: "c",
        timestamp: "2026-11-20T11:00:00.000Z",
        source: "direct",
        visitCount: 4,
      },
      {
        id: "d",
        timestamp: "2026-11-20T12:00:00.000Z",
        source: " ",
        visitCount: 1,
      },
    ]),
    [
      { label: "direct", value: 7 },
      { label: "https://news.ycombinator.com/", value: 5 },
      { label: "Unknown", value: 1 },
    ],
  );
});

// Mock responses shaped like the real route handlers.
const routeBodies: Record<string, unknown> = {
  "/api/averageMetrics": [
    { id: 1, timestamp: "2026-11-20T09:00:00.000Z", averageVisits: 4 },
    { id: 2, timestamp: "2026-11-21T09:00:00.000Z", averageVisits: 6 },
  ],
  "/api/sessionDuration": [
    { time: "2026-11-20T09:00:00.000Z", averageSessionDuration: 200 },
  ],
  "/api/trafficSources": [{ label: "direct", value: 10 }],
  "/api/referralMetrics": [
    {
      id: "r1",
      timestamp: "2026-11-20T09:00:00.000Z",
      source: "direct",
      visitCount: 10,
    },
  ],
  "/api/locationMetrics": [{ country: "GB", visitCount: 10 }],
  "/api/deviceMetrics": [
    { label: "desktop", value: 40 },
    { label: "mobile", value: 10 },
  ],
  "/api/browserMetrics": [{ browser: "Chrome", count: 10 }],
  "/api/hourlyMetrics": [{ hour: 9, visits: 10 }],
};
const routeFetch =
  (bodies: Record<string, unknown>, status = 200): typeof fetch =>
  async (input) =>
    new Response(JSON.stringify(bodies[String(input)] ?? []), { status });

test("the stored snapshot requests every route and is used when it has rows", async () => {
  const requested: string[] = [];
  const outcome = await loadSnapshot(async (input, init) => {
    requested.push(String(input));
    return routeFetch(routeBodies)(input, init);
  });
  assert.deepEqual(
    requested.sort(),
    PANEL_KEYS.map((key) => PANEL_INFO[key].endpoint).sort(),
  );
  assert.equal(outcome.kind, "stored");
  if (outcome.kind !== "stored") return;
  assert.deepEqual(outcome.panels.visits.rows, [
    { label: "2026-11-20", value: 4 },
    { label: "2026-11-21", value: 6 },
  ]);
  assert.deepEqual(outcome.panels.sessions.rows, [
    { label: "2026-11-20", value: 200 },
  ]);
  assert.deepEqual(outcome.panels.referrals.rows, [
    { label: "direct", value: 10 },
  ]);
  assert.deepEqual(outcome.panels.devices.rows, [
    { label: "desktop", value: 80 },
    { label: "mobile", value: 20 },
  ]);
});
test("a stored request that fails everywhere falls back to the demo dataset with the reason", async () => {
  // Without a database every route answers 500 with { error }.
  const serverError = await loadSnapshot(
    routeFetch(
      Object.fromEntries(
        PANEL_KEYS.map((key) => [
          PANEL_INFO[key].endpoint,
          { error: "Server error" },
        ]),
      ),
      500,
    ),
  );
  assert.equal(serverError.kind, "fallback");
  if (serverError.kind !== "fallback") return;
  assert.equal(serverError.reason, "failed");
  assert.match(serverError.message, /HTTP 500/);

  const offline = await loadSnapshot(async () => {
    throw new TypeError("Failed to fetch");
  });
  assert.equal(offline.kind, "fallback");
  if (offline.kind === "fallback") assert.equal(offline.reason, "failed");

  const stalled = await loadSnapshot(
    async (_input, init) =>
      new Promise((_resolve, reject) =>
        init!.signal!.addEventListener(
          "abort",
          () => reject(init!.signal!.reason),
          {
            once: true,
          },
        ),
      ),
    undefined,
    10,
  );
  assert.equal(stalled.kind, "fallback");
  if (stalled.kind === "fallback") assert.match(stalled.message, /too long/);
});
test("a stored snapshot with no rows falls back to the demo dataset", async () => {
  const outcome = await loadSnapshot(routeFetch({}));
  assert.deepEqual(outcome, {
    kind: "fallback",
    reason: "empty",
    message: "The stored snapshot has no records yet.",
  });
});
test("a partly failing snapshot with some rows stays on stored data and keeps per-panel errors", async () => {
  const outcome = await loadSnapshot(async (input) =>
    input === "/api/trafficSources"
      ? new Response(JSON.stringify([{ label: "direct", value: 3 }]))
      : new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
        }),
  );
  assert.equal(outcome.kind, "stored");
  if (outcome.kind !== "stored") return;
  assert.equal(outcome.panels.sources.status, "ready");
  assert.equal(outcome.panels.visits.status, "error");
});
test("a snapshot still loading is never treated as stored data", () => {
  assert.equal(resolveSnapshot(loadingPanels()).kind, "fallback");
});
test("the demo dataset covers every panel and device shares add up to 100", () => {
  for (const key of PANEL_KEYS)
    assert.ok(DEMO_PANELS[key].rows.length > 0, key);
  assert.equal(total(DEMO_PANELS.devices.rows), 100);
  assert.equal(
    DEMO_PANELS.sessions.rows.length,
    DEMO_PANELS.visits.rows.length,
  );
});
test("the clearly synthetic overview uses coherent example totals across its count panels", () => {
  for (const key of [
    "sources",
    "referrals",
    "locations",
    "browsers",
    "hours",
  ] as const)
    assert.equal(total(DEMO_PANELS[key].rows), total(DEMO_PANELS.visits.rows));
});

test("a stalled stored snapshot ends in a retryable error instead of loading indefinitely", async () => {
  const fetcher: typeof fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      init!.signal!.addEventListener(
        "abort",
        () => reject(init!.signal!.reason),
        { once: true },
      );
    });
  const panels = await loadStoredPanels(fetcher, undefined, 10);
  for (const panel of Object.values(panels)) {
    assert.equal(panel.status, "error");
    assert.match(panel.error!, /took too long/);
  }
});
