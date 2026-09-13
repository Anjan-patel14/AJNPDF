import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = String(process.env.AJN_ICON_TEST_PORT || "9031");
const base = `http://127.0.0.1:${port}`;
const expected = [
  'scan-to-pdf','edit-pdf','add-image-to-pdf','add-text','compare-pdf','compress-pdf',
  'crop-pdf','delete-pdf-pages','extract-images','image-to-pdf','jpg-to-pdf','jpeg-to-pdf',
  'png-to-pdf','webp-to-pdf','flatten-pdf','merge-pdf','organize-pdf','page-number',
  'pdf-metadata','pdf-zip-extract','protect-pdf','repair-pdf','rotate-pdf','sign-pdf',
  'split-pdf','unlock-pdf','watermark-pdf',
];

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", port],
  {
    cwd: root,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF: "true",
      AJN_NEXT_DIST_DIR: ".next-icon-test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let browser;
const output = [];
const push = (chunk) => { const s = chunk.toString(); output.push(s); process.stdout.write(s); };
server.stdout.on("data", push);
server.stderr.on("data", push);

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Icon test server did not start.\n${output.join("").slice(-4000)}`)), 90000);
    const ready = (chunk) => {
      if (/Ready in|Local:/.test(chunk.toString())) {
        clearTimeout(timer);
        server.stdout.off("data", ready);
        resolve();
      }
    };
    server.stdout.on("data", ready);
    server.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Icon test server exited ${code}.\n${output.join("").slice(-4000)}`));
    });
  });

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  const response = await page.goto(`${base}/pdf-tools`, { waitUntil: "domcontentloaded", timeout: 120000 });
  assert.equal(response?.status(), 200);

  const headerScan = page.locator('[data-ajn-header-scan="true"]');
  await headerScan.waitFor();
  assert.equal(await headerScan.getAttribute("href"), "/scan-to-pdf");
  console.log("PASS: desktop header highlights Scan PDF");

  const scannerCard = page.locator('article[data-ajn-featured-scanner="true"]');
  await scannerCard.waitFor();
  await scannerCard.getByText(/Document Scanner/i).waitFor();
  console.log("PASS: Scan to PDF card is featured in PDF Tools");

  const iconData = await page.locator("[data-tool-icon]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-tool-icon"),
      source: node.getAttribute("data-tool-icon-source"),
    })),
  );
  const byId = new Map(iconData.map((item) => [item.id, item.source]));
  for (const id of expected) {
    assert.ok(byId.has(id), `Missing rendered public icon: ${id}`);
    assert.notEqual(byId.get(id), "fallback-vector", `${id} must not use fallback artwork`);
    assert.notEqual(byId.get(id), "generated-conversion", `${id} must have an explicit public icon`);
  }
  assert.equal(byId.get("scan-to-pdf"), "scanner-vector");
  assert.equal(byId.get("png-to-pdf"), "image-pdf-vector");
  assert.equal(byId.get("sign-pdf"), "pdf-action-vector");
  console.log("PASS: all 27 public tools render explicit semantic icons");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/pdf-tools`, { waitUntil: "domcontentloaded" });
  const mobileScan = page.locator('[data-ajn-mobile-scan="true"]');
  await mobileScan.waitFor();
  assert.equal(await mobileScan.getAttribute("href"), "/scan-to-pdf");
  console.log("PASS: mobile bottom navigation exposes Scan");

  await page.goto(`${base}/scan-to-pdf`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Use camera" }).waitFor();
  await page.getByRole("button", { name: "Upload document photos" }).waitFor();
  console.log("PASS: highlighted Scan links lead to working scanner route");

  assert.deepEqual(pageErrors, []);
  console.log("AJN PDF PUBLIC ICON BROWSER ACCEPTANCE: PASS");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (!server.killed) server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  try {
    fs.rmSync(path.join(root, ".next-icon-test"), { recursive: true, force: true });
  } catch {
    // Windows can briefly retain file handles after Next exits. The build cache is disposable.
  }
}
