# 🏗️ Project Architecture: Optimizely SaaS CMS FE Template

This document outlines the architectural design of the custom front-end built for Optimizely SaaS CMS.  
It explains how content flows from the CMS through the GraphQL layer into page rendering and how the app supports features like preview mode, Visual Builder readiness, and static revalidation.

_Last updated: **30 October 2025**_

---

## 🧠 High-Level Overview

- **Framework:** Next.js 15 (App Router)
- **Rendering:** Static + Server-Side Rendering (ISR/SSR)
- **CMS:** Optimizely SaaS CMS (Delivery API v2, GraphQL)
- **Auth:** Delivery Key (published) and Basic Auth (preview)
- **Content Delivery:** CDN-optimized with built-in image transformation
- **Preview:** Next.js Draft Mode + Visual Builder routes
- **Testing:** Jest, Playwright, Cucumber
- **Build:** Docker-ready with CI/CD pipelines via GitHub Actions

---

## 📦 Data Flow

1. **Request hits** `[locale]/[[...slug]]/page.tsx`
2. **Content fetch:** `optimizely.getPageByURL()` for published pages or `optimizely.GetPreviewStartPage()` for draft mode
3. **Draft mode check:** Safe detection via `checkDraftMode()`
4. **Component rendering:** `ContentAreaMapper` handles both CMS and Visual Builder blocks
5. **Slot recursion:** Nested content areas rendered recursively via `renderNestedSlots()`

---

## 📡 Optimizely CMS Integration

### Delivery API

- Accesses GraphQL via environment-configured Delivery Key
- Preview requests use Basic Auth from `OPTIMIZELY_PREVIEW_SECRET`
- Wrapper: `/lib/optimizely/fetch.ts` handles mocks, errors, and caching
- GraphQL Codegen optional for schema-typed queries

### Content Types

- `CMSPage` → Structured page content
- `Experience` → Visual Builder composition-based pages

---

## ⚙️ Draft Mode Support

- Draft mode routes live under `/draft/[version]/[[...slug]]`
- API endpoints `/api/preview` and `/api/preview/disable` toggle state
- Safe helper `checkDraftMode()` wraps Next.js `draftMode()`
- Fully supports both `CMSPage` and `Experience` preview flows

---

## 🧩 Visual Builder Compatibility

- `ContentAreaMapper` supports Visual Builder compositions (`isVisualBuilder`)
- `OnPageEdit` listens for `optimizely:cms:contentSaved` → refreshes or navigates to new version
- `data-epi-block-id` and `data-epi-edit` attributes enable Visual Builder block highlighting
- Communication injector loaded dynamically via `<Script>` in `SharedPageLayout`
- `useIsInsideVB` hook detects iframe context for VB-only logic

---

## 🛠️ Static Rendering & Revalidation

- `generateStaticParams` enabled for published pages (empty fallback in mock mode)
- Cache tagging (`next: { tags: ['optimizely-content'] }`) enables ISR revalidation
- `/api/revalidate` route optional for CMS-triggered refresh

---

## 🧪 Testing Overview

- **Unit tests:** Jest + RTL for render logic (`ContentAreaMapper`, `draft/page`, etc.)
- **BDD:** Gherkin/Cucumber for future integration
- **E2E:** Playwright for browser-level testing of preview and publish flows

---

## 📂 Current State

- ✅ Mock + live fetch hybrid layer stable
- ✅ Visual Builder draft rendering functional
- ✅ Draft mode routes and event handling in place
- 🔄 Optional GraphQL schema typing via Codegen
- 🔲 CMS block/component mapping for design system ongoing

---

## 📌 Summary

This architecture is scalable, maintainable, and fully Visual Builder–ready.  
It balances flexible content modelling, clean client/server boundaries, and zero-cost Visual Builder integration for editors.