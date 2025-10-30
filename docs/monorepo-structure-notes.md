# 🏗️ Monorepo Structure Notes (SaaS CMS FE Starter)

This document describes how to integrate the **SaaS CMS FE Starter** into a pnpm-based monorepo (Turborepo-style) with multiple Next.js apps and shared packages.

_Last updated: **30 October 2025**_

---

## 📁 Suggested Repo Layout

```
repo/
├─ apps/
│  ├─ marketing/                # Next.js app (this starter)
│  │  └─ draft/                 # Draft & preview routes
│  ├─ docs/                     # Another Next.js app (example)
│  └─ admin/                    # Another app
├─ packages/
│  ├─ lib-optimizely/           # fetch.ts, type guards, language utils, VB types
│  ├─ ui/                       # shared UI (shadcn components, tokens)
│  ├─ hooks/                    # shared React hooks (useIsInsideVB, etc.)
│  ├─ testing/                  # jest/pw configs, test-utils, MSW handlers
│  ├─ eslint-config/            # eslint config shareable package
│  ├─ tsconfig/                 # TS base configs
│  └─ config/                   # shared config helpers (image loader, metadata, etc.)
├─ turbo.json
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ .github/workflows/ci.yml
```

---

## 🔌 Workspace Setup

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json`
```json
{
  "name": "saas-cms-monorepo",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "e2e": "turbo run e2e",
    "bdd": "turbo run bdd"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### `turbo.json`
```json
{
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": { "dependsOn": ["^build"], "outputs": [] },
    "lint": { "outputs": [] },
    "typecheck": { "outputs": [] },
    "e2e": { "dependsOn": ["^build"], "outputs": [] },
    "bdd": { "dependsOn": ["^build"], "outputs": [] }
  }
}
```

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@lib-optimizely/*": ["packages/lib-optimizely/src/*"],
      "@config/*": ["packages/config/src/*"],
      "@testing/*": ["packages/testing/src/*"],
      "@ui/*": ["packages/ui/src/*"],
      "@hooks/*": ["packages/hooks/src/*"]
    }
  }
}
```

---

## 🔄 Wiring the Starter App

- Replace local imports with workspace aliases:  
  - From: `@/lib/optimizely/fetch`  
  - To: `@lib-optimizely/fetch`

- Update `apps/marketing/package.json`:
```json
{
  "name": "@apps/marketing",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "e2e": "playwright test",
    "bdd": "cucumber-js"
  },
  "dependencies": {
    "@lib-optimizely": "workspace:*",
    "@config": "workspace:*",
    "@ui": "workspace:*",
    "@hooks": "workspace:*"
  },
  "devDependencies": {
    "@testing": "workspace:*",
    "next": "15.x",
    "typescript": "^5.5"
  }
}
```

---

## 🧪 Testing Setup

- **Shared presets** in `packages/testing`:
  - Jest (`jest.preset.js`, `setupTests.ts`)
  - Playwright (`playwright.base.ts`)
  - Cucumber (`bdd.base.ts`)

- App-level configs extend these presets.  
- Optional: you can also enable **Vitest** for Storybook/Vite test compatibility.

---

## 🚀 CI/CD Example (GitHub Actions)

```yaml
name: ci
on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [marketing, docs, admin]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Build (scoped)
        run: pnpm turbo run build --filter=@apps/${{ matrix.app }}
      - name: Test (scoped)
        run: pnpm turbo run test --filter=@apps/${{ matrix.app }}
```

---

## ⚠️ Gotchas

- Align Node + Next versions across apps.  
- Draft Mode (`next/headers`) is runtime-scoped — safe in shared packages.  
- Avoid importing **client-only hooks** into server components.  
- Keep secrets **per app** (`.env.local`), but you can add shared defaults in `packages/config-env`.  
- Use `pnpm turbo run build --filter=@apps/marketing` for scoped builds.

---

## ✅ Migration Steps

1. Create monorepo skeleton.  
2. Move current project into `apps/marketing`.  
3. Extract shared code into `packages/lib-optimizely` + `packages/config`.  
4. Update imports to workspace aliases.  
5. Move test presets into `packages/testing`.  
6. Add `packages/hooks` for reusable client-side logic.  
7. Wire `turbo` + CI.  
8. Split envs and connect each app to hosting (Vercel or other).
