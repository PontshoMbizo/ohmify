# Scope.io Design System — Conventions

## Visual language

**One sentence:** Clean gray-on-white cards, `green-600` as the primary action color, `rounded-2xl` surfaces with hairline borders, and tiny ALL-CAPS black-weight labels as the typographic signature.

### Color

| Role | Tailwind class | Use |
|---|---|---|
| Primary action / brand | `green-600` (hover `green-700`), `green-50/100` tints | CTAs, active states, success, solver flow |
| Creator Studio accent | `blue-600`, `blue-50` | Problem creation wizard, "reference/expected" data — never use blue as primary action in solver UI |
| Success / pass | `green-500/600` | Grading pass states |
| Error / fail | `red-500`, `red-50` | Failed tests, destructive actions |
| Warning | `amber-400`, `yellow-100` | Streak, pending states |
| Structural neutrals (main app) | `gray-*` ramp | Body text, borders, surfaces |
| Structural neutrals (Creator Studio) | `slate-*` ramp | Cooler read inside Create flow; not interchangeable with gray |
| Simulator surface | `#070707` background, `white/10` borders | Dark canvas, all overlay controls use `bg-white/5 backdrop-blur-md` |

### Typography

Fonts: **Geist Sans** (body), **Geist Mono** (`font-mono`), `font-jersey` reserved for the "Scope.io" wordmark only.

**Signature micro-label (use everywhere for labels, eyebrows, captions):**
```
text-[10px] font-black uppercase tracking-widest text-gray-400
```

**Section headings (main app):** `font-black uppercase tracking-tight text-gray-800`  
**Creator Studio headings:** `font-black uppercase tracking-tighter text-blue-600` with a `text-[10px] font-black uppercase tracking-widest text-slate-400` step label above

### Spacing & shape

- Cards: `rounded-2xl border border-gray-200 bg-white shadow-sm p-5` or `p-6`
- Creator Studio cards: `rounded-2xl border border-slate-200 bg-white shadow-sm`
- Buttons (primary): `bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 font-bold`
- Badges / chips: `rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest`

### Icons

lucide-react, `strokeWidth={2.2}`. Icon buttons: `w-10 h-10` circle with `border border-white/10 bg-white/5 backdrop-blur-md rounded-full`.

## Component patterns

### Auth-aware components (AuthProvider context)
`Navbar`, `Drawer`, `ProblemList`, `SolveProblem` etc. all read from `useAuth()`. In design contexts the user is `null` (logged-out) — show signed-out/guest UI.

### Simulator components (Simulator, SimulatorEmbed)
These embed live iframes and require a running server. In design, their dark chrome (toolbar, speed slider, status readout) renders without the live sim. Use as layout reference; the iframe content won't render in Claude Design.

### Creator Studio wizard (CreateProblem)
Step flow: StrategySection → DetailsSection → TemplateSection → SolutionSection → ReviewSection. All steps receive `{ problem, updateProblem }`. `problem` is a flat object; call `updateProblem({ key: value })` to merge.

### AutoMarker / Results (grading output)
AutoMarker wraps Results. Pass `testSuite` (grading output object) and `activeTestTab` + `setActiveTestTab` for the tab state. Without a testSuite, it shows "AWAITING CAPTURE" state.

## Do/don't

- **Do** use `rounded-2xl` consistently. Avoid mixing with `rounded-lg` in the same context.
- **Do** use the micro-label pattern (`text-[10px] font-black uppercase tracking-widest`) for every section eyebrow and field label.
- **Don't** use blue in the solver/play flow — blue is strictly Create Studio and "reference data."
- **Don't** add new colors. Extend with tints of the existing green/gray/blue/red/amber ramp only.
- **Don't** render Simulator or SimulatorEmbed as primary content without a `height` wrapper — they fill their container.
