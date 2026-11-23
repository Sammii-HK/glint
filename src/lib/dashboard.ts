export type PanelKey =
  | "visits"
  | "sessions"
  | "sources"
  | "referrals"
  | "locations"
  | "devices"
  | "browsers"
  | "hours";
export type Datum = { label: string; value: number };
export type Panel = {
  status: "ready" | "loading" | "error";
  rows: Datum[];
  error?: string;
};
export type Panels = Record<PanelKey, Panel>;
export const PANEL_KEYS: PanelKey[] = [
  "visits",
  "sessions",
  "sources",
  "referrals",
  "locations",
  "devices",
  "browsers",
  "hours",
];
export const PANEL_INFO: Record<
  PanelKey,
  { title: string; endpoint: string; scope: string }
> = {
  visits: {
    title: "Visit events",
    endpoint: "/api/averageMetrics",
    scope: "Visits by UTC date, from the latest 100 records.",
  },
  sessions: {
    title: "Session duration",
    endpoint: "/api/sessionDuration",
    scope:
      "Average session length in seconds by UTC date, for the latest 14 dates with stored sessions.",
  },
  sources: {
    title: "Traffic sources",
    endpoint: "/api/trafficSources",
    scope: "Visits by source, across all stored records.",
  },
  referrals: {
    title: "Referral sources",
    endpoint: "/api/referralMetrics",
    scope: "Visits by referring address, across all stored records.",
  },
  locations: {
    title: "Locations",
    endpoint: "/api/locationMetrics",
    scope: "Visits by country, across all stored records.",
  },
  devices: {
    title: "Devices",
    endpoint: "/api/deviceMetrics",
    scope: "Each device type's share of the recorded device totals.",
  },
  browsers: {
    title: "Browsers",
    endpoint: "/api/browserMetrics",
    scope: "Browser counts from the latest 500 records.",
  },
  hours: {
    title: "Hourly pattern",
    endpoint: "/api/hourlyMetrics",
    scope: "Visits by hour of day, from the latest 500 records.",
  },
};

export function loadingPanels(): Panels {
  const panel = (): Panel => ({ status: "loading", rows: [] });
  return {
    visits: panel(),
    sessions: panel(),
    sources: panel(),
    referrals: panel(),
    locations: panel(),
    devices: panel(),
    browsers: panel(),
    hours: panel(),
  };
}

function dateLabel(value: unknown, message: string): string {
  if (
    !(typeof value === "string" || value instanceof Date) ||
    !Number.isFinite(new Date(value).getTime())
  )
    throw new Error(message);
  return new Date(value).toISOString().slice(0, 10);
}

function textLabel(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "Unknown";
}

// Reads one record from a route response into a label and a raw value.
function readRecord(key: PanelKey, row: Record<string, unknown>) {
  switch (key) {
    case "visits":
      return {
        label: dateLabel(row.timestamp, "A metric timestamp could not be read."),
        raw: row.averageVisits,
      };
    case "sessions":
      return {
        label: dateLabel(row.time, "A session timestamp could not be read."),
        raw: row.averageSessionDuration,
      };
    case "hours":
      if (
        typeof row.hour !== "number" ||
        !Number.isInteger(row.hour) ||
        row.hour < 0 ||
        row.hour > 23
      )
        throw new Error("An hour bucket could not be read.");
      return {
        label: String(row.hour).padStart(2, "0") + ":00",
        raw: row.visits,
      };
    case "locations":
      return { label: textLabel(row.country), raw: row.visitCount };
    case "referrals":
      return { label: textLabel(row.source), raw: row.visitCount };
    case "browsers":
      return { label: textLabel(row.browser), raw: row.count };
    default:
      return { label: textLabel(row.label), raw: row.value };
  }
}

export function normaliseRows(key: PanelKey, data: unknown): Datum[] {
  if (!Array.isArray(data))
    throw new Error("The response was not a metrics list.");
  const totals = new Map<string, number>();
  const samples = new Map<string, number>();
  for (const item of data) {
    if (!item || typeof item !== "object")
      throw new Error("A metrics record could not be read.");
    const { label, raw } = readRecord(key, item as Record<string, unknown>);
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0)
      throw new Error("A metric value could not be read.");
    totals.set(label, (totals.get(label) ?? 0) + raw);
    samples.set(label, (samples.get(label) ?? 0) + 1);
  }
  // Session lengths are averaged per date; counts are summed. Device records
  // are summed per type and shown as a share of the summed total, as live does.
  const grand = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const rows = [...totals].map(([label, value]) => ({
    label,
    value:
      key === "sessions"
        ? value / samples.get(label)!
        : key === "devices"
          ? grand > 0
            ? (value / grand) * 100
            : 0
          : value,
  }));
  return rows.sort(
    key === "visits" || key === "sessions" || key === "hours"
      ? (a, b) => a.label.localeCompare(b.label)
      : (a, b) => b.value - a.value || a.label.localeCompare(b.label),
  );
}

