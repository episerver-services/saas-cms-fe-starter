# 📊 Project Status: SaaS CMS FE Starter

This file tracks the current implementation progress of the custom frontend template for the Optimizely SaaS CMS project.

✅ = Complete  
🔄 = In Progress  
🔲 = Not Started  
❌ = Not in current scope

_Last updated: 30 October 2025_

---

## 🧱 Phase 1: Project Setup & Infrastructure

| Task                                 | Status | Notes                                              |
| ------------------------------------ | ------ | -------------------------------------------------- |
| **Project scaffold & folder layout** | ✅     | App Router, `/app`, `/lib`, etc. all in place      |
| **Environment config (.env setup)**  | 🔄     | `.env.local` expected by codegen + Docker          |
| **.env.example** template            | ✅     | Sample env file included with all variables        |
| **TypeScript + ESLint config**       | ✅     | `tsconfig.json`, `eslint.config.ts` are valid      |
| **GitHub CI/CD pipelines**           | ✅     | `ci-cd.yaml` handles lint, build, test via Actions |
| **Commit linting / Husky hooks**     | ✅     | `.husky/pre-commit` present with `lint-staged`     |

---

## 📦 Phase 2: CMS Integration (Headless Foundation)

| Task                               | Status | Notes                                                                 |
| ---------------------------------- | ------ | --------------------------------------------------------------------- |
| GraphQL API connection             | 🔲     | Optimizely CMS disconnected — integration pending, fully tested       |
| SDK setup with graphql-codegen     | 🔲     | graphql-codegen removed; no generated SDK in use                      |
| Content ID config (home, layout)   | 🔲     | CMS-driven layout/homepage config removed                             |
| Preview mode support (draft route) | ✅     | Draft mode routes implemented and functioning with mock data + VB bridge |
| Mock preview route (`/draft/...`)  | ✅     | Supports local dev without CMS connection                             |
| Fallback & error handling          | ✅     | `not-found.tsx` still handles unresolved routes cleanly               |

---

## 🧱 Phase 3: Core Rendering Logic

| Task                                 | Status | Notes                                                                                           |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| Page routing (`[[...slug]]`)         | ✅     | Catch-all route parses locale internally; supports ISR + preview mode                           |
| Catch-all content renderer           | ✅     | Content renderer stripped back; fallback logic implemented                                      |
| Component factory mapper             | ✅     | Draft/published page rendering active with Suspense + error fallback                            |
| Slot renderer for named areas        | ✅     | Block-to-component mapping via `ContentAreaMapper`                                              |
| ID resolution (inline/shared blocks) | 🔄     | Visual Builder guard placeholders added; DOM mutation observer integrated                       |
| Rich text and media component base   | 🔄     | Placeholder and Storybook setup added; CMS-driven components pending                            |

---

## 🌐 Phase 4: Performance & Delivery

| Task                             | Status | Notes                                                                          |
| -------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Rendering model enforcement      | ✅     | ISR is enabled via `revalidate = 60`; fallback logic active for preview        |
| CDN-based image transformation   | ✅     | `cdn-image`, `cloudinary-loader`, and `next-image-loader` have full unit tests |
| Core Web Vitals setup (LCP, INP) | ✅     | `web-vitals` installed; `VitalsInit` placeholder exists, but is unused         |
| Real-user monitoring/analytics   | ❌     | No RUM or analytics tooling (Sentry, GA4, LogRocket, etc.) configured          |
| VB communication script loading  | ✅     | `communicationinjector.js` now lazy-loaded only when in edit/preview mode      |

---

## 🛡️ Phase 5: Accessibility, SEO & Metadata

| Task                       | Status | Notes                                                               |
| -------------------------- | ------ | ------------------------------------------------------------------- |
| Metadata from CMS          | 🔄     | Metadata scaffolding present; CMS integration pending               |
| Accessibility baseline     | 🔄     | Placeholder structure OK; skip links in place; no WCAG audit yet    |
| Skip links, ARIA audit     | ✅⭐   | Skip link implemented; ARIA + edit-mode context validated           |
| robots.txt / sitemap setup | ✅     | Sitemap and `robots.txt` routes added; static only for now          |

---

## 🧪 Phase 6: Unit & E2E Test Frameworks

| Task                            | Status | Notes                                                                       |
| ------------------------------- | ------ | --------------------------------------------------------------------------- |
| Jest unit test setup            | ✅     | Jest + RTL config present and stable                                        |
| RTL + jest-dom assertions       | ✅     | Matchers like `toBeInTheDocument` available via `@testing-library/jest-dom` |
| Component unit test coverage    | ✅     | Full coverage across `/lib/utils`, loaders, and draft/VB components         |
| E2E/Browsers tests (optional)   | ✅     | Playwright installed; simple baseline test included                         |
| BDD tests (Cucumber) (optional) | ✅     | BDD configured with `@cucumber/cucumber`; working `.feature` test present   |

---

## 🧱 Phase 7: Visual Builder

| Task                                 | Status | Notes                                                                |
| ------------------------------------ | ------ | -------------------------------------------------------------------- |
| Visual Builder support planned       | ✅     | VB now in scope — core infrastructure and preview mode supported     |
| Experience content query (GraphQL)   | ✅     | `_Experience` and preview mode supported via VisualBuilder route     |
| Visual block component compatibility | 🔄     | Component mapping in progress; partial support for dynamic rendering |
| Layout awareness and slot mapping    | ✅     | Layout-aware rendering active; VB slot renderer working correctly    |
| Safe guards for Experience types     | ✅     | `SafeVisualBuilderExperience` types and guards fully implemented     |

---

## 📁 Phase 8: Docs & Developer Experience

| Task                    | Status | Notes                                                |
| ----------------------- | ------ | ---------------------------------------------------- |
| Markdown documentation  | ✅     | All internal guides in `/docs` or README             |
| Code comments + JSDoc   | ✅     | Function-level JSDoc added throughout key files      |
| Dev commands (scripts)  | ✅     | Clean, test, build, preview all covered via `pnpm`   |
| DX setup (editorconfig) | ✅     | Formatting and linting enforced across team setups   |
| Monorepo + deployment docs | ✅   | Monorepo + hosting setup finalized (Vercel/Docker)   |

---

## 🍪 Phase 9: Compliance (Cookies & Consent)

| Task                               | Status | Notes                                                                 |
| ---------------------------------- | ------ | --------------------------------------------------------------------- |
| Cookie consent framework           | ❌     | Requested by client; will require third-party account and integration |
| CMP implementation (Optanon, etc.) | ❌     | Next team will choose and implement provider                          |
