import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";

const PORT = 9012;
const EXTERNAL_BASE = (process.env.AJN_SCAN_BASE_URL || "").replace(/\/$/, "");
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const IS_EXTERNAL = Boolean(EXTERNAL_BASE);
let server = null;
let browser = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitReady() {
  for (let i = 0; i < 45; i += 1) {
    try {
      const response = await fetch(`${BASE}/scan-to-pdf`);
      if (response.ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error("Scanner production server did not become ready.");
}

async function checkScannerRuntime(page) {
  const runtime = await page.evaluate(async () => {
    const urls = [
      "/ajn-scan/opencv-worker.js",
      "/ajn-scan/opencv-4.10.0/opencv.js",
      "/ajn-scan/opencv-4.10.0/opencv_js.wasm",
    ];
    const results = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        const contentType = response.headers.get("content-type") || "";
        let prefix = "";
        if (url.endsWith(".wasm") && response.ok) {
          const bytes = new Uint8Array(await response.arrayBuffer());
          prefix = Array.from(bytes.slice(0, 8))
            .map((value) => value.toString(16).padStart(2, "0"))
            .join(" ");
        }
        results.push({ url, ok: response.ok, status: response.status, contentType, prefix });
      } catch (error) {
        results.push({ url, ok: false, status: 0, error: String(error) });
      }
    }

    return results;
  });

  const bad = runtime.filter((item) => !item.ok);
  if (bad.length) {
    throw new Error(`Scanner runtime asset failure: ${JSON.stringify(bad)}`);
  }

  const wasm = runtime.find((item) => item.url.endsWith(".wasm"));
  if (!wasm || !wasm.prefix.startsWith("00 61 73 6d")) {
    throw new Error(`Browser fetched non-WASM content from the versioned WASM URL: ${JSON.stringify(wasm)}`);
  }

  console.log("PASS: browser fetched real WASM bytes 00 61 73 6d from the versioned URL");
  console.log("PASS: scanner worker + OpenCV JS + standalone WASM are reachable");
}

async function pingOpenCvWorker(page) {
  const result = await page.evaluate(async () => {
    return await new Promise((resolve) => {
      const worker = new Worker("/ajn-scan/opencv-worker.js", { name: "ajn-scan-preflight" });
      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ ok: false, message: "OpenCV worker ping timed out after 45 seconds" });
      }, 45_000);

      worker.onerror = (event) => {
        clearTimeout(timer);
        const message = event.message || "OpenCV worker error";
        worker.terminate();
        resolve({ ok: false, message });
      };

      worker.onmessage = (event) => {
        if (event.data?.id !== 987654) return;
        clearTimeout(timer);
        const data = event.data;
        worker.terminate();
        resolve(data);
      };

      worker.postMessage({ id: 987654, type: "ping" });
    });
  });

  if (!result?.ok) {
    throw new Error(`OpenCV worker preflight failed after verified WASM prefetch: ${result?.message || JSON.stringify(result)}`);
  }
  console.log("PASS: OpenCV worker initialized and answered ping");
}

async function makeSyntheticPng(page) {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable in browser acceptance.");

    ctx.fillStyle = "#374151";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(400, 550);
    ctx.rotate(-0.03);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-310, -440, 620, 880);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 54px Arial";
    ctx.fillText("AJN SCAN TEST", -245, -275);
    ctx.font = "34px Arial";
    ctx.fillText("Document scanner", -245, -190);
    ctx.fillText("Perspective test", -245, -125);
    ctx.restore();

    return canvas.toDataURL("image/png").split(",")[1];
  });

  return Buffer.from(base64, "base64");
}

async function waitForProcessedPage(page, errors, requestFailures) {
  const workspace = page.getByTestId("scan-to-pdf-workspace");
  const pageOne = workspace.getByText("Page 1", { exact: true }).first();

  // Next.js itself renders a route announcer with role="alert" containing
  // the page title. Scope the error locator to the scanner workspace so
  // only the scanner's red error panel can fail this test.
  const alert = workspace.getByRole("alert").first();

  const result = await Promise.race([
    pageOne.waitFor({ state: "visible", timeout: 45_000 }).then(() => "page"),
    alert.waitFor({ state: "visible", timeout: 45_000 }).then(() => "alert"),
  ]).catch(() => "timeout");

  if (result === "alert") {
    const message = await alert.innerText().catch(() => "Unknown scanner UI error");
    throw new Error(
      `Scanner UI reported: ${message}\nBrowser errors: ${errors.join(" | ") || "none"}\nRequest failures: ${requestFailures.join(" | ") || "none"}`,
    );
  }

  if (result !== "page") {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `Scanner did not create Page 1 within 45 seconds.\n` +
      `Browser errors: ${errors.join(" | ") || "none"}\n` +
      `Request failures: ${requestFailures.join(" | ") || "none"}\n` +
      `Visible status excerpt: ${bodyText.slice(0, 1800)}`,
    );
  }
}

