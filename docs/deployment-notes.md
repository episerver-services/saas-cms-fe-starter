# 🚀 Deployment Notes — SaaS CMS FE Starter (Next.js 15)

This document outlines **deployment options, defaults, and gotchas** for the Optimizely SaaS CMS FE Starter.  
Use it as a baseline, then tailor per environment.

_Last updated: **31 October 2025**_

---

## TL;DR (Recommended Paths)

- **Vercel (default choice)** — zero-config builds, ISR, preview deployments from PRs, built-in Next.js support.
- **Docker + Cloud Run / ECS / Azure Web Apps** — reproducible builds; ideal when infra is standardized on a cloud.
- **Netlify / Amplify** — also fine; just ensure Next 15 + edge/runtime flags are set appropriately.

> **Decision rule of thumb**  
> - Need the **fastest** path + **preview envs** → **Vercel**  
> - Need **centralized Docker** and cloud policies → **Docker + Cloud**  
> - Need tight integration with existing platform → Netlify / Amplify / etc.

---

## Core Requirements (All Targets)

- **Node:** 18 or 20 LTS  
- **Env vars (required):**
  - `OPTIMIZELY_API_URL`
  - `OPTIMIZELY_SINGLE_KEY`
  - `OPTIMIZELY_PREVIEW_SECRET` (used for middleware token validation)
  - `OPTIMIZELY_REVALIDATE_SECRET` (if using on-demand ISR)
  - `NEXT_PUBLIC_CMS_URL`
  - `NEXT_PUBLIC_MOCK_OPTIMIZELY` (for local/mocks)
  - `IS_BUILD` (set to `'true'` for CI/CD build-time optimisation logic)
- **Build:** `pnpm install && pnpm build`
- **Start:** `pnpm start` (or platform equivalent)
- **Cache / ISR:** ensure the platform supports **Next ISR** and request-header passthrough for draft/preview mode.

---

## Vercel

### Project Settings
- **Framework Preset:** Next.js  
- **Build Command:** `pnpm build`  
- **Install Command:** `pnpm install --frozen-lockfile`  
- **Output:** Auto (Next.js)  
- **Env Variables:** add all required keys under _Project → Settings → Environment Variables_  
- **Preview Deployments:** Enabled (per PR by default)  
- **Image Optimization:** configure `next.config.mjs → images.remotePatterns` for CMS/CDN (Optimizely Assets, Cloudinary, etc.)

### ISR / Revalidation
- Revalidate interval is set via each route’s `revalidate` export.
- For on-demand ISR, use the existing API route and set a CMS webhook:
  ```
  POST /api/revalidate?secret=${OPTIMIZELY_REVALIDATE_SECRET}
  ```

### Draft Mode
- Draft/Visual Builder routes live under `/draft/[version]/[[...slug]]` and require a **valid preview token**.
- Preview token (`OPTIMIZELY_PREVIEW_SECRET`) is validated by the **middleware**, rejecting unauthorised access (401).
- Protect preview envs using **Vercel environment scopes** or team-only access.

### Vercel Monorepo (Turborepo)
- In **Project Settings → Root Directory**, set to `apps/web`  
- Keep a top-level `pnpm-workspace.yaml`  
- Optional `vercel.json` for monorepo overrides (rarely needed)

---

## Docker (Cloud-Ready)

```dockerfile
# syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Run locally:**
```bash
docker build -t saas-cms-fe-starter:latest .
docker run -p 3000:3000 --env-file .env.local saas-cms-fe-starter:latest
```

### Cloud Run (GCP)
- Push built image to GCR/Artifact Registry.  
- Deploy with ≥ 1 min instances (for warm ISR).  
- Set env vars in Cloud Run service.  
- Allow ≥ 60 s timeouts for heavy preview queries.

### ECS (AWS)
- Push to ECR → Task Definition with env vars as Secrets.  
- Use **Fargate**, port 3000.  
- **ALB** with health check on `/` (or `/healthz`).  
- Optionally front with **CloudFront** for caching + images.

### Azure Web Apps
- Startup command: `pnpm start`  
- Configure App Settings (env vars)  
- Optionally front with **Azure Front Door** for global caching/SSL.

---

## Netlify / Amplify

### Netlify
- Use Netlify’s Next.js runtime plugin for Next 15.  
- **Build:** `pnpm build`  
- **Publish:** handled automatically by adapter.  
- Enable **Edge Functions / SSR** on supported plan.  
- Verify ISR support in Netlify config.

### Amplify
- Pre-build: `corepack enable && corepack prepare pnpm@9.6.0 --activate`  
- Build: `pnpm install --frozen-lockfile && pnpm build`  
- Amplify auto-detects Next.js and provisions SSR.  
- Add env vars in Amplify Console.  
- Preview branches map to Amplify **Preview Environments**.

---

## GitHub Actions (CI Matrix)

```yaml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.6.0 }
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint || true
      - run: pnpm test -- --ci --reporters=default --reporters=jest-junit
      - run: pnpm build
