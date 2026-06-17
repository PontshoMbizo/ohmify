# Deployment — Vercel (Hobby, free) + Firebase (Spark, free)

The cheapest viable production setup. Both tiers are free; the constraints
they impose are documented at the bottom so future-you knows why things are
built the way they are.

## One-time setup

### 1. Firebase

```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>

# Deploy security rules + the composite index (REQUIRED — see below)
firebase deploy --only firestore:rules,firestore:indexes
```

Both deploys are **mandatory**, not optional:

- The rules in `firestore.rules` close real holes (role self-escalation via the
  Users doc, client-side writes to UserProgress, any creator editing anyone's
  problem). Whatever rules are currently live in the console are stale.
- The composite index in `firestore.indexes.json` backs the
  `UserProgress where userId == X and status == "completed"` query on the
  problem list page. Without it that query throws and completed checkmarks
  silently disappear.

Then in the Firebase console:

- **Authentication → Sign-in method**: enable Google.
- **Authentication → Settings → Authorized domains**: add your
  `*.vercel.app` domain (and any custom domain).
- **Project settings → Service accounts**: generate a private key — you'll
  paste the JSON into Vercel as `FIREBASE_SERVICE_ACCOUNT_JSON`.

### 2. Vercel

1. Import the GitHub repo at vercel.com (framework auto-detected: Next.js).
2. Project → Settings → Environment Variables: add every variable from
   `.env.example`. Notes:
   - `NEXT_PUBLIC_*` values are build-time — changing them requires a redeploy.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` is the full service-account JSON **on one
     line**. It is server-only; Vercel never exposes it to the browser.
3. Deploy.

### 3. Smoke test (do this after every first deploy)

1. Sign in with Google — profile appears in the navbar.
2. Open a problem, build the solution, Submit → all required tests pass →
   "Challenge Marked as Complete" appears.
3. Reload the problem list → the problem shows a completed checkmark.
   If it doesn't, check Vercel function logs for the grade route: a missing
   `FIREBASE_SERVICE_ACCOUNT_JSON` logs
   `[grade] Admin SDK not configured...` and progress will NOT persist.
4. As a `role: "creator"` user, publish a test problem end-to-end (this also
   exercises the `getAfter()` batch rule — if publish fails with
   permission-denied, the deployed rules are stale).

### Granting roles

Roles are intentionally NOT client-writable. To make a user a creator/admin,
either edit `Users/{uid}.role` in the Firebase console, or set a custom claim
(preferred — no Firestore read in the rules hot path):

```bash
# Node one-liner with the service account loaded
admin.auth().setCustomUserClaims(uid, { role: "creator" })
```

## Free-tier constraints (and how the code handles them)

| Constraint | Impact | Mitigation in code |
|---|---|---|
| Vercel serverless: no shared memory between instances | In-memory rate limiter is per-instance, best-effort | Limiter keyed by uid/IP still stops rapid-fire abuse on warm instances; swap internals for Upstash Redis (free) if real abuse appears |
| Vercel Hobby: 10s function timeout (default) | Grading must stay fast | Grading is pure math over capped arrays (200k samples max); well under 1s |
| Firestore Spark: 50k reads/day | Problem views cost ~5 reads (meta + circuit + 3 solutions); grading costs ~4 | Grade route caches problem+solutions per instance (5 min TTL); problem list is paginated at 30 |
| Firestore Spark: 20k writes/day | Each passing test = 1 progress write | Only passing verdicts write; failures are free |
| Firestore: 1 MiB doc limit | Solution waveforms are ~30k lines ≈ 300–600 KB | Fine at the default 30720 samples; do NOT raise sampleCount much beyond that without chunking solution docs |
| Spark has no paid egress buffer | Solution data flows on every problem view and grade response | Acceptable at small scale; first lever to pull is downsampling what the Solutions tab loads |

## Things that intentionally do NOT survive a cold start

- Rate-limit windows (best-effort by design).
- The problem/solution cache (just a cost optimization; correctness never
  depends on it).

## Scaling triggers — revisit when…

- **>5k problem views/day**: move Solutions-tab data to a downsampled summary
  doc; consider caching problem metadata in the page with `revalidate`.
- **Real abuse observed**: move `checkRateLimit` internals to Upstash Redis.
- **Rankings or competition features**: client-simulated waveforms are no
  longer a trustworthy basis for scores — implement submission storage +
  server-side re-simulation (see docs/REVIEW-2026-06-11.md, prod roadmap §1).
- **Multiple regions / instances**: rate limiting and caching both need a
  shared store; same Upstash move covers both.
