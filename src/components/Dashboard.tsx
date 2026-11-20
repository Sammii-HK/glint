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
  Database,
  Globe2,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  DEMO_PANELS,
  PANEL_INFO,
  loadStoredPanels,
  loadingPanels,
  total,
  visibleVisits,
  type Datum,
  type Panel,
  type Panels,
} from "@/lib/dashboard";

const number = new Intl.NumberFormat("en-GB");
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
      <span>An empty result is different from a failed request.</span>
    </div>
  );
}

function Breakdown({
  panel,
  unit = "",
  geography = false,
  onRetry,
}: {
  panel: Panel;
  unit?: string;
  geography?: boolean;
  onRetry: () => void;
}) {
  if (panel.status !== "ready" || !panel.rows.length)
    return <PanelMessage panel={panel} onRetry={onRetry} />;
  const max = Math.max(...panel.rows.map((row) => row.value), 1);
  return (
    <ol className="breakdown-list">
      {panel.rows.slice(0, 8).map((row, index) => (
        <li key={row.label}>
          <div className="breakdown-label">
            <span>{geography ? country(row.label) : row.label}</span>
            <strong>
              {number.format(row.value)}
              {unit}
            </strong>
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
  );
}

function DataTable({
  rows,
  unit = "events",
}: {
  rows: Datum[];
  unit?: string;
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
                <td>{number.format(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Dashboard() {
  const [mode, setMode] = useState<"demo" | "stored">("demo");
  const [panels, setPanels] = useState<Panels>(DEMO_PANELS);
  const [count, setCount] = useState(14);
  const [revision, setRevision] = useState(0);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const gradient = "visits" + useId().replace(/:/g, "");
  useEffect(() => {
    if (mode === "demo") return;
    const controller = new AbortController();
    loadStoredPanels(fetch, controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setPanels(result);
        setLoadedAt(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    });
    return () => controller.abort();
  }, [mode, revision]);
  const selectMode = (next: "demo" | "stored") => {
    if (next === mode) return;
    setMode(next);
    setLoadedAt(null);
    setPanels(next === "demo" ? DEMO_PANELS : loadingPanels());
  };
  const retry = () => {
    if (mode === "stored") {
      setPanels(loadingPanels());
      setRevision((value) => value + 1);
    }
  };
  const visits = visibleVisits(panels.visits, count);
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
      note: "Sum of the displayed captured dates",
    },
    {
      label: "Captured dates",
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
      note: "From its own source snapshot",
    },
    {
      label: "Top location",
      value:
        panels.locations.status === "ready"
          ? panels.locations.rows[0]
            ? country(panels.locations.rows[0].label)
            : "No records"
          : "Not loaded",
      note: "From its own location snapshot",
    },
  ];
  const scope = (key: keyof Panels) =>
    mode === "demo"
      ? "Fixed illustrative records, not production traffic."
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
        <section className="provenance-note" aria-label="Data provenance">
          <div className="provenance-icon">
            <Layers3 size={18} aria-hidden />
          </div>
          <div>
            <strong>
              {mode === "demo"
                ? "You are exploring synthetic data."
                : "Stored records can include simulated traffic."}
            </strong>
            <p>
              {mode === "demo"
                ? "This fixed example covers 6–19 November 2026. It shows how the dashboard works, not a real audience."
                : "The prototype receives generated traffic. These independent query windows are not one cohort, and they are not unique visitors."}
            </p>
          </div>
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
                <h2>Captured visit events</h2>
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
                  aria-label={`${total(visits)} visit events across ${visits.length} captured dates. Values are available in the data table.`}
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
                      Highest captured date <strong>{date(peak.label)}</strong>{" "}
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
                  aria-label="Captured visits grouped into hour buckets. Values are available in the data table."
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
            <p className="eyebrow">A separate measure</p>
            <h2>Average recorded device mix</h2>
            <p className="card-description">{scope("devices")}</p>
            <Breakdown panel={panels.devices} unit="%" onRetry={retry} />
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
            <strong>Source matters.</strong> Session duration and network speed
            are not shown as measured behaviour: the prototype generates those
            values. Stored panels may use different query windows.
          </p>
          <p role="status">
            {mode === "demo"
              ? "Synthetic example · fixed dataset"
              : `${ready} of 6 panels loaded${loadedAt ? ` · checked ${loadedAt}` : ""}.`}
          </p>
        </footer>
      </main>
    </div>
  );
}
