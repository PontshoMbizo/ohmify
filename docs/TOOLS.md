# Simulator Tools (`/tools`)

Free-exploration sandboxes for digital hardware, embedded alongside the circuit
grading platform. **Tools are not graded** — they are interactive simulators for
learning and experimentation. (Turning them into graded problem types is a future
phase; see "Roadmap" below.)

## What's embedded

| Route | Simulator | Board | Engine | Repo |
|---|---|---|---|---|
| `/tools/fpga` | **nikaVSimulator** | Tang Nano 9K | Verilog → Icarus Verilog | `PontshoMbizo/nikaVSimulator` |
| `/tools/mcu`  | **stmVSimulator** | STM32 Blue Pill | bare-metal C → arm-none-eabi-gcc + QEMU | `PontshoMbizo/stmVSimulator` |

`/tools` is the hub that links to both.

## How the embed works

Each simulator is a **complete, separately-deployed Next.js app** (editor + board
viewer + waveform UI + a `POST /api/simulate` backend). scope.io embeds the whole
app as an `<iframe>` — the same pattern as the CircuitJS embed, except cross-origin
to a deployed service rather than static files in `public/`.

- `components/SimulatorEmbed.jsx` — the iframe wrapper (header strip, loading state,
  and a "not configured" empty state when the URL env var is unset).
- `app/tools/fpga/page.js` / `app/tools/mcu/page.js` — thin pages that pass the
  configured URL to `SimulatorEmbed`.

**Why separate services, not Vercel:** both simulators run *untrusted user code in
server-side sandboxed containers* (`iverilog` / `arm-none-eabi-gcc` + QEMU in
podman). Vercel (serverless, no Docker, 10 s timeout) cannot host that, so the
simulation backends live on a container host and scope.io only frames their UI.

## Configuration

Set the deployed simulator URLs (see `.env.example`):

```
NEXT_PUBLIC_NIKA_URL=   # FPGA / Verilog app  (e.g. http://localhost:3001 in dev)
NEXT_PUBLIC_STM_URL=    # MCU / C app         (e.g. http://localhost:3002 in dev)
```

Unset → the tool page shows a "not configured" state instead of a broken iframe.

On the **simulator side**, each app must allow scope.io to frame it. Both set a
`Content-Security-Policy: frame-ancestors` header in their `next.config.mjs`,
configurable via the `FRAME_ANCESTORS` env var (comma-separated origins; `'self'`
always allowed; defaults to `http://localhost:3000`). Set it to scope.io's
production origin when deploying.

## Local dev

```bash
# terminal 1 — FPGA sim
cd ../nikaVSimulator && npm run dev -- -p 3001
# terminal 2 — MCU sim
cd ../stmVSimulator && npm run dev -- -p 3002
# terminal 3 — scope.io (set the two NEXT_PUBLIC_* URLs in .env.local first)
npm run dev
```

Open `/tools` → pick a simulator. (The sim backends' `/api/simulate` need a
podman/docker runtime locally to actually run code; the UI loads regardless.)

## Roadmap (deferred)

Making these graded problem types would add: a `simulatorType` field on Problems,
capture drivers in `lib/samplingUtils.js`, a grading branch in
`app/api/grade/route.js`, and golden waveforms — none of which this phase touches.
