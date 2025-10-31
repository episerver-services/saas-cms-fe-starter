# 🧑‍💻 Developer Standards

This document defines conventions and expectations for contributors working on the client FE repository. These standards help ensure a consistent, maintainable, and accessible codebase.

_Last updated: **31 October 2025**_

---

## 📁 Folder Structure

- `app/`: Next.js App Router layout, dynamic routes, and shared components
- `lib/`: Custom utilities and Optimizely SDK logic
- `features/`: BDD feature files (Gherkin format)
- `e2e/`: Playwright E2E tests
- `public/`: Static assets
- `docs/`: Project documentation

---

## 🧼 Code Style & Formatting

- TypeScript is required — no plain `.js` files in the main app
- Format code using **Prettier** (`.prettierrc` respected)
- Run `pnpm lint` before committing
- Use named imports and avoid default exports where possible
- Group imports: external → internal → styles/assets

Example:

```ts
import { useEffect } from 'react'
import { getPageByURL } from '@/lib/optimizely/fetch'
import styles from './example.module.css'
```

---

## 📘 Documentation Standards

### JSDoc Usage

- All functions, components, and modules **must** be annotated with JSDoc comments.
- Required tags include:
  - `@param` – for all function arguments
  - `@returns` – for return values (or `void`)
  - `@throws` – for known error conditions (optional but encouraged)
- Use `/** ... */` block format at the function or export level.
- Keep descriptions clear, concise, and meaningful for both internal and public-facing modules.

### Example:

```ts
/**
 * Calculates VAT-inclusive price.
 *
 * @param price - The base price
 * @param vat - VAT percentage
 * @returns The final price including VAT
 */
function calculatePrice(price: number, vat: number): number {
  return price + price * (vat / 100)
}
```

---

## 📘 Naming Conventions

- Components: `PascalCase` → `HeroBlock.tsx`, `ContentAreaMapper.tsx`
- Variables: `camelCase` → `pageData`, `isDraftMode`
- Constants: `UPPER_SNAKE_CASE` → `IS_BUILD`
- Filenames: Match component name → `content-area-mapper.test.tsx` for `ContentAreaMapper.tsx`

---

## 🔐 Environment Variables

All runtime configuration is via `.env.*` files, shared between local, preview, and production builds.

Required keys:

- `OPTIMIZELY_API_URL`
- `OPTIMIZELY_SINGLE_KEY`
- `OPTIMIZELY_PREVIEW_SECRET` (used for middleware token validation)
- `OPTIMIZELY_REVALIDATE_SECRET`
- `NEXT_PUBLIC_CMS_URL`
- `NEXT_PUBLIC_MOCK_OPTIMIZELY`
- `IS_BUILD` (used to skip CMS calls during CI/CD builds)

Use `dotenv-cli` for local overrides or `.env.local` for developer-specific secrets.

---

## 🧪 Testing Strategy

| Type | Tool               | Folder           |
| ---- | ------------------ | ---------------- |
| Unit | Jest + RTL         | `app/__tests__/` |
| BDD  | Cucumber + Gherkin | `features/`      |
| E2E  | Playwright         | `e2e/`           |

Tests should cover:

- All block components and slot rendering logic (including nested/recursive slots)
- Error boundaries and fallbacks
- Home and layout routing
- Preview/draft toggles

Run tests via:

```bash
pnpm test
pnpm test:playwright
pnpm test:bdd
```

---

## ♿ Accessibility

Follow WCAG 2.1 AA compliance:

- Use `aria-*` attributes for toggles, accordions, and skip links
- Use semantic elements: `<nav>`, `<main>`, `<button>`, `<h1>` etc.
- Ensure keyboard operability and visible focus styles
- Avoid `overflow-x: hidden` unless explicitly required

---

## 🚦 Git & CI

- All development must be done on **feature branches** created from `develop`.
- Branch naming convention is: `feature/<JIRA-ID>`  
  e.g. `feature/OCM-51`

```bash
git checkout develop
git pull
git checkout -b feature/OCM-51
```

- Keep commits focused and descriptive:
  - Prefixes like `feat:`, `fix:`, `chore:` are optional but encouraged.
  - Avoid large “catch-all” commits; prefer smaller, atomic changes.

- PRs must target `develop`, **not** `main`.
  - PR titles should include the Jira ticket number, e.g. `OCM-51: Add ImageBlock component`.

### ✅ Before opening a PR:

- Ensure linting passes:

```bash
pnpm lint
```

- Run all tests:

```bash
pnpm test
pnpm test:bdd
pnpm test:playwright
```

- If adding a new block/component:
  - Include a unit test (`*.test.tsx`)
  - Add Storybook stories (if adopted)
  - Ensure it supports `aria-*` attributes if interactive

### 🔄 CI Automation

- GitHub Actions automatically run on:
  - Push to `develop` or any `feature/*` branch
  - Pull requests targeting `develop`

- Local `pre-commit` hook (Husky) enforces:
  - Linting
  - Prettier formatting

---

## 📦 Codegen

GraphQL types and SDK methods are generated via:

```bash
pnpm codegen
```

Do not edit generated files manually.  
Codegen is optional when operating in mock-only mode.

- GraphQL queries live in: `lib/optimizely/queries/`
- Generated SDK outputs to: `lib/optimizely/sdk.ts`
- Config in: `codegen.ts`

---

## 🧪 Preview Mode & Draft Handling

Draft mode and preview handling are secured via the middleware and `/api/preview` route.

- Draft routes live under `/draft/[version]/[[...slug]]`
- `checkDraftMode()` wraps Next.js `draftMode()` for safe detection in dev and prod
- Middleware validates `OPTIMIZELY_PREVIEW_SECRET` before allowing access to draft or preview routes
- Preview pages automatically set `robots: noindex, nofollow, nocache`
- Never expose unpublished content outside of authenticated draft routes

---

## 📌 Contributions

- Follow this doc before raising PRs
- PRs must pass linting, unit tests, and Playwright checks
- Keep all business logic outside components where possible

---

## 🔗 References

- [Next.js Docs](https://nextjs.org/docs)
- [Optimizely SaaS CMS Docs](https://docs.developers.optimizely.com)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
