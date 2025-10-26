# Agentic Video Automator

A Next.js automation cockpit that turns slide-based storyboards into Instagram-ready vertical videos and schedules automatic publishing through the Instagram Graph API.

## Features

- **Slide Composer** – Rapidly assemble branded storyboards with headline, body, color, and duration controls.
- **In-browser Rendering** – Uses `@ffmpeg/ffmpeg` to compile slides into 1080×1920 MP4 reels client-side (no server render costs).
- **Queue & Scheduling** – Stores generated videos, captions, and go-live timestamps in Postgres via `@vercel/postgres`.
- **Instagram Publishing** – Implements the resumable video upload + publish flow against the Instagram Graph API.
- **Automation Hooks** – REST endpoint (`POST /api/cron/process`) and CLI script (`npm run scheduler`) to process and publish due jobs—perfect for Vercel cron or a local worker.

## Getting Started

### Prerequisites

- Node.js 18+
- A Postgres database (Vercel Postgres recommended)
- Instagram Business/Creator account connected to a Facebook Page with a long-lived access token

### Environment Variables

Create `.env.local` with:

```
DATABASE_URL=postgres://...
INSTAGRAM_USER_ID=1784...
INSTAGRAM_ACCESS_TOKEN=EAAB...
```

Next.js automatically reads `DATABASE_URL` for `@vercel/postgres`.

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to compose videos, render them, and schedule uploads.

### Scheduling Worker

Process due posts manually:

```bash
npm run scheduler
```

Or set a cron job (e.g., every 5 minutes) hitting the deployed endpoint:

```
POST https://<your-domain>/api/cron/process
```

## Deployment

The project is optimized for Vercel. Use the provided deployment command:

```bash
vercel deploy --prod --yes --token "$VERCEL_TOKEN" --name agentic-32c84286
```

Ensure the three environment variables above are set in the Vercel project before triggering production builds.

## Instagram Graph API Notes

- Video uploads leverage the resumable upload flow; videos are stored in Postgres as binary blobs until successfully published.
- The access token must have `instagram_content_publish` permissions and remain valid (use Facebook Business Manager to refresh long-lived tokens).
- Publishing failures are persisted on the queue so you can retry after resolving configuration issues.

## License

MIT
