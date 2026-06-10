# ParcFermé Stream Proxy — Cloudflare Worker

This Cloudflare Worker handles HLS video stream proxying, offloading all video bandwidth from Vercel's serverless functions (where it counts against Fast Origin Transfer limits) to Cloudflare's edge (free unlimited bandwidth).

## Why?

A single user watching a 1080p HLS stream for 1 hour consumes ~2-5 GB of Vercel function egress. This Worker eliminates that cost entirely — Cloudflare Workers have **free egress** on all plans.

## Setup

### 1. Install dependencies

```bash
cd cf-stream-proxy
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Deploy

```bash
npm run deploy
```

This will output a URL like:
```
https://parcferme-stream-proxy.<your-subdomain>.workers.dev
```

### 4. Configure ParcFermé

Add the Worker URL to your Vercel environment variables:

```
NEXT_PUBLIC_STREAM_PROXY_URL=https://parcferme-stream-proxy.<your-subdomain>.workers.dev
```

Or add it to your `.env.local`:

```env
NEXT_PUBLIC_STREAM_PROXY_URL=https://parcferme-stream-proxy.<your-subdomain>.workers.dev
```

### 5. Update CORS origins (optional)

Edit `wrangler.toml` to restrict which origins can use the proxy:

```toml
[vars]
ALLOWED_ORIGINS = "https://your-domain.com,http://localhost:3000"
```

## Local Development

```bash
npm run dev
```

This starts the Worker locally at `http://localhost:8787`.

## Free Tier Limits

Cloudflare Workers free tier includes:
- **100,000 requests/day**
- **Unlimited bandwidth** (egress is free)
- **10ms CPU time per request** (more than enough for proxying)

For a personal F1 dashboard, this is more than sufficient.
