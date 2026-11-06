// One-off seed script: publishes a real FPGA problem doc (up-down-counter)
// into Firestore via the admin SDK, using the exact same field shapes
// CreateProblem.jsx's finalizeProblem() writes. Run from scope.io's repo root
// so dotenv picks up .env.local's FIREBASE_SERVICE_ACCOUNT_JSON.
import fs from "fs";
import path from "path";

// Minimal .env.local loader (no dotenv dep installed) — handles the
// multi-line quoted FIREBASE_SERVICE_ACCOUNT_JSON value specifically.
{
  const envPath = path.resolve(process.cwd(), ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const re = /^([A-Z0-9_]+)=(['"])([\s\S]*?)\2\s*$/gm;
  let m;
  while ((m = re.exec(raw))) {
    process.env[m[1]] = m[3];
  }
  // also pick up simple unquoted KEY=value lines
  for (const line of raw.split("\n")) {
    const sm = line.match(/^([A-Z0-9_]+)=([^'"\n]+)$/);
    if (sm && !process.env[sm[1]]) process.env[sm[1]] = sm[2].trim();
  }
}

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
}
const db = getFirestore();

const NIKA = process.env.FPGASIM_EXAMPLE_DIR || path.resolve(process.cwd(), "../fpgasim/examples/up-down-counter");
const starterCode = fs.readFileSync(path.join(NIKA, "starter.v"), "utf8");
const solutionCode = fs.readFileSync(path.join(NIKA, "solution.v"), "utf8");
const testbenchCode = fs.readFileSync(path.join(NIKA, "testbench.v"), "utf8");

// Golden changes, already extracted+verified this session via the real
// fpgasim sandbox run + scopeioBridge.extractChanges("leds").
const goldenChanges = [
  { t: 0, v: "00" },
  { t: 205, v: "01" },
  { t: 365, v: "02" },
  { t: 525, v: "01" },
];

const problemData = {
  title: "Debounced Up/Down Counter (FPGA)",
  difficulty: "Medium",
  description:
    "Implement a button-debounced up/down counter on the Tang Nano 9K. " +
    "btn1 (active-low) should increment the 6-bit `leds` count by exactly one per physical press; " +
    "btn2 (active-low) should decrement it by exactly one per press. Contact bounce must never " +
    "produce more than one step per press — synchronise each button through 2 flip-flops, then " +
    "debounce by requiring the level to stay stable before accepting an edge. Keep the module name " +
    "`top` and port list unchanged.",
  topics: ["Digital Systems", "Sequential CCT"],
  creatorId: "seed-script",
  creatorName: "Pontsho",
  createdAt: FieldValue.serverTimestamp(),
  testbench: {
    testbench: testbenchCode,
    signal: "leds",
    duration: 2000000,
  },
  testType: "signal",
  simulatorType: "fpga",
  timeStep: "5e-6",
  sampleCount: 30720,
  starterCode,
};

const problemRef = db.collection("Problems").doc();
const batch = db.batch();
batch.set(problemRef, problemData);
batch.set(problemRef.collection("initialCircuit").doc("data"), { version: 1, payload: "" });
batch.set(problemRef.collection("solutionWaveform").doc("test1"), {
  kind: "fpga-vcd",
  referenceCode: solutionCode,
  changes: goldenChanges,
});

await batch.commit();
console.log("Published FPGA problem:", problemRef.id);
console.log(`URL: http://localhost:3000/problem/${problemRef.id}`);
