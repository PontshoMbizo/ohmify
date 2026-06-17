# Ohmify — UI Style Guide

**Read this before building or editing any UI.** It documents the design language
that already exists across the app so new work matches it. These aren't
aspirations — they're extracted from the current components. When in doubt, copy an
existing pattern rather than inventing one.

Stack: Tailwind CSS v4 + **daisyUI** (default light theme) · Geist Sans / Geist Mono ·
lucide-react icons · Chart.js for data viz.

---

## 1. The look in one sentence
Clean gray-on-white surfaces, **green** as the brand/action color, generous
`rounded-2xl` cards with hairline borders and soft shadows, and tiny **black-weight,
uppercase, wide-tracked** labels as the recurring typographic signature.

---

## 2. Color

### Brand & semantic
| Role | Token | Notes |
|---|---|---|
| **Primary brand / action** | `green-600` (hover `green-700`), tints `green-50/100`, ring `green-500` | The default for CTAs, active states, the solve/learn flow. Logo stroke is `#0d7406`. |
| **Creator Studio accent** | `blue-600` (hover `blue-700`), `blue-50` | Used *specifically* in the problem-creation flow and to mean "expected/reference" in data. Don't use blue as a primary action in the solver UI. |
| **Success / pass** | `green-500/600` | |
| **Fail / destructive** | `red-500`, tint `red-50` | Failed tests, reset/delete actions. |
| **Warning / streak / "coming soon"** | `amber-400`, `yellow-100/700`, `orange-600` | |

### Neutrals (the bulk of the UI)
Gray ramp is the default: `gray-400` (muted text/labels), `gray-500/600/700/800`
(body→headings), `gray-100/200` (borders), `gray-50` / `#f8f9fa` (app background),
white (cards). **Creator Studio uses the `slate-*` ramp** instead (`slate-50/200/400/900`)
to read slightly cooler — keep that split: gray for the main app, slate inside Create.

daisyUI semantic tokens also appear: `base-100` (surface), `base-200/300` (muted
fills/borders). Prefer explicit gray/slate utilities for new work to stay consistent
with the majority of the codebase; use `base-*` only when extending an area that
already uses it.

### Rule of thumb
> Green = the app & success. Blue = Create & "reference" data. Gray = everything
> structural. Red/amber = status only. Don't introduce new hues.

---

## 3. Typography

Fonts are wired in `app/layout.js`: **Geist Sans** (body, via `antialiased`),
**Geist Mono** (`font-mono`), and `font-jersey` reserved for the "Ohmify" wordmark only.

### The signature micro-label (used 40+ times — use it, don't reinvent)
```
text-[10px] font-black uppercase tracking-widest text-gray-400
```
Section eyebrows, field labels, stat captions. Scale the size (`text-[9px]`,
`text-xs`) but keep the **black weight + uppercase + widest tracking**.

### Headings
- Big section titles: `text-2xl/3xl font-black uppercase tracking-tighter`, colored
  `text-green-600` (app) or `text-blue-600` (Create).
- Card/sub headings: `font-black uppercase tracking-tight` or `font-bold`.

### Body & data
- Body copy: default sans, `text-sm`, `text-gray-600/700`.
- **Numbers, scores, hex, time, anything tabular: `font-mono`.** Always.
- Italic is reserved for soft instructional hints (e.g. the amber action cards).

### Weight discipline
`font-black` for labels/headings, `font-bold` for emphasis, normal for body. This app
leans heavy — when unsure between bold and black for a label, pick `font-black`.

---

## 4. Shape, depth, spacing

| Element | Convention |
|---|---|
| **Cards / panels** | `rounded-2xl` + `border border-gray-200` (or `slate-200`) + `shadow-sm`, white bg. This is *the* card. |
| **Buttons, pills, badges, avatars** | `rounded-full` |
| **Inputs, small controls** | `rounded-lg` / `rounded-xl` |
| **Hero imagery** | `rounded-3xl` |
| **Shadows** | `shadow-sm` resting cards · `shadow-md` raised buttons · `shadow-xl`/`shadow-2xl` overlays, modals, toasts · `shadow-inner` inset wells |
| **Borders** | hairline, low-contrast: `border-gray-100/200`. Active = brand color border (`border-green-500`, `border-blue-600`). |

Spacing: roomy. `gap-3/4/6`, `p-4/6/8`, `space-y-4/6`. Rounded + padded + hairline
border + soft shadow is the default container recipe.

---

## 5. Components (daisyUI — prefer these over hand-rolled)

