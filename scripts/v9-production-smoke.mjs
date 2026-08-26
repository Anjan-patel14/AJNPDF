import { spawn } from "node:child_process";
import path from "node:path";

const port = 9100;
const base = `http://127.0.0.1:${port}`;

const toolIds = [
  "add-image-to-pdf",
  "add-text",
  "compare-pdf",
  "compress-pdf",
  "crop-pdf",
  "delete-pdf-pages",
  "extract-images",
  "flatten-pdf",
  "merge-pdf",
  "organize-pdf",
  "page-number",
  "pdf-metadata",
  "pdf-zip-extract",
  "protect-pdf",
  "repair-pdf",
  "rotate-pdf",
  "sign-pdf",
  "split-pdf",
  "unlock-pdf",
  "watermark-pdf",
];

const routes = [
  "/",
  "/pdf-tools",
  "/pricing",
  "/account",
  ...toolIds.map((id) => `/${id}`),
];

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", String(port)],
  {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
    },
  }
);

let output = "";

child.stdout.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

child.stderr.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
});

child.on("error", (error) => {
  console.error(`Production server process failed to start: ${error.message}`);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(
        `production server exited before readiness with code ${child.exitCode}\n${output.slice(-5000)}`
      );
    }

    try {
      const response = await fetch(base, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {}

    await sleep(1000);
  }

  throw new Error(
    `production server did not become ready within 60 seconds\n${output.slice(-5000)}`
  );
}

async function stopChild() {
  if (child.exitCode !== null) return;

  child.kill("SIGTERM");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (child.exitCode !== null) return;
    await sleep(100);
  }

  child.kill("SIGKILL");
}

try {
  await waitForServer();

  let failed = 0;

  for (const route of routes) {
    try {
      const response = await fetch(`${base}${route}`, {
        redirect: "manual",
      });

      if (response.status >= 500) {
        console.error(`FAIL ${response.status} ${route}`);
        failed += 1;
      } else {
        console.log(`PASS ${response.status} ${route}`);
      }
    } catch (error) {
      console.error(`FAIL ${route}: ${error}`);
      failed += 1;
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    console.log(`AJN PDF V9 ROUTE SMOKE: PASS (${routes.length} routes)`);
  }
} finally {
  await stopChild();
}