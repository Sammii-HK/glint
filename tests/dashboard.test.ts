import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseRows,
  loadStoredPanels,
  DEMO_PANELS,
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

test("repeated device percentages are averaged rather than reported as summed traffic", () => {
  assert.deepEqual(
    normaliseRows("devices", [
      { label: "Desktop", value: 50 },
      { label: "Desktop", value: 70 },
    ]),
    [{ label: "Desktop", value: 60 }],
  );
  assert.throws(() =>
    normaliseRows("devices", [{ label: "Desktop", value: 101 }]),
  );
});
test("the clearly synthetic overview uses coherent example totals across its count panels", () => {
  for (const key of ["sources", "locations", "browsers", "hours"] as const)
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