export async function loadStoredPanels(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
  timeoutMs = 10_000,
): Promise<Panels> {
  const controller = new AbortController();
  const requestSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error("The stored snapshot took too long. Try again."),
      ),
    timeoutMs,
  );
  try {
    const results = await Promise.all(
      PANEL_KEYS.map(async (key) => {
        try {
          const response = await fetcher(PANEL_INFO[key].endpoint, {
            signal: requestSignal,
            cache: "no-store",
          });
          if (!response.ok)
            throw new Error(
              `The stored snapshot is unavailable (HTTP ${response.status}).`,
            );
          return [
            key,
            {
              status: "ready",
              rows: normaliseRows(key, await response.json()),
            },
          ] as const;
        } catch (error) {
          return [
            key,
            {
              status: "error",
              rows: [],
              error: controller.signal.aborted
                ? "The stored snapshot took too long. Try again."
                : error instanceof Error
                  ? error.message
                  : "The stored snapshot could not be loaded.",
            },
          ] as const;
        }
      }),
    );
    return Object.fromEntries(results) as Panels;
  } finally {
    clearTimeout(timer);
  }
}

export type SnapshotOutcome =
  | { kind: "stored"; panels: Panels }
  | { kind: "fallback"; reason: "failed" | "empty"; message: string };

// The stored snapshot is used when at least one panel has rows. When every
// panel failed or came back empty, the dashboard falls back to the demo dataset.
export function resolveSnapshot(panels: Panels): SnapshotOutcome {
  const list = PANEL_KEYS.map((key) => panels[key]);
  if (list.some((panel) => panel.status === "ready" && panel.rows.length > 0))
    return { kind: "stored", panels };
  const failed = list.find((panel) => panel.status === "error");
  if (failed)
    return {
      kind: "fallback",
      reason: "failed",
      message: failed.error ?? "The stored snapshot could not be loaded.",
    };
  return {
    kind: "fallback",
    reason: "empty",
    message: "The stored snapshot has no records yet.",
  };
}

export async function loadSnapshot(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
  timeoutMs = 10_000,
): Promise<SnapshotOutcome> {
  return resolveSnapshot(await loadStoredPanels(fetcher, signal, timeoutMs));
}

// Fixed illustrative records. Never merge them with a stored snapshot or call them real visitors.
const visits = [
  84, 112, 97, 146, 128, 173, 155, 196, 168, 214, 193, 247, 226, 268,
].map((value, index) => ({
  label: `2026-11-${String(index + 6).padStart(2, "0")}`,
  value,
}));
const hourWeights = [
  12, 8, 6, 5, 8, 15, 28, 46, 74, 103, 116, 125, 131, 147, 163, 152, 143, 122,
  107, 93, 76, 54, 34, 21,
];
const demoTotal = visits.reduce((sum, row) => sum + row.value, 0);
const weightTotal = hourWeights.reduce((sum, value) => sum + value, 0);
const hours = hourWeights.map((value) =>
  Math.floor((value / weightTotal) * demoTotal),
);
hours[hours.length - 1] +=
  demoTotal - hours.reduce((sum, value) => sum + value, 0);
const sessionSeconds = [
  148, 162, 155, 171, 166, 184, 177, 192, 181, 203, 196, 214, 207, 221,
];
export const DEMO_PANELS: Panels = {
  visits: { status: "ready", rows: visits },
  sessions: {
    status: "ready",
    rows: visits.map((row, index) => ({
      label: row.label,
      value: sessionSeconds[index],
    })),
  },
  sources: {
    status: "ready",
    rows: [
      { label: "Direct", value: 1084 },
      { label: "Search", value: 716 },
      { label: "Social", value: 422 },
      { label: "Referral", value: 185 },
    ],
  },
  referrals: {
    status: "ready",
    rows: [
      { label: "Direct", value: 1084 },
      { label: "google.com", value: 598 },
      { label: "x.com", value: 236 },
      { label: "linkedin.com", value: 186 },
      { label: "bing.com", value: 118 },
      { label: "github.com", value: 112 },
      { label: "news.ycombinator.com", value: 73 },
    ],
  },
  locations: {
    status: "ready",
    rows: [
      { label: "GB", value: 914 },
      { label: "US", value: 682 },
      { label: "DE", value: 318 },
      { label: "CA", value: 264 },
      { label: "AU", value: 229 },
    ],
  },
  devices: {
    status: "ready",
    rows: [
      { label: "Desktop", value: 58 },
      { label: "Mobile", value: 36 },
      { label: "Tablet", value: 6 },
    ],
  },
  browsers: {
    status: "ready",
    rows: [
      { label: "Chrome", value: 1180 },
      { label: "Safari", value: 790 },
      { label: "Firefox", value: 291 },
      { label: "Edge", value: 146 },
    ],
  },
  hours: {
    status: "ready",
    rows: hours.map((value, index) => ({
      label: String(index).padStart(2, "0") + ":00",
      value,
    })),
  },
};
export function visibleVisits(panel: Panel, count: number): Datum[] {
  return panel.rows.slice(-count);
}
export function total(rows: Datum[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0);
}
