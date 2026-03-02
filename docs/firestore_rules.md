# Firestore Security Rules — Ohmify

This file explains the `firestore.rules` shipped at the repo root and how to deploy/test them with the Firebase Emulator.

## What the rules enforce (summary)

- Public read access to `Problems` and their public subcollections (`initialCircuit`, `solutionWaveform`).
- Write access to `Problems` and golden solutions restricted to `creator` role, the problem owner (`creatorId`), or `admin`.
- `Users` documents are readable/writable by the owning authenticated user; admins may read all user docs.
- `UserProgress` may be created/updated only by the owning user; admins can read/delete.
- `Submissions` (optional) may be created by the submitting user, readable by the owner and admins.
- Role checks prefer Auth custom claims (`request.auth.token.role`) but fall back to reading `Users/{uid}`.

## Deploying rules to Firebase (production)

1. Install and login to Firebase CLI if you haven't already:

```bash
npm install -g firebase-tools
firebase login
```

2. From the project root, deploy rules only:

```bash
firebase deploy --only firestore:rules
```

Note: ensure `firebase.json` in your project points to the correct `firestore.rules` path or run from the repo root where `firestore.rules` is located.

## Testing rules locally with the Firebase Emulator

1. Install the emulator (if not installed) and start it:

```bash
npm install -g firebase-tools
firebase init emulators
# enable Firestore emulator when prompted
firebase emulators:start --only firestore
```

2. Use the emulator UI at `http://localhost:4000` (default) to inspect documents and rule evaluations.

3. Run quick rule checks with the `firebase emulators:exec` command and a small Node script that uses the Admin SDK or client SDK pointing to the emulator. Example test script snippet:

```js
// test-rules.js
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Initialize the client SDK pointing at the emulator
// (... your test setup here ...)
```

A simpler option is to use the Firebase Emulator "Rules Playground" in the Emulator UI to simulate requests as different auth UIDs and custom claims.

## Recommendation

- Prefer setting roles as custom claims (`admin`, `creator`) via the Admin SDK when provisioning users. This avoids `get()` calls inside rules which count against rules evaluation and could be costly at scale.
- Add the `Submissions` collection and write tests that ensure only the submission owner and admins can read submission documents.

If you want, I can:
- (1) add `firestore.rules` to `firebase.json` in this repo and add a small `scripts/test-rules.js` harness that runs a few emulator checks, or
- (2) implement `Submissions` persistence wiring into `SolveProblem` and `AutoMarker` now.

Which next step do you prefer? (1 / 2)
