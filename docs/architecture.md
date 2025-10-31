# 🏗️ Project Architecture: Optimizely SaaS CMS FE Template

This document outlines the architectural design of the custom front-end built for Optimizely SaaS CMS.  
It explains how content flows from the CMS through the GraphQL layer into page rendering and how the app supports features like preview mode, Visual Builder readiness, and static revalidation.

_Last updated: **31 October 2025**_

---

## 🧠 High-Level Overview

- **Framework:** Next.js 15 (App Router)
- **Rendering:** Static + Server-Side Rendering (ISR/SSR)
- **CMS:** Optimizely SaaS CMS (Delivery API v2, GraphQL)
- **Auth:** Delivery Key (published) and Secure Preview Token (validated in middleware)
- **Content Delivery:** CDN-optimized with built-in image transformation
- **Preview:** Next.js Draft Mode + Secure Preview routes (`/draft`, `/preview`)
- **Testing:** Jest, Playwright, Cucumber
- **Build:** Docker-ready, CI/CD via GitHub Actions, `.env`-driven configuration (`IS_BUILD`, `OPTIMIZELY_PREVIEW_SECRET`)

---

## 📦 Data Flow

1. **Request hits** `[locale]/[[...slug]]/page.tsx`
2. **Content fetch:** `optimizely.getPageByURL()` for published pages or `optimizely.GetPreviewStartPage()` for draft mode
3. **Draft mode check:** Safe detection via `checkDraftMode()`
4. **Component rendering:** `ContentAreaMapper` handles both CMS and Visual Builder blocks
5. **Slot recursion:** Nested content areas rendered recursively via `renderNestedSlots()`
6. **Middleware intercept:** `/middleware.ts` validates preview tokens and locale cookies before routing
7. **SEO guardrails:** Preview routes return `robots: noindex, nofollow, nocache`

---

## 📡 Optimizely CMS Integration

- Accesses GraphQL via environment-configured Delivery Key
- Preview requests validated via secure preview token (`OPTIMIZELY_PREVIEW_SECRET`) handled in `middleware.ts`
- Wrapper: `/lib/optimizely/fetch.ts` handles mocks, errors, and caching
- GraphQL Codegen optional for schema-typed queries

---

## ⚙️ Draft Mode Support

- Draft mode routes live under `/draft/[version]/[[...slug]]`
- API endpoints `/api/preview` and `/api/preview/disable` toggle state
- Safe helper `checkDraftMode()` wraps Next.js `draftMode()` and automatically enables preview access in dev mode for local testing
- Draft routes (`/draft/[version]/[[...slug]]`) include `robots: { index: false, follow: false, nocache: true }`

---

## 🧩 Visual Builder Compatibility

- `ContentAreaMapper` supports Visual Builder compositions (`isVisualBuilder`)
- `OnPageEdit` listens for `optimizely:cms:contentSaved` → refreshes or navigates to new version
- `data-epi-block-id` and `data-epi-edit` attributes enable Visual Builder block highlighting
- Communication injector runs in same DOM context (loaded dynamically in `SharedPageLayout`)
- `useIsInsideVB` hook detects iframe context for VB-only logic

---

## 🛠️ Static Rendering & Revalidation

- `generateStaticParams` enabled for published pages (empty fallback in mock mode)
- Cache tagging (`next: { tags: ['optimizely-content'] }`) enables ISR revalidation
- `/api/revalidate` route optional for CMS-triggered refresh
- Draft routes explicitly marked `dynamic = 'force-dynamic'` and `revalidate = 0` to bypass caching

---

## 🧪 Testing Overview

- **Unit tests:** Jest + RTL for render logic (`ContentAreaMapper`, `draft/page`, etc.)
- Verified `checkDraftMode()` behaviour with full Jest coverage (production vs development scenarios)
- **BDD:** Gherkin/Cucumber for future integration
- **E2E:** Playwright for browser-level testing of preview and publish flows

---

## 📂 Current State

- ✅ Mock + live fetch hybrid layer stable  
- ✅ Visual Builder overlay and edit attributes functional  
- ✅ Secure Preview token validation via middleware  
- ✅ Draft mode routes, robots metadata, and error fallbacks complete  
- ✅ Jest coverage for `checkDraftMode()`  
- 🔄 Optional GraphQL schema typing via Codegen  
- 🔲 CMS block/component mapping for design system ongoing  

---

## 📌 Summary

This architecture is scalable, maintainable, and fully Visual Builder–ready.  
It balances flexible content modelling, secure preview handling, and clean client/server boundaries while maintaining zero-cost Visual Builder integration for editors.
