# Glint

An analytics dashboard built with Next.js, TypeScript, Recharts and PostgreSQL through Prisma. Next.js middleware reads each request's headers and sends visit, location, referral and traffic events to an ingestion API, which stores them with Prisma. A Cloudflare Worker sends simulated traffic on a schedule so the dashboard always has something to show.

## Dashboard

The dashboard opens on a demo dataset covering two weeks of sample traffic. Switch to **Stored snapshot** to load the six metric endpoints:

- visit events by UTC date, with a seven or fourteen date view
- traffic sources and locations
- hourly pattern
- devices and browsers

Every chart has a data table, and each panel has its own loading, empty and retry states. The layout follows the system light or dark setting, respects reduced motion and works with a keyboard. Icons come from Lucide.

## Development

```sh
npm install
npm run dev
```

Set `DISABLE_ANALYTICS_TRACKING=true` to run the dashboard locally without sending events to the ingestion API.

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

## Stack

- Next.js 15 (App Router) and middleware
- PostgreSQL via Prisma
- Recharts
- Cloudflare Worker for simulated traffic
