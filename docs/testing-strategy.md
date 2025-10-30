# 🧪 Testing Strategy

This document outlines the testing strategy for this frontend project. It serves as a reference and can be expanded if the client requires a comprehensive coverage or documentation policy.

_Last updated: 30 October 2025_

---

## Overview

The codebase includes support for:

- **Unit Tests** using Jest and React Testing Library (co-located with source files)  
- **BDD Tests** using Cucumber with Gherkin syntax  
- **End-to-End (E2E) Tests** using Playwright  
- **Visual Builder Context Tests** covering VB edit mode and communication injector behaviour  

All frameworks are pre-configured and ready to use.

---

## Unit Testing

- **Location:** Co-located with implementation files, e.g. `*.test.ts` or `*.test.tsx` in `app/` and `lib/`.  
- **Framework:** **Jest** + **React Testing Library**  
- **Focus:** Component rendering, utilities, and data logic.  
- **Includes:** Edit mode context, DOM mutation observer, and Visual Builder bridge tests.

### Example Command

```bash
pnpm test
```

---

## BDD Testing

- **Location:** `features/`  
- **Framework:** **Cucumber** with **Gherkin syntax**  
- **Focus:** Business-level scenarios and user journeys.  
- **Integration:** Next.js routes and CMS preview flows.

### Example Command

```bash
pnpm test:bdd
```

---

## E2E Testing

- **Location:** `e2e/`  
- **Framework:** **Playwright**  
- **Focus:** Real user flows, draft mode toggling, and CMS preview interactions.  
- **Includes:** Draft mode enable/disable, Visual Builder preview route validation.

### Example Command

```bash
pnpm test:playwright
```

---

## Coverage Summary

| Test Type | Framework | Status | Notes |
| ---------- | ---------- | ------- | ------ |
| **Unit** | Jest + RTL | ✅ | Full coverage across utils, edit-mode hooks, and draft logic |
| **BDD** | Cucumber | ✅ | Scenarios ready for CMS preview and routing behaviour |
| **E2E** | Playwright | ✅ | Covers basic flows, draft mode entry, and layout validation |
| **Visual Builder** | Jest | ✅ | Tested via `useIsInsideVB` and DOM observer hooks |

---

## Current Status

The test frameworks are fully operational.  
Unit test coverage includes **VB bridge hooks**, **draft mode**, and **core rendering utilities**.  
BDD and E2E suites are baseline-complete and ready to expand.

📌 Additional coverage can be scaled up as CMS integration resumes.

---

## References

- [Jest Docs](https://jestjs.io/)  
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)  
- [Cucumber.js](https://github.com/cucumber/cucumber-js)  
- [Playwright Docs](https://playwright.dev/)  
