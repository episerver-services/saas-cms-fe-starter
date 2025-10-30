# 📋 Handover & TODO: SaaS CMS FE Starter

This document outlines the current state of the **SaaS CMS Frontend Starter** and recommended next steps for the next development team. It serves as a handover checklist and TODO list.

_Last updated: **30 October 2025**_

---

## ✅ Current State

- Next.js 15 app router scaffold in place (`/app`, `/lib`, etc.)
- Optimizely GraphQL fetch utilities wired for both **preview** and **published** modes
- Draft mode support implemented for unpublished pages and blocks
- Visual Builder (VB) wrapper structure started; types and guards in place
- Unit test suite with Jest + RTL complete for all utils and draft/VB wrappers
- Playwright and Cucumber BDD test runners wired up (basic examples only)
- Storybook configured with mock-driven dev workflow
- Environment and Docker setup complete for local and container builds
- Accessibility, SEO, and metadata wired as stubs/placeholders
- README, STATUS, and TESTING docs up to date

---

## 🔜 Immediate Next Steps

1. **CMS Integration**
   - Re-enable GraphQL codegen and SDK against the client’s Optimizely schema.
   - Configure env vars for delivery & preview keys.
   - Replace stub queries with generated fragments.

2. **Core Components**
   - Implement CMS-driven rendering for:
     - Text / Rich Text
     - Image / Media
     - CTA Button / Link
     - Accordion / Tabs
     - Forms (basic starter)
   - Expand `ContentAreaMapper` with component mappings.

3. **Pages & Layout**
   - Finalise homepage, content pages, and VB page routes.
   - Wire header, footer, navigation, and skip links.
   - Confirm locale-aware slug resolution and metadata generation.

---

## 🖼️ Visual Builder (VB)

- Expand `VisualBuilderExperienceWrapper` to handle all node types.
- Implement slot renderer for sections/rows/columns.
- Ensure inline/shared blocks are resolved with `resolveInlineBlocks`.
- Add safe fallbacks for unpublished/missing VB content.

---

## 📊 Performance & Delivery

- Confirm Next.js image optimisation with Cloudinary/Cloudflare loaders.
- Add CDN configs and verify caching headers.
- Hook up Web Vitals observer to analytics endpoint (GA4, Sentry, or LogRocket).

---

## 🛡️ Accessibility & SEO

- Audit for WCAG compliance.
- Ensure correct ARIA attributes on accordions, nav, and forms.
- Complete metadata pipeline with CMS-driven fields (title, desc, og:image).
- Expand sitemap/robots from static to CMS-driven.

---

## 🧪 Testing

- Extend **unit tests** to all CMS components once implemented.
- Expand **Playwright** scenarios for end-to-end preview & publish flows.
- Add **BDD features** for core user journeys (homepage, form submission, navigation).
- Consider contract tests against Optimizely GraphQL schema.

---

## 🕹️ Compliance & Observability

- Choose and integrate CMP (Cookiebot, Osano, etc.).
- Add logging and error monitoring (Sentry, LogRocket).
- Instrument RUM for Core Web Vitals.

---

## 🔧 Developer Experience

- Add more Storybook stories once real components exist.
- Consider Chromatic for visual regression testing.
- Keep docs (README, STATUS, TESTING, this handover) in sync.

---

## 🎯 Optional Enhancements

- Personalisation & A/B Testing (via Optimizely Feature Experimentation).
- DAM (Digital Asset Management) integration.
- Multi-language/localisation support.
- Advanced caching (stale-while-revalidate, edge functions).
