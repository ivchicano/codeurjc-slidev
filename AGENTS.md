# codeurjc-slidev

## Project overview

Collection of themes, layouts, addons, and hacks for creating Slidev presentations in the CodeURJC group. Includes a custom layout editor that lets you drag/resize slide elements (red bar, logo, title, content) and save layouts via a Vite dev server middleware.

**Architecture:**
- `slides.md` — presentation source (REST API in React topic)
- `layouts/default.vue` — reusable slide layout with draggable element overlays
- `composables/useEditor.ts` — singleton state for element positions, undo, drag/resize, and save
- `_override/SideEditor.vue` — custom Slidev SideEditor override with a "Layout" tab
- `vite.config.ts` — Vite transform hook that injects the SideEditor override; `/api/save-layout` middleware that persists layout CSS variables

## Stack

- **Framework:** Vue 3 + TypeScript
- **Presentation:** Slidev 52
- **Styling:** UnoCSS
- **Unit tests:** Vitest 4 + jsdom + `@testing-library/vue`
- **E2e tests:** Playwright 1.61 (`@playwright/test`), Chromium
- **Package manager:** pnpm

## Commands

```sh
pnpm install
pnpm dev                    # start slidev dev server (port 3030)
pnpm build                  # build static slides
pnpm export                 # export to PDF
pnpm test                   # run unit tests (vitest)
pnpm test:e2e               # run e2e tests (playwright, auto-starts server)
```

## Tests

- **Unit tests** (`vitest`): `pnpm test` — runs `composables/__tests__/*.spec.ts` in jsdom
- **E2e tests** (`playwright`): `pnpm test:e2e` — runs `tests/*.spec.ts` against a Chromium browser

The e2e `webServer` in `playwright.config.ts` auto-starts Slidev on port 3030 using `e2e/slides.md` as entry. The `e2e/` directory contains symlinks to the root files (`slides.md`, `layouts/default.vue`, `composables/useEditor.ts`, `_override/SideEditor.vue`, `public/`) and its own `vite.config.ts`. Symlinks keep the e2e environment in sync with the root project. All test modifications are restored by `afterAll` hooks.

## Development cycle

1. Implement feature (edit composables, layouts, or override components)
2. Write/update tests (`composables/__tests__/` for unit, `tests/` for e2e)
3. `pnpm test && pnpm test:e2e`
4. `git add -A && git commit -m "message"`
