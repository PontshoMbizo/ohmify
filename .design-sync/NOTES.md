# Scope.io Design Sync Notes

## Repo facts

- Next.js 16 web app — NOT a standalone component library; synth-entry mode (no `dist/`).
- JavaScript only (JSX + `jsconfig.json`), no TypeScript — `.d.ts` props will be weaker.
- `@/` path alias resolves to repo root (`jsconfig.json`: `"@/*": ["./*"]`).
- CSS: Tailwind v4 + DaisyUI v5, built via PostCSS from `app/globals.css`.
- Auth: `AuthProvider` wraps most complex components via Firebase. Components render in logged-out state (user = null) without Firebase connection — this is correct for design purposes.

## CSS build

CSS is built from a temporary `@source`-enhanced entry and output to `.design-sync/.cache/styles.css`.
Rebuild command (run from repo root):
```bash
node .design-sync/.cache/build-css.mjs
```

## Component exclusions

- `useAuth` — hook, not a component
- `AuthContext` — context object, not a component
- `ComingSoonPanel` — unexported internal in `Drawer.jsx`

## Re-sync risks

- Firebase auth calls in `Navbar`, `Drawer`, `ProblemList`, `AuthProvider` etc. will be no-ops in preview (Firebase not initialised). This is expected; components show logged-out UI.
- `SimulatorEmbed` and `Simulator` embed external simulator iframes — previews will show the iframe element but not a live simulation.
- `MarkdownView` uses `rehype-mathjax` (MathJax) which may require async loading; math previews may not render fully in headless capture.
- CSS generated without a full Next.js compile — if new utility classes are added to components, re-run the CSS build script.

## Known [RENDER_THIN] cases (benign)

- **SampleSolution**: both `EmptyProblem` and `NoData` show the same "NO REFERENCE WAVEFORMS" placeholder — intentional, both variants render identically by design when no solutions exist.
- **Simulator**: both `Default` and `Running` variants show the same dark chrome with CircuitJS iframe not loading (previewed without a live server). The toolbar, speed slider, and canvas overlay are all visible; the identical screenshot is expected.
