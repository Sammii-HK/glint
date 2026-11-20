# Glint

An analytics dashboard prototype built with Next.js, TypeScript, Recharts and PostgreSQL through Prisma. The interface opens with a fixed, clearly labelled synthetic dataset so the charts can be explored without reading stored metrics.

## Dashboard

Switch between seven and fourteen captured UTC dates, inspect chart values in accessible tables, and explore source, country, device, browser and hourly breakdowns. The responsive layout supports light and dark system preferences, reduced motion and keyboard focus. All interface icons use Lucide.

The **Stored snapshot** control explicitly loads the existing six metric endpoints. Panels have loading, empty and retryable error states, including a ten-second request limit. Failed responses never fall back to illustrative data.

These endpoints have independent query windows. Daily visits use the latest 100 metric records; hourly and browser breakdowns use the latest 500. Device values are averages of stored percentages, not measured visitor shares. The panels do not establish a shared cohort or unique visitor count. Seed scripts and the Cloudflare worker can generate synthetic records, so stored data may also contain examples.

## Collection architecture

Existing middleware reads request headers and dispatches four asynchronous POST requests to the ingestion API. That API uses Prisma to persist separate metric records. Header geography depends on the hosting environment. Browser parsing, event delivery, tenancy, consent and retention need further production work.

The existing collector also generates random session-duration and network-speed values. The dashboard omits those values because they are not measurements. Asynchronous dispatch does not establish guaranteed delivery, zero overhead or a measured latency improvement. No performance benchmark is claimed.

Sample dashboard mode only controls metric reads. It does not automatically disable this separate collector. For a local visual preview without ingestion, run with `DISABLE_ANALYTICS_TRACKING=true`. Do not point a preview at a production database.

## Local checks

Use a supported Node version (this pass used Node 24). Dependency lifecycle scripts normally generate the Prisma client. Client generation reads the checked-out schema and does not require a database connection; migrations, seeds and backfills are separate actions and must target a confirmed development database.

```sh
npm run test
npm run lint
npm run typecheck
npm run build
DISABLE_ANALYTICS_TRACKING=true npm run start -- --port 4808
```

The normal test and lint commands include the shared Lucide icon guard. Tests exercise aggregation, invalid responses, partial failures, stalled requests and coherent illustrative totals. See `docs/quality/dashboard-review-20261120.md` for the verified scope and remaining limitations.
