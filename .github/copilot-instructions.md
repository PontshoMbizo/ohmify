# Copilot Instructions — scope.io

Pontsho Mbizo (UCT EEE student, solo dev). Prefer concise responses.

LeetCode-style platform for electronics engineers. Users build circuits in CircuitJS and get graded.
Stack: Next.js App Router + React 19, Tailwind + daisyUI, Firebase (Firestore + Auth), CircuitJS iframe.

## Key constraints
- All grading is server-side in app/api/grade/route.js — the client never decides pass/fail.
- Never write UserProgress from the client side.
- Tests run with Vitest (npm test). Keep all 63 tests green.

See CLAUDE.md for full architecture.
