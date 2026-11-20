export type PanelKey =
  | "visits"
  | "sources"
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
  "sources",
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
    title: "Captured visit events",
    endpoint: "/api/averageMetrics",
    scope: "Latest 100 metric records, grouped by UTC date.",
  },
  sources: {
    title: "Traffic sources",
    endpoint: "/api/trafficSources",
    scope: "Source records aggregated by the ingestion API.",
  },
  locations: {
    title: "Locations",
    endpoint: "/api/locationMetrics",
    scope: "Location records grouped by country.",
  },
  devices: {
    title: "Devices",
    endpoint: "/api/deviceMetrics",
    scope:
      "Mean stored percentage per device label; not a measured visitor share.",
  },
  browsers: {
    title: "Browsers",
    endpoint: "/api/browserMetrics",
    scope: "Browser counts from the latest 500 metric records.",
  },
  hours: {
    title: "Hourly pattern",
    endpoint: "/api/hourlyMetrics",
    scope:
      "Hour buckets from the latest 500 metric records; not a continuous time series.",
  },
};

export function loadingPanels(): Panels {
  const panel = (): Panel => ({ status: "loading", rows: [] });
  return {
    visits: panel(),
    sources: panel(),
    locations: panel(),
    devices: panel(),
    browsers: panel(),
    hours: panel(),
  };
}

export function normaliseRows(key: PanelKey, data: unknown): Datum[] {
  if (!Array.isArray(data))
    throw new Error("The response was not a metrics list.");
  const totals = new Map<string, number>();
  const samples = new Map<string, number>();
  for (const item of data) {
    if (!item || typeof item !== "object")
      throw new Error("A metrics record could not be read.");
    const row = item as Record<string, unknown>;
    let label: string;
    let raw: unknown;
    if (key === "visits") {
      if (
        typeof row.timestamp !== "string" ||
        !Number.isFinite(Date.parse(row.timestamp))
      )
        throw new Error("A metric timestamp could not be read.");
      label = new Date(row.timestamp).toISOString().slice(0, 10);
      raw = row.averageVisits;
    } else if (key === "hours") {
      if (
        typeof row.hour !== "number" ||
        !Number.isInteger(row.hour) ||
        row.hour < 0 ||
        row.hour > 23
      )
        throw new Error("An hour bucket could not be read.");
      label = String(row.hour).padStart(2, "0") + ":00";
      raw = row.visits;
    } else {
      const field =
        key === "locations"
          ? "country"
          : key === "browsers"
            ? "browser"
            : "label";
      label =
        typeof row[field] === "string" && (row[field] as string).trim()
          ? (row[field] as string).trim()
          : "Unknown";
      raw =
        row[
          key === "locations"
            ? "visitCount"
            : key === "browsers"
              ? "count"
              : "value"
        ];
    }
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0)
      throw new Error("A metric value could not be read.");
    if (key === "devices" && raw > 100)
      throw new Error("A device percentage is outside its supported range.");
    totals.set(label, (totals.get(label) ?? 0) + raw);
    samples.set(label, (samples.get(label) ?? 0) + 1);
  }
  const rows = [...totals].map(([label, value]) => ({
    label,
    value: key === "devices" ? value / samples.get(label)! : value,
  }));
  return rows.sort(
    key === "visits" || key === "hours"
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
export const DEMO_PANELS: Panels = {
  visits: { status: "ready", rows: visits },
  sources: {
    status: "ready",
    rows: [
      { label: "Direct", value: 1084 },
      { label: "Search", value: 716 },
      { label: "Social", value: 422 },
      { label: "Referral", value: 185 },
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
