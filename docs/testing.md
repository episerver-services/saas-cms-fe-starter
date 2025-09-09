# 🧪 Testing Strategy

This document outlines the testing strategy for this frontend project. It serves as a reference and can be expanded if the client requires a comprehensive coverage or documentation policy.

_Last updated: 09 September 2025_

---

## Overview

The codebase includes support for:

- **Unit Tests** using Jest and React Testing Library (co-located with source files)  
- **BDD Tests** using Cucumber with Gherkin syntax  
- **End-to-End (E2E) Tests** using Playwright  

All frameworks are pre-configured and ready to use.

---

## Unit Testing

- **Location:** Co-located with implementation files, e.g. `*.test.ts` or `*.test.tsx` in `app/` and `lib/`.  
- **Framework:** **Jest** + **React Testing Library**  
- **Focus:** Component rendering, utilities, and data logic.  

### Example Command

```bash
pnpm test
```

---

## BDD Testing

- **Location:** `features/`  
- **Framework:** **Cucumber** with **Gherkin syntax**  
- **Focus:** Business-level scenarios and user journeys.  

### Example Command

```bash
pnpm test:bdd
```

---

## E2E Testing

- **Location:** `e2e/`  
- **Framework:** **Playwright**  
- **Focus:** Real user flows and page-level interaction.  

### Example Command

```bash
pnpm test:playwright
```

---

## Current Status

The test frameworks are fully operational.  
Unit test coverage is in place across **utils** and **core components**, with BDD and E2E baselines ready to expand.

📌 Additional coverage can be scaled up based on project scope.

---

## References

- [Jest Docs](https://jestjs.io/)  
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)  
- [Cucumber.js](https://github.com/cucumber/cucumber-js)  
- [Playwright Docs](https://playwright.dev/)  
