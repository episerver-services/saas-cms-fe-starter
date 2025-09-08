# 🏗️ Project Architecture: Optimizely SaaS CMS FE Template

This document outlines the architectural design of the custom front-end built for Optimizely SaaS CMS. It explains how content flows from the CMS through the GraphQL layer into page rendering and how the app supports features like preview mode, Visual Builder readiness, and static revalidation.

_Last updated: 01 September 2025_

---

## 🧠 High-Level Overview

- **Framework:** Next.js 15 (App Router)
- **Rendering:** Static + Server-Side Rendering (ISR/SSR)
- **CMS:** Optimizely SaaS CMS (Delivery API v2, GraphQL)
- **Auth:** Bearer Token via env config
- **Content Delivery:** CDN-optimized, supports image transformation
- **Preview:** Next.js Draft Mode with URL toggling
- **Testing:** Jest, Playwright, Cucumber
- **Build:** Docker-ready with CI/CD pipelines via GitHub Actions

---

## 📦 Data Flow

1. **Request hits** `[locale]/[slug]/page.tsx`
2. **Content fetch:** Uses temporary SDK methods wrapping mock GraphQL calls
   - Tries `CMSPage` first via `GetAllPagesVersionByURL`
   - Fallbacks to `SEOExperience` (Visual Builder)
3. **Draft mode check:** Uses `draftMode().enable()` to show unpublished content
4. **Component rendering:** Uses `ContentAreaMapper` with `__typename`-driven factory
5. **Slot recursion:** Nested slots rendered via recursive helper

---

## 📡 Optimizely CMS Integration

### Delivery API

- GraphQL endpoint accessed via `.env` bearer token
- SDK is stubbed for now; future integration will use GraphQL Codegen (`pnpm codegen`)
- Live schema fragments and query generation to follow

### Content Types

- `CMSPage` → Traditional structured pages
- `SEOExperience` → Visual Builder layouts (composition-based)

---

## ⚙️ Draft Mode Support

- Drafts are toggled via `/draft?url=/target`
- Internally calls `draftMode().enable()` in API route
- `page.tsx` uses `await draftMode()` to branch rendering
- Supports both `CMSPage` and `SEOExperience` previews

---

## 🧩 Visual Builder Compatibility

- **SafeVisualBuilderExperience** type guards composition shape
- `VisualBuilderExperienceWrapper` handles rendering in draft mode
- `displaySettings`, `component`, and `slots` mapped dynamically
- Layout-aware rendering logic partially implemented; awaits live CMS schema and fragments

---

## 🛠️ Static Rendering & Revalidation

- Static generation (`generateStaticParams`) temporarily disabled
- All routes fallback to SSR due to dynamic mocks
- `/api/revalidate` available for future CMS-triggered revalidation

---

## 🧪 Testing Overview

- **Unit tests:** Jest + RTL for key rendering logic
- **BDD:** Gherkin/Cucumber via `features/*.feature`
- **E2E:** Playwright tests simulate full browser behaviour

---

## 📂 Current State

- ✅ Mock content rendering functional via local adapters
- ✅ Visual Builder draft rendering stub in place
- ✅ All key routes scaffolded using App Router
- 🔄 SDK and type-safe queries to be integrated from CMS GraphQL schema
- 🔲 CMS block/component mapping and design system integration in progress

---

## 📌 Summary

This architecture is designed to be scalable, maintainable, and CMS-agnostic enough to adapt to Optimizely’s evolving Visual Builder features. It strikes a balance between flexible content modelling and rigorous performance/accessibility controls.
