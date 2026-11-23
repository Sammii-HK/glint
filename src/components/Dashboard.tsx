"use client";

import { useEffect, useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Database,
  Globe2,
  Layers3,
  LoaderCircle,
  Link2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  DEMO_PANELS,
  PANEL_INFO,
  PANEL_KEYS,
  loadSnapshot,
  loadingPanels,
  total,
  visibleVisits,
  type Datum,
  type Panel,
  type Panels,
} from "@/lib/dashboard";

const number = new Intl.NumberFormat("en-GB");
const share = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const seconds = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const percent = (value: number) => `${share.format(value)}%`;
const duration = (value: number) => {
  const whole = Math.round(value);
  const minutes = Math.floor(whole / 60);
  return minutes
    ? `${minutes}m ${String(whole % 60).padStart(2, "0")}s`
    : `${whole}s`;
};
const date = (label: string) =>
  new Date(label + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const country = (code: string) => {
  try {
    return (
      new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
};

function PanelMessage({
  panel,
  onRetry,
}: {
  panel: Panel;
  onRetry: () => void;
}) {
  if (panel.status === "error")
    return (
      <div className="panel-message" role="alert">
        <p>Snapshot unavailable</p>
        <span>{panel.error}</span>
        <button type="button" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden />
          Try again
        </button>
      </div>
    );
  if (panel.status === "loading")
    return (
      <div className="panel-message" role="status">
        <LoaderCircle size={20} className="loading-icon" aria-hidden />
        <p>Loading stored records</p>
      </div>
    );
  return (
    <div className="panel-message">
      <p>No records in this snapshot</p>
      <span>Nothing has been recorded for this view yet.</span>
    </div>
  );
}

function Breakdown({
  panel,
  format = (value) => number.format(value),
  geography = false,
  table,
  onRetry,
}: {
  panel: Panel;
  format?: (value: number) => string;
  geography?: boolean;
  table?: string;
  onRetry: () => void;
}) {
  if (panel.status !== "ready" || !panel.rows.length)
    return <PanelMessage panel={panel} onRetry={onRetry} />;
  const max = Math.max(...panel.rows.map((row) => row.value), 1);
  return (
    <>
      <ol className="breakdown-list">
        {panel.rows.slice(0, 8).map((row, index) => (
          <li key={row.label}>
            <div className="breakdown-label">
              <span>{geography ? country(row.label) : row.label}</span>
              <strong>{format(row.value)}</strong>
            </div>
            <div className="breakdown-track" aria-hidden>
              <span
                style={{
                  width: `${(row.value / max) * 100}%`,
                  backgroundColor: `var(--series-${index % 4})`,
                }}
              />
            </div>
          </li>
        ))}
        {panel.rows.length > 8 && (
          <li className="muted">
            Showing the largest 8 of {panel.rows.length} categories.
          </li>
        )}
      </ol>
      {table && (
        <DataTable rows={panel.rows} unit={table} format={format} />
      )}
    </>
  );
}

function DataTable({
  rows,
  unit = "events",
  format = (value) => number.format(value),
}: {
  rows: Datum[];
  unit?: string;
  format?: (value: number) => string;
}) {
  return (
    <details className="data-details">
      <summary>View the data</summary>
      <div className="table-scroll">
        <table>
          <caption>Displayed values, in {unit}</caption>
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{format(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Dashboard() {
  // Stored data is the default view, as on the live site. If the stored
  // snapshot fails or has no rows, the demo dataset is shown with a note.
  const [mode, setMode] = useState<"demo" | "stored">("stored");
  const [panels, setPanels] = useState<Panels>(loadingPanels);
  const [fallback, setFallback] = useState<string | null>(null);
  const [count, setCount] = useState(14);
  const [revision, setRevision] = useState(0);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const id = useId().replace(/:/g, "");
  const gradient = "visits" + id;
  const sessionGradient = "sessions" + id;
  useEffect(() => {
    if (mode === "demo") return;
    const controller = new AbortController();
    loadSnapshot(fetch, controller.signal).then((outcome) => {
      if (controller.signal.aborted) return;
      if (outcome.kind === "fallback") {
        setFallback(outcome.message);
        setPanels(DEMO_PANELS);
        setMode("demo");
        return;
      }
      setPanels(outcome.panels);
      setLoadedAt(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    });
    return () => controller.abort();
  }, [mode, revision]);
  const selectMode = (next: "demo" | "stored") => {
    if (next === mode) return;
    setMode(next);
    setFallback(null);
    setLoadedAt(null);
    setPanels(next === "demo" ? DEMO_PANELS : loadingPanels());
  };
  const retry = () => {
    if (mode === "stored") {
      setPanels(loadingPanels());
      setRevision((value) => value + 1);
    }
  };
  const retryStored = () => selectMode("stored");
  const visits = visibleVisits(panels.visits, count);
  const sessions = visibleVisits(panels.sessions, 14);
  const busy = Object.values(panels).some(
    (panel) => panel.status === "loading",
  );
  const ready = Object.values(panels).filter(
    (panel) => panel.status === "ready",
  ).length;
  const peak = visits.reduce<Datum | undefined>(
    (best, row) => (!best || row.value > best.value ? row : best),
    undefined,
  );
  const metrics = [
    {
      label: "Visit events",
      value:
        panels.visits.status === "ready"
          ? number.format(total(visits))
          : "Not loaded",
      note: "Total across the dates shown",
    },
    {
      label: "Dates shown",
      value:
        panels.visits.status === "ready" ? String(visits.length) : "Not loaded",
      note: visits.length
        ? `${date(visits[0].label)} to ${date(visits[visits.length - 1].label)} · UTC`
        : "No dates to display",
    },
    {
      label: "Leading source",
      value:
        panels.sources.status === "ready"
          ? (panels.sources.rows[0]?.label ?? "No records")
          : "Not loaded",
      note: "By recorded visits",
    },
    {
      label: "Top location",
      value:
        panels.locations.status === "ready"
          ? panels.locations.rows[0]
            ? country(panels.locations.rows[0].label)
            : "No records"
          : "Not loaded",
      note: "By recorded visits",
    },
  ];
  const scope = (key: keyof Panels) =>
    mode === "demo"
      ? "Sample records from the demo dataset."
      : PANEL_INFO[key].scope;
  return (
    <div className="glint-shell">
      <a className="skip-link" href="#main">
        Skip to overview
      </a>
      <header className="glint-header">
        <a href="#main" className="glint-brand" aria-label="Glint overview">
          <Sparkles size={22} aria-hidden />
          <span>
            glint<span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Dashboard sections">
          <a href="#traffic">Traffic</a>
          <a href="#sessions">Sessions</a>
          <a href="#sources">Sources</a>
          <a href="#technology">Technology</a>
        </nav>
        <span className="prototype-label">Analytics prototype</span>
      </header>
      <main id="main" className="dashboard-main">
        <div className="overview-heading">
          <div>
            <p className="eyebrow">A little clarity in the numbers</p>
            <h1>Traffic overview</h1>
            <p className="overview-description">
              A readable view of the records, with their source in sight.
            </p>
          </div>
          <div
            className="dataset-switch"
            role="group"
            aria-label="Choose dataset"
          >
            <button
              type="button"
              aria-pressed={mode === "demo"}
              onClick={() => selectMode("demo")}
            >
              <Layers3 size={16} aria-hidden />
              Demo dataset
            </button>
            <button
              type="button"
              aria-pressed={mode === "stored"}
              onClick={() => selectMode("stored")}
            >
              <Database size={16} aria-hidden />
              Stored snapshot
            </button>
          </div>
        </div>
        <section
          className="provenance-note"
          aria-label="Data provenance"
          aria-live="polite"
        >
          <div className="provenance-icon">
            <Layers3 size={18} aria-hidden />
          </div>
          <div>
            <strong>
              {fallback
                ? "Showing the demo dataset."
                : mode === "demo"
                  ? "You are viewing the demo dataset."
                  : "You are viewing stored records."}
            </strong>
            <p>
              {fallback
                ? `Stored data is unavailable right now. ${fallback} These are sample records, not stored visits.`
                : mode === "demo"
                  ? "Two weeks of sample traffic, 6 to 19 November 2026, to show how each view reads."
                  : "Events from the collector, including simulated traffic. Each panel reads its own recent window."}
            </p>
          </div>
          {fallback && (
            <button
              type="button"
              className="refresh-button"
              onClick={retryStored}
            >
              <RefreshCw size={15} aria-hidden />
              Try stored data again
            </button>
          )}
          {mode === "stored" && (
            <button
              type="button"
              className="refresh-button"
              disabled={busy}
              onClick={retry}
            >
              <RefreshCw
                size={15}
                className={busy ? "loading-icon" : ""}
                aria-hidden
              />
              {busy ? "Loading" : "Refresh snapshot"}
            </button>
          )}
        </section>
        <section aria-label="Snapshot summary" className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <h2>{metric.label}</h2>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-note">{metric.note}</p>
            </article>
          ))}
        </section>
        <section
          id="traffic"
          className="chart-grid"
          aria-label="Traffic patterns"
        >
          <article className="chart-card trend-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">The shape of a snapshot</p>
                <h2>Visit events</h2>
              </div>
              <div
                role="group"
                aria-label="Number of captured dates"
                className="date-switch"
              >
                {[7, 14].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={count === value}
                    onClick={() => setCount(value)}
                  >
                    {value} dates
                  </button>
                ))}
              </div>
            </div>
            <p className="card-description">{scope("visits")}</p>
            {panels.visits.status === "ready" && visits.length > 0 ? (
              <>
                <div
                  className="chart-canvas"
                  role="group"
                  aria-label={`${total(visits)} visit events across ${visits.length} dates. Values are available in the data table.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={visits}
                      margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                      accessibilityLayer
                    >
                      <defs>
                        <linearGradient
                          id={gradient}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--chart-highlight)"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--chart-highlight)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--chart-grid)"
                      />
                      <XAxis
                        dataKey="label"
                        tickFormatter={date}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          color: "var(--foreground)",
                        }}
                        labelFormatter={(value) => date(String(value))}
                        formatter={(value) => [
                          number.format(Number(value)),
                          "Visit events",
                        ]}
                      />
                      <Area
                        dataKey="value"
                        type="monotone"
                        stroke="var(--chart-highlight)"
                        strokeWidth={2.5}
                        fill={`url(#${gradient})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-footnote">
                  <span className="series-label">
                    <span aria-hidden />
                    Visit events
                  </span>
                  {peak && (
                    <p>
                      Busiest date <strong>{date(peak.label)}</strong>{" "}
                      · {number.format(peak.value)}
                    </p>
                  )}
                </div>
                <DataTable rows={visits} />
              </>
            ) : (
              <PanelMessage panel={panels.visits} onRetry={retry} />
            )}
          </article>
          <article className="chart-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Where records came from</p>
                <h2>Traffic sources</h2>
              </div>
              <ArrowDownRight size={20} aria-hidden />
            </div>
            <p className="card-description">{scope("sources")}</p>
            <Breakdown panel={panels.sources} onRetry={retry} />
          </article>
        </section>
        <section
          id="sessions"
          className="chart-grid"
          aria-label="Sessions and referrals"
        >
          <article className="chart-card trend-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">How long visits last</p>
                <h2>Session duration</h2>
              </div>
              <Clock3 size={20} aria-hidden />
            </div>
            <p className="card-description">{scope("sessions")}</p>
            {panels.sessions.status === "ready" && sessions.length > 0 ? (
              <>
                <div
                  className="chart-canvas"
                  role="group"
                  aria-label={`Average session length across ${sessions.length} dates. Values are available in the data table.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={sessions}
                      margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                      accessibilityLayer
                    >
                      <defs>
                        <linearGradient
                          id={sessionGradient}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--chart-secondary)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--chart-secondary)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--chart-grid)"
                      />
                      <XAxis
                        dataKey="label"
                        tickFormatter={date}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          seconds.format(Number(value))
                        }
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          color: "var(--foreground)",
                        }}
                        labelFormatter={(value) => date(String(value))}
                        formatter={(value) => [
                          duration(Number(value)),
                          "Average session",
                        ]}
                      />
                      <Area
                        dataKey="value"
                        type="monotone"
                        stroke="var(--chart-secondary)"
                        strokeWidth={2.5}
                        fill={`url(#${sessionGradient})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-footnote">
                  <span className="series-label secondary">
                    <span aria-hidden />
                    Average session, in seconds
                  </span>
                  <p>
                    Across these dates{" "}
                    <strong>
                      {duration(total(sessions) / sessions.length)}
                    </strong>
                  </p>
                </div>
                <DataTable
                  rows={sessions}
                  unit="seconds"
                  format={(value) => seconds.format(value)}
                />
              </>
            ) : (
              <PanelMessage panel={panels.sessions} onRetry={retry} />
            )}
          </article>
          <article className="chart-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Who sent the visit</p>
                <h2>Referral sources</h2>
              </div>
              <Link2 size={20} aria-hidden />
            </div>
            <p className="card-description">{scope("referrals")}</p>
            <Breakdown
              panel={panels.referrals}
              table="visits"
              onRetry={retry}
            />
          </article>
        </section>
        <section
          id="sources"
          className="chart-grid lower-grid"
          aria-label="Location and hourly records"
        >
          <article className="chart-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">A wider view</p>
                <h2>Locations</h2>
              </div>
              <Globe2 size={20} aria-hidden />
            </div>
            <p className="card-description">{scope("locations")}</p>
            <Breakdown panel={panels.locations} geography onRetry={retry} />
          </article>
          <article className="chart-card hourly-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Across the clock</p>
                <h2>Hourly pattern</h2>
              </div>
              <ArrowUpRight size={20} aria-hidden />
            </div>
            <p className="card-description">{scope("hours")}</p>
            {panels.hours.status === "ready" && panels.hours.rows.length ? (
              <>
                <div
                  className="chart-canvas compact"
                  role="group"
                  aria-label="Visits by hour of day. Values are available in the data table."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={panels.hours.rows}
                      margin={{ top: 12, right: 0, left: -25, bottom: 0 }}
                      accessibilityLayer
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--chart-grid)"
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                        }}
                        formatter={(value) => [
                          number.format(Number(value)),
                          "Events",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--chart-secondary)"
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <DataTable rows={panels.hours.rows} />
              </>
            ) : (
              <PanelMessage panel={panels.hours} onRetry={retry} />
            )}
          </article>
        </section>
        <section
          id="technology"
          className="chart-grid equal-grid"
          aria-label="Technology snapshots"
        >
          <article className="chart-card">
            <p className="eyebrow">Screen sizes</p>
            <h2>Devices</h2>
            <p className="card-description">{scope("devices")}</p>
            <Breakdown
              panel={panels.devices}
              format={percent}
              table="per cent of the device total"
              onRetry={retry}
            />
          </article>
          <article className="chart-card">
            <p className="eyebrow">Browser labels</p>
            <h2>Browsers</h2>
            <p className="card-description">{scope("browsers")}</p>
            <Breakdown panel={panels.browsers} onRetry={retry} />
          </article>
        </section>
        <footer className="dashboard-footer">
          <p>
            <strong>Glint</strong> collects visits in Next.js middleware and
            stores them in PostgreSQL.
          </p>
          <p role="status">
            {mode === "demo"
              ? fallback
                ? "Demo dataset · stored data unavailable"
                : "Demo dataset"
              : `${ready} of ${PANEL_KEYS.length} panels loaded${loadedAt ? ` · updated ${loadedAt}` : ""}`}
          </p>
        </footer>
      </main>
    </div>
  );
}
