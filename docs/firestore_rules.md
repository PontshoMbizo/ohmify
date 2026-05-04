# Firestore Security Rules — Ohmify

This file documents the intended Firestore security model. No `firestore.rules` file is currently present in the repo — copy the ruleset below to add one.

## Access model summary

| Collection | Read | Write |
|---|---|---|
| `Problems/{id}` | Public | Creator (owner) or Admin |
| `Problems/{id}/initialCircuit` | Public | Problem owner or Admin |
| `Problems/{id}/solutionWaveform` | Public | Problem owner or Admin |
| `Users/{uid}` | Owner (own doc) or Admin | Owner (own doc) |
| `UserProgress/{progressId}` | Owner or Admin | Owner (create/update own) |
| `Submissions/{submissionId}` | Owner or Admin | Owner (create own) |

Roles are stored in `Users/{uid}.role` (`"user"` / `"creator"` / `"admin"`). Rules prefer Auth custom claims (`request.auth.token.role`) and fall back to `get()` on the `Users` doc.

---

## Full ruleset

Copy this into `firestore.rules` at the repo root, or paste into the Firebase console.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /Problems/{problemId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() || isCreator();

      match /initialCircuit/{docId} {
        allow read: if true;
        allow write: if isOwnerOfProblem(problemId) || isAdmin() || isCreator();
      }

      match /solutionWaveform/{docId} {
        allow read: if true;
        allow create, update, delete: if isOwnerOfProblem(problemId) || isAdmin();
      }
    }

    match /Users/{uid} {
      allow read, update, create: if request.auth != null && request.auth.uid == uid;
      allow read: if isAdmin();
    }

    match /UserProgress/{progressId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read:   if request.auth != null && resource.data.userId == request.auth.uid || isAdmin();
      allow delete: if isAdmin();
    }

    match /Submissions/{submissionId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read:   if request.auth != null && resource.data.userId == request.auth.uid || isAdmin();
      allow delete: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null && (
        (request.auth.token.role != null && request.auth.token.role == 'admin') ||
        (get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    function isCreator() {
      return request.auth != null && (
        (request.auth.token.role != null && request.auth.token.role == 'creator') ||
        (get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'creator')
      );
    }

    function isOwnerOfProblem(problemId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/Problems/$(problemId)).data.creatorId == request.auth.uid;
    }
  }
}
```

---

## Deploying rules

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools
firebase login

# Deploy rules only (from repo root)
firebase deploy --only firestore:rules
```

Ensure `firebase.json` points to `firestore.rules`:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

---

## Testing rules locally

```bash
# Start Firestore emulator
firebase init emulators   # enable Firestore when prompted
firebase emulators:start --only firestore
```

Use the Emulator UI at `http://localhost:4000` → Rules Playground to simulate requests as different auth UIDs and custom claims.

---

## Recommendations

- **Use custom claims for roles** — set `admin`/`creator` via the Admin SDK when provisioning users. Avoids `get()` calls inside rules, which count as document reads and add latency at scale.
  ```js
  // Cloud Function or Admin SDK script
  await admin.auth().setCustomUserClaims(uid, { role: 'creator' });
  ```
- **Add `Submissions` rules** before shipping the `Submissions` collection (see `ARCHITECTURE.md` for the recommended document shape).
- **Test before deploying to production** — use `firebase emulators:exec` with a small test script to verify that unauthenticated reads on `Problems` pass, and that writes by non-owners are rejected.