Already in use: `btn`, `tabs`, `badge`, `input`/`textarea`/`select` (`*-bordered`),
`menu`, `drawer`, `dropdown`, `navbar`, `divider`, `loading`, `alert`. Reach for the
daisyUI class first; only drop to raw Tailwind when daisyUI can't express it.

### Buttons
```html
<!-- Primary CTA (app) -->
<button class="rounded-full px-8 py-2.5 text-sm font-black uppercase tracking-widest
               bg-green-600 text-white shadow-md hover:bg-green-700
               disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all">
  Next Step
</button>

<!-- Primary CTA (Creator Studio) — same shape, blue -->
<button class="btn btn-primary rounded-full bg-blue-600 border-none hover:bg-blue-700
               font-black uppercase tracking-widest">Publish Challenge</button>

<!-- Secondary / ghost -->
<button class="btn btn-ghost btn-sm opacity-50 uppercase font-black tracking-widest">Back</button>

<!-- Outline (e.g. Sign in) -->
<button class="btn btn-sm btn-outline btn-success font-bold px-4 rounded-full">Sign in</button>
```
Rules: primary actions are **green pills** (blue inside Create), uppercase black wide
text, always include the `disabled:` triplet, `transition-all` on interactive elements.

### Tabs
daisyUI `tabs` in `tabs-boxed` (rounded fill) or `tabs-lifted/lift` (folder) variants.
Active tab gets the brand color: `tab-active bg-blue-600 text-white` (Create) or the
default lifted white. Tab labels follow the `font-black uppercase` idiom.

### Cards / panels
```html
<div class="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">…</div>
```

### Status & feedback
- Verdict/scorecards: tinted card, brand-paired border — pass `bg-green-50 border-green-200`,
  fail `bg-red-50 border-red-200`.
- Toasts/overlays: dark `bg-slate-900 text-white rounded-2xl shadow-2xl`, brand accent ring.
- Loading: daisyUI `loading loading-spinner` / `loading-ring`, often green, with an
  uppercase `animate-pulse` caption.
- "Coming soon": dashed `border-dashed border-gray-200` panel + yellow pill badge.

---

## 6. Layout patterns
- **App shells fill the viewport**: `h-screen` / `h-[calc(100vh)]` with
  `overflow-hidden`; inner regions scroll.
- **Split workspace**: simulator + controls is `w-[70%]` / `w-[30%]` with a `border-l`
  divider (Creator Studio, Solve). Problem page is `lg:grid-cols-2`.
- **Fixed sidebars**: `w-56` / `w-60`, white, `border-r border-gray-100`.
- **Backgrounds**: app `#f8f9fa` / `gray-50`; cards white; Create sidebars `slate-50`.

---

## 7. Icons
**lucide-react** is the icon library (import named icons). Inline SVGs exist for
one-offs and brand marks — match their stroke style (`strokeWidth={2}`,
`strokeLinecap/Linejoin="round"`). Size with the `size` prop or `size-4/5/6`.
Don't add a second icon set.

---

## 8. Data visualization (Chart.js)
Charts are core to this app — keep the data palette consistent so "expected vs yours"
reads the same everywhere:

| Series | Color |
|---|---|
| **Expected / reference / golden** | blue `#3b82f6` (often dashed, `borderDash:[5,5]`, low alpha) |
| **Your / user output** | green `#22c55e` (solid, heavier `borderWidth`) |
| **Current (load charts)** | amber `#f59e0b` |
| **Phase (Bode)** | purple `#a855f7` |

Conventions: `maintainAspectRatio:false` in fixed-height wrappers, `animation:false`,
`pointRadius:0` for dense waveforms, `font-mono` tick/tooltip values, units in tooltips
(` V`, ` mA`, hex via `GeneralUtils.toHex`).

---

## 9. DO / DON'T

**DO**
- Reuse the micro-label, green-pill, and `rounded-2xl` card patterns verbatim.
- Keep green=app / blue=Create / gray=structure.
- Put numbers in `font-mono`.
- Use daisyUI components and `transition-all` + `disabled:` states.

**DON'T**
- Introduce new colors, fonts, or an icon set.
- Use blue as a primary action in the solver, or green chrome inside Create.
- Use sentence-case or thin weights for labels (they're black + uppercase + tracked).
- Hand-roll a button/tab/input when daisyUI has one.
- Use sharp corners or hard/heavy borders — radii are generous, borders are hairline.

> Smallest-diff rule: when adding to an existing screen, match that screen's local
> choices (gray vs slate, which accent) over this guide's defaults. Consistency
> *within a view* wins.
