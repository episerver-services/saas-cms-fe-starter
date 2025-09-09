# 🚀 Deployment Notes — SaaS CMS FE Starter (Next.js 15)

This document outlines **deployment options, defaults, and gotchas** for this starter.
Use it as a baseline, then tailor per-environment.

_Last updated: 09 September 2025_

---

## TL;DR (Recommended Paths)

- **Vercel (default choice)** — zero-config builds, ISR, preview deployments from PRs, built-in Next.js support.
- **Docker + Cloud Run / ECS / Azure Web Apps** — reproducible builds, good when infra is standardized on a cloud.
- **Netlify / Amplify** — also fine; just ensure Next 15 + edge/runtime flags are set appropriately.

> Decision rule of thumb:
> - Need the **fastest** path + **preview envs**? → **Vercel**  
> - Need **centralized Docker** and cloud policies? → **Docker + Cloud**  
> - Need tight integration with existing platform? → Netlify/Amplify/etc.

---

## Core Requirements (All Targets)

- **Node**: 18.x or 20.x
- **Env vars** (at minimum):
  - `OPTIMIZELY_API_URL`
  - `OPTIMIZELY_SINGLE_KEY`
  - `OPTIMIZELY_PREVIEW_SECRET`
  - `OPTIMIZELY_REVALIDATE_SECRET` (if using on-demand ISR)
  - `NEXT_PUBLIC_CMS_URL`
  - For local/mocks: `MOCK_OPTIMIZELY`, `NEXT_PUBLIC_MOCK_OPTIMIZELY`
- **Build**: `pnpm install && pnpm build`
- **Start**: `pnpm start` (or platform-equivalent)
- **Cache/ISR**: ensure the platform **supports Next.js ISR** and **request header passthrough** for draft/preview mode.

---

## Vercel

### Project Settings
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Output**: Auto (Next.js)
- **Env Variables**: add all required keys above in **Project → Settings → Environment Variables**.
- **Preview Deployments**: Enabled (per PR by default).
- **Image Optimization**: Configure `next.config.mjs` `images.remotePatterns` for your CMS/CDN (Cloudinary/Optimizely/Cloudflare).

### ISR / Revalidation
- Revalidate interval is set in route files or using `revalidate` export.
- For on-demand revalidation, create an API route (already present) and set a **webhook** in CMS:
  - Endpoint: `/api/revalidate?secret=${OPTIMIZELY_REVALIDATE_SECRET}`
  - Method: `POST`

### Draft Mode
- Ensure `OPTIMIZELY_PREVIEW_SECRET` is set.
- Draft routes under `/draft/...` are designed for editor previews. Protect with Vercel env scoping if needed.

### Vercel Monorepo (Turborepo) Tips
- In **Project Settings → Root Directory** set to the app path: `apps/web`
- Add `pnpm-workspace.yaml` at repo root.
- Optionally include a `vercel.json` with monorepo project config (only if needed).

---

## Docker (Generic)

Use the provided `Dockerfile` (or create if absent):

```Dockerfile
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
- Build the image and push to GCR/Artifact Registry.
- Deploy with min instances (for warm starts) if you rely on fast ISR.
- Set environment vars in the service.
- Enable **server-side timeouts** ≥ 60s for heavy preview queries.

### ECS (AWS)
- Push image to ECR; define **Task Definition** with env vars as Secrets.
- Use **Fargate**; map port **3000**.
- **ALB** with target group health checks on `/` (or `/healthz` if you add one).
- Optionally front with **CloudFront** for caching + image optimization pass-through.

### Azure Web Apps for Containers
- Set startup command to `pnpm start`.
- Configure App Settings with env vars.
- Consider **Azure Front Door** for global caching/SSL.

---

## Netlify

- Use the Next.js runtime plugin if needed for Next 15 features.
- Set **build** to `pnpm build`, **publish** to `.next` is not used (Netlify’s adapter handles it).
- Enable **Edge Functions**/SSR per Netlify’s Next integration.
- Verify ISR support configuration on your plan.

---

## AWS Amplify

- Connect repo → configure build settings:
  - Pre-build: `corepack enable && corepack prepare pnpm@9.6.0 --activate`
  - Build: `pnpm install --frozen-lockfile && pnpm build`
- Amplify auto-detects Next.js and provisions SSR.
- Add env vars in Amplify Console.
- Preview branches map to Amplify **Preview Environments**.

---

## GitHub Actions (Matrix Example)

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

> For **Vercel deployments**, you usually don’t need GitHub Actions to deploy; Vercel builds on push. If you **do** want CI + Deploy via GH Actions, use `vercel/actions` with a token and project ID.

---

## Environment & Secrets Management

- Use per-environment scopes: **Production / Preview / Development**.
- Rotate keys regularly.
- In monorepos, prefer **shared secret managers** (1Password, Doppler, AWS Secrets Manager, GCP Secret Manager).

### Env Matrix (example)
| Var | Dev (local) | Preview | Prod |
| --- | ----------- | ------- | ---- |
| OPTIMIZELY_API_URL | cg.optimizely.com/content/v2 | same | same |
| OPTIMIZELY_SINGLE_KEY | local/test | preview key | prod key |
| OPTIMIZELY_PREVIEW_SECRET | base64-local | base64-preview | base64-prod |
| OPTIMIZELY_REVALIDATE_SECRET | any-local | preview secret | prod secret |
| NEXT_PUBLIC_CMS_URL | *.cms.optimizely.com | same | same |

---

## Caching, Images, and Edge

- **Next/Image**: add `images.remotePatterns` or `images.domains` for Cloudinary/Optimizely/Cloudflare sources.
- **CDN**: If fronted by Cloudflare/CloudFront/Front Door, ensure **origin cache** respects Next’s **ISR** revalidation headers.
- **Compression**: Most platforms handle gzip/br automatically; no manual step required.
- **Edge vs Node runtime**: This starter uses Node runtime by default. If moving handlers to **edge**, ensure APIs used (e.g., `draftMode`) are compatible.

---

## Preview & Draft Mode

- Draft routes live at `/draft/...` and require `OPTIMIZELY_PREVIEW_SECRET` for privileged GraphQL preview requests.
- For “preview from CMS” flows, expose a route `/api/preview` that toggles Next draft mode via a secret token (present in this repo).

---

## Health & Observability

- Optional integrations:
  - Sentry (SSR + browser)
  - Datadog / New Relic
  - GA4 (respect CMP consent modes)
- Log redaction: never log secrets. For GraphQL errors, only return **safe** messages to the client.

---

## Production Checklist

- [ ] All env vars set in hosting platform
- [ ] `MOCK_OPTIMIZELY=false` for prod
- [ ] Image domains/remotePatterns configured
- [ ] Revalidation webhook secret set
- [ ] Draft mode secret set
- [ ] Robots & sitemap verified
- [ ] 404/500 routes render correctly
- [ ] Security headers via platform (or middleware) configured
- [ ] Monitoring/alerts configured
- [ ] Backups/rollbacks defined (platform or infra-level)

---

## FAQ

**Q: Can we deploy the monorepo with Turborepo to Vercel?**  
A: Yes. Create a Vercel project **per app**. Set the app’s **Root Directory** (`apps/web`). Vercel handles workspaces automatically.

**Q: Do we need Docker on Vercel?**  
A: No—Vercel builds from source. Use Docker only for other platforms or local reproducibility.

**Q: How do we enable on-demand ISR from the CMS?**  
A: Configure CMS to call `/api/revalidate?secret=...` on publish/unpublish. The route verifies `OPTIMIZELY_REVALIDATE_SECRET` and invalidates cache by tag/path.
