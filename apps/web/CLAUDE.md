# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is the `apps/web` workspace inside the `auto-doc-gen` repo (root: `../../`). The repo is a multi-app monorepo with `apps/` as the only top-level source directory; there is currently no root `package.json` or workspace manifest, so each app under `apps/` is operated independently from its own directory.

## Commands

Run from `apps/web/`:

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b` against the project references in `tsconfig.json`) and produce a production build via Vite
- `npm run lint` — run ESLint over the workspace
- `npm run preview` — serve the built `dist/` for local verification

There is no test runner configured.

## Architecture notes

- **React Compiler is enabled.** `vite.config.ts` wires `@rolldown/plugin-babel` with `reactCompilerPreset()` alongside `@vitejs/plugin-react`. This means the compiler auto-memoizes components — do not hand-roll `useMemo`/`useCallback`/`React.memo` to work around re-render concerns unless profiling proves it's needed. Be aware this affects dev and build performance (called out in `README.md`).
- **TypeScript uses project references.** `tsconfig.json` is a solution file referencing `tsconfig.app.json` (browser/src code) and `tsconfig.node.json` (Vite config and other Node-side tooling). When adding TS files, place them so they fall under the right reference; `npm run build` invokes `tsc -b` and will fail if a file isn't covered.
- **ESLint flat config.** `eslint.config.js` extends `js.configs.recommended`, `tseslint.configs.recommended`, `eslint-plugin-react-hooks` (flat recommended), and `eslint-plugin-react-refresh` (Vite preset). Type-aware lint rules are intentionally *not* enabled — see `README.md` for the upgrade path if stricter rules are wanted.
- **Static assets in `public/`** (`favicon.svg`, `icons.svg`) are served from the site root. `App.tsx` references icons via `<use href="/icons.svg#..." />` — anything moved out of `public/` must update these absolute paths.