```

> For **Vercel deployments**, CI is optional — Vercel builds on push.  
> If you prefer GitHub-driven deploys, use `vercel/actions` with a token + project ID.

---

## Middleware Security

- The root `middleware.ts` enforces preview-token validation for `/draft` and `/preview` routes.  
- Rejects unauthorised requests with HTTP 401.  
- Handles locale cookie persistence (`__LOCALE_NAME`) and adds `X-Locale` response headers.  
- Excludes system paths (e.g. `/api/`, `/auth/`, `/preview`) from locale handling.

---

## Environment & Secrets Management

- Use environment scopes: Production / Preview / Development.  
- Rotate keys regularly.  
- For monorepos, centralize secrets in 1Password, Doppler, AWS Secrets Manager, or GCP Secret Manager.

### Env Matrix (Example)

| Var | Dev (local) | Preview | Prod |
| --- | ------------ | -------- | ----- |
| OPTIMIZELY_API_URL | cg.optimizely.com/content/v2 | same | same |
| OPTIMIZELY_SINGLE_KEY | local/test | preview key | prod key |
| OPTIMIZELY_PREVIEW_SECRET | base64-local | base64-preview | base64-prod |
| OPTIMIZELY_REVALIDATE_SECRET | any-local | preview secret | prod secret |
| NEXT_PUBLIC_CMS_URL | *.cms.optimizely.com | same | same |

---

## Caching, Images & Edge

- **Next/Image:** configure `images.remotePatterns` or `images.domains` for Optimizely Assets / Cloudinary.  
- **CDN:** If fronted by Cloudflare, CloudFront, or Front Door, ensure origin cache respects Next’s ISR headers.  
- **Compression:** Handled automatically (gzip/br).  
- **Runtime:** Node (default). Edge mode possible if APIs (`draftMode`, etc.) remain compatible.

---

## Preview & Draft Mode

- Draft routes: `/draft/[version]/[[...slug]]`  
- Requires `OPTIMIZELY_PREVIEW_SECRET` for privileged GraphQL preview requests.  
- `/api/preview` toggles Next Draft Mode via secret token (present in repo).  
- Disable via `/api/preview/disable`.

---

## Health & Observability

- Optional integrations: Sentry, Datadog, New Relic, GA4 (with CMP consent mode).  
- Log redaction: never log secrets; surface only safe GraphQL errors.

---

## Production Checklist

- [ ] All env vars set in platform  
- [ ] `NEXT_PUBLIC_MOCK_OPTIMIZELY=false` for prod  
- [ ] Image domains configured  
- [ ] Revalidation webhook secret set  
- [ ] Draft mode secret set  
- [ ] Robots & sitemap verified  
- [ ] 404/500 routes render properly  
- [ ] Security headers enabled  
- [ ] Monitoring/alerts configured  
- [ ] Backups/rollbacks defined at platform level

---

## FAQ

**Q: Can we deploy a Turborepo to Vercel?**  
A: Yes. Create a Vercel project per app and set Root Directory to `apps/web`. Vercel handles workspaces automatically.

**Q: Do we need Docker on Vercel?**  
A: No — Vercel builds from source. Use Docker for other platforms or local reproducibility.

**Q: How do we enable on-demand ISR from the CMS?**  
A: Configure Optimizely to POST `/api/revalidate?secret=...` on publish/unpublish.  
  The route verifies `OPTIMIZELY_REVALIDATE_SECRET` and invalidates cache by tag or path.