async function main() {
  process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF = "true";

  if (!IS_EXTERNAL) {
    server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF: "true", VERCEL_ENV: "production" },
      },
    );
    server.stdout.on("data", (data) => process.stdout.write(data));
    server.stderr.on("data", (data) => process.stderr.write(data));
  }

  await waitReady();

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  const requestFailures = [];

  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/ajn-scan/")) {
      requestFailures.push(`${url}: ${request.failure()?.errorText || "failed"}`);
    }
  });
  const scannerResponses = [];
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/ajn-scan/")) return;
    const contentType = response.headers()["content-type"] || "";
    scannerResponses.push({ url, status: response.status(), contentType });
  });

  await page.goto(`${BASE}/pdf-tools`, { waitUntil: IS_EXTERNAL ? "domcontentloaded" : "networkidle", timeout: 60_000 });
  const scannerCard = page.locator('a[href="/scan-to-pdf"]').filter({ hasText: "Scan to PDF" }).first();
  await scannerCard.waitFor({ timeout: 20_000 });
  console.log("PASS: /pdf-tools shows Scan to PDF card linking to /scan-to-pdf");

  if (IS_EXTERNAL) {
    await page.goto(`${BASE}/scan-to-pdf`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  } else {
    await scannerCard.click();
    await page.waitForURL(/\/scan-to-pdf(?:\?.*)?$/, { timeout: 20_000 });
  }
  await page.getByTestId("scan-to-pdf-workspace").waitFor({ timeout: 30_000 });

  await page.getByRole("button", { name: "Use camera" }).waitFor();
  await page.getByRole("button", { name: "Upload document photos" }).waitFor();
  console.log("PASS: scanner page shows Use camera button");
  console.log("PASS: scanner page shows Upload document photos card/button");

  const cspHeader = await page.evaluate(async () => {
    const response = await fetch(location.href, { cache: "no-store" });
    return response.headers.get("content-security-policy") || "";
  });
  if (/['"]unsafe-eval['"]/.test(cspHeader)) {
    throw new Error("Scanner CSP unexpectedly allows unsafe-eval.");
  }
  console.log("PASS: scanner CSP keeps unsafe-eval disabled");

  await checkScannerRuntime(page);
  await pingOpenCvWorker(page);

  const badScannerResponse = scannerResponses.find(
    (item) => item.url.endsWith(".wasm") && (!item.url.includes("/ajn-scan/opencv-4.10.0/opencv_js.wasm") || /text\/html/i.test(item.contentType)),
  );
  if (badScannerResponse) {
    throw new Error(`OpenCV requested an invalid WASM asset: ${JSON.stringify(badScannerResponse)}`);
  }
  const versionedWasmResponse = scannerResponses.find(
    (item) => item.url.includes("/ajn-scan/opencv-4.10.0/opencv_js.wasm"),
  );
  if (!versionedWasmResponse) {
    throw new Error(`OpenCV did not request the versioned WASM path. Responses: ${JSON.stringify(scannerResponses)}`);
  }
  console.log("PASS: OpenCV worker requested the versioned WASM asset, not an HTML fallback");

  // Use Playwright's native file-input path instead of mutating input.files in page JS.
  const png = await makeSyntheticPng(page);
  const input = page.getByTestId("scan-file-input");
  await input.setInputFiles({
    name: "scanner-test.png",
    mimeType: "image/png",
    buffer: png,
  });

  await waitForProcessedPage(page, errors, requestFailures);
  await page.getByText("Corrected preview").waitFor({ timeout: 30_000 });
  console.log("PASS: scanner ignored Next.js route announcer and created Page 1");
  console.log("PASS: synthetic document became Page 1 with corrected preview");

  const searchCheckbox = page
    .locator("label")
    .filter({ hasText: "Create searchable PDF" })
    .locator('input[type="checkbox"]');

  if (await searchCheckbox.isChecked()) {
    await searchCheckbox.uncheck();
  }

  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("button", { name: "Create PDF" }).click({ force: IS_EXTERNAL });
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  if (!suggested.toLowerCase().endsWith(".pdf")) {
    throw new Error(`Unexpected export filename: ${suggested}`);
  }

  if (errors.some((item) => /uncaught|fatal|scanner worker crashed/i.test(item))) {
    throw new Error(`Fatal browser errors: ${errors.join(" | ")}`);
  }

  console.log("PASS: corrected page exports as a real PDF download");
  console.log("PASS: /scan-to-pdf loads from the primary directory card");
  console.log("PASS: no fatal scanner/OpenCV browser errors");
  console.log(`AJN PDF SCAN TO PDF BROWSER ACCEPTANCE: PASS (${IS_EXTERNAL ? "LIVE" : "LOCAL"})`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close().catch(() => undefined);
    browser = null;
  }

  if (server && !server.killed) {
    server.kill();
    server = null;
  }

  // Avoid a leftover child server/browser keeping PowerShell apparently "stuck".
  await wait(250);
}
