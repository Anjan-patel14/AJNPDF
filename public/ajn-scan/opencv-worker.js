/* AJN PDF Scan to PDF - same-origin OpenCV worker.
 * OpenCV is built locally by scripts/build-ajn-scan-opencv.ps1 with a core+imgproc whitelist.
 */
"use strict";

let cvPromise = null;

const OPENCV_BASE = "/ajn-scan/opencv-4.10.0/";
const OPENCV_JS_URL = `${OPENCV_BASE}opencv.js`;
const OPENCV_WASM_URL = `${OPENCV_BASE}opencv_js.wasm`;

async function loadVerifiedWasm() {
  const response = await fetch(OPENCV_WASM_URL, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`OpenCV WASM request failed (${response.status}) at ${OPENCV_WASM_URL}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const validMagic =
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x61 &&
    bytes[2] === 0x73 &&
    bytes[3] === 0x6d;

  if (!validMagic) {
    const prefix = Array.from(bytes.slice(0, 8))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join(" ");
    throw new Error(
      `OpenCV WASM at ${OPENCV_WASM_URL} is not a WebAssembly binary. First bytes: ${prefix}`,
    );
  }

  return bytes;
}

async function getCv() {
  if (cvPromise) return cvPromise;

  cvPromise = (async () => {
    if (!self.cv || !self.cv.Mat) {
      // Do not let Emscripten discover/fetch the WASM path implicitly.
      // Fetch the exact versioned asset ourselves, validate its WASM magic,
      // and provide it as Module.wasmBinary before opencv.js executes.
      const wasmBinary = await loadVerifiedWasm();

      const moduleConfig = {
        wasmBinary,
        locateFile(path) {
          if (typeof path === "string" && path.endsWith(".wasm")) {
            return OPENCV_WASM_URL;
          }
          return `${OPENCV_BASE}${path}`;
        },
      };

      // Different OpenCV/Emscripten builds bootstrap from either the global
      // `cv` object or a global `Module` object. Seed both with the same
      // verified binary so neither code path can fall back to an HTML URL.
      self.cv = moduleConfig;
      self.Module = moduleConfig;

      importScripts(OPENCV_JS_URL);
    }

    const candidate = self.cv;
    const cv = candidate && typeof candidate.then === "function" ? await candidate : candidate;

    if (!cv || !cv.Mat || !cv.Canny || !cv.warpPerspective) {
      throw new Error("The same-origin OpenCV scanner runtime is missing or incomplete.");
    }

    return cv;
  })();

  return cvPromise;
}

function orderCorners(points) {
  const pts = points.map((p) => ({ x: Number(p.x), y: Number(p.y) }));
  const sum = pts.map((p) => p.x + p.y);
  const diff = pts.map((p) => p.y - p.x);
  return [
    pts[sum.indexOf(Math.min(...sum))],
    pts[diff.indexOf(Math.min(...diff))],
    pts[sum.indexOf(Math.max(...sum))],
    pts[diff.indexOf(Math.max(...diff))],
  ];
}

function defaultCorners() {
  return [{ x: 0.04, y: 0.04 }, { x: 0.96, y: 0.04 }, { x: 0.96, y: 0.96 }, { x: 0.04, y: 0.96 }];
}

function matFromBuffer(cv, width, height, buffer) {
  const bytes = new Uint8ClampedArray(buffer);
  const imageData = new ImageData(bytes, width, height);
  return cv.matFromImageData(imageData);
}

function safeDelete(...values) {
  for (const value of values) {
    try { value && typeof value.delete === "function" && value.delete(); } catch {}
  }
}

function detectDocument(cv, width, height, buffer) {
  const src = matFromBuffer(cv, width, height, buffer);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let resized = src;
  let ownedResize = null;
  try {
    const maxSide = 1000;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    if (scale < 1) {
      ownedResize = new cv.Mat();
      cv.resize(src, ownedResize, new cv.Size(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))), 0, 0, cv.INTER_AREA);
      resized = ownedResize;
    }
    cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    const median = cv.mean ? cv.mean(blur)[0] : 128;
    const low = Math.max(30, Math.round(median * 0.55));
    const high = Math.min(220, Math.max(low + 40, Math.round(median * 1.35)));
    cv.Canny(blur, edges, low, high, 3, false);
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const frameArea = resized.cols * resized.rows;
    let best = null;
    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i);
      const perimeter = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      try {
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
        if (approx.rows !== 4 || !cv.isContourConvex(approx)) continue;
        const area = Math.abs(cv.contourArea(approx));
        const ratio = area / Math.max(1, frameArea);
        if (ratio < 0.12) continue;
        const points = [];
        for (let row = 0; row < 4; row += 1) {
          points.push({
            x: approx.intPtr(row, 0)[0] / resized.cols,
            y: approx.intPtr(row, 0)[1] / resized.rows,
          });
        }
        const ordered = orderCorners(points);
        const edgePenalty = ordered.reduce((sum, p) => sum + Math.min(p.x, p.y, 1 - p.x, 1 - p.y), 0) / 4;
        const score = ratio * 0.88 + Math.min(0.12, edgePenalty * 0.6);
        if (!best || score > best.score) best = { corners: ordered, ratio, score };
      } finally {
        approx.delete();
        contour.delete();
      }
    }
    if (!best) return { corners: defaultCorners(), confidence: 0.18 };
    return { corners: best.corners, confidence: Math.max(0.2, Math.min(0.99, best.ratio * 1.2)) };
  } finally {
    safeDelete(src, ownedResize, gray, blur, edges, contours, hierarchy);
  }
}

function pointDistance(a, b, width, height) {
  return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
}

function enhance(cv, mat, mode, brightness, contrast, sharpness) {
  let out = mat;
  let owned = [];
  const alpha = Math.max(0.5, Math.min(1.8, Number(contrast) || 1));
  const beta = Math.max(-80, Math.min(80, Number(brightness) || 0));

  if (mode === "grayscale" || mode === "document") {
    const gray = new cv.Mat();
    cv.cvtColor(out, gray, cv.COLOR_RGBA2GRAY);
    owned.push(gray);
    if (mode === "document") {
      const bw = new cv.Mat();
      cv.adaptiveThreshold(gray, bw, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 31, 13);
      owned.push(bw);
      const rgba = new cv.Mat();
      cv.cvtColor(bw, rgba, cv.COLOR_GRAY2RGBA);
      owned.push(rgba);
      out = rgba;
    } else {
      const rgba = new cv.Mat();
      cv.cvtColor(gray, rgba, cv.COLOR_GRAY2RGBA);
      owned.push(rgba);
      out = rgba;
    }
  }

  if (mode === "color" || mode === "grayscale" || mode === "original") {
    const adjusted = new cv.Mat();
    out.convertTo(adjusted, -1, mode === "original" ? 1 : alpha, mode === "original" ? 0 : beta);
    owned.push(adjusted);
    out = adjusted;
  }

  const amount = Math.max(0, Math.min(1, Number(sharpness) || 0));
  if (amount > 0.01 && mode !== "document") {
    const blurred = new cv.Mat();
    const sharpened = new cv.Mat();
    cv.GaussianBlur(out, blurred, new cv.Size(0, 0), 1.15);
    cv.addWeighted(out, 1 + amount, blurred, -amount, 0, sharpened);
    owned.push(blurred, sharpened);
    out = sharpened;
  }
  return { out, owned };
}

function processDocument(cv, width, height, buffer, corners, mode, brightness, contrast, sharpness, rotation) {
  const src = matFromBuffer(cv, width, height, buffer);
  const ordered = orderCorners(Array.isArray(corners) && corners.length === 4 ? corners : defaultCorners());
  const top = pointDistance(ordered[0], ordered[1], width, height);
  const bottom = pointDistance(ordered[3], ordered[2], width, height);
  const left = pointDistance(ordered[0], ordered[3], width, height);
  const right = pointDistance(ordered[1], ordered[2], width, height);
  let outWidth = Math.max(64, Math.round(Math.max(top, bottom)));
  let outHeight = Math.max(64, Math.round(Math.max(left, right)));
  const maxSide = 3000;
  const scale = Math.min(1, maxSide / Math.max(outWidth, outHeight));
  outWidth = Math.max(64, Math.round(outWidth * scale));
  outHeight = Math.max(64, Math.round(outHeight * scale));

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ordered[0].x * width, ordered[0].y * height,
    ordered[1].x * width, ordered[1].y * height,
    ordered[2].x * width, ordered[2].y * height,
    ordered[3].x * width, ordered[3].y * height,
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, outWidth - 1, 0, outWidth - 1, outHeight - 1, 0, outHeight - 1,
  ]);
  const transform = cv.getPerspectiveTransform(srcPts, dstPts);
  const warped = new cv.Mat();
  let rotated = null;
  try {
    cv.warpPerspective(src, warped, transform, new cv.Size(outWidth, outHeight), cv.INTER_LINEAR, cv.BORDER_REPLICATE, new cv.Scalar());
    let base = warped;
    const r = ((Number(rotation) % 360) + 360) % 360;
    if (r) {
      rotated = new cv.Mat();
      if (r === 90) cv.rotate(warped, rotated, cv.ROTATE_90_CLOCKWISE);
      else if (r === 180) cv.rotate(warped, rotated, cv.ROTATE_180);
      else if (r === 270) cv.rotate(warped, rotated, cv.ROTATE_90_COUNTERCLOCKWISE);
      base = rotated;
    }
    const enhanced = enhance(cv, base, mode || "color", brightness, contrast, sharpness);
    try {
      const output = enhanced.out;
      const copy = new Uint8ClampedArray(output.data);
      return { width: output.cols, height: output.rows, buffer: copy.buffer };
    } finally {
      safeDelete(...enhanced.owned);
    }
  } finally {
    safeDelete(src, srcPts, dstPts, transform, warped, rotated);
  }
}

function preprocessOcr(cv, width, height, buffer) {
  const src = matFromBuffer(cv, width, height, buffer);
  const gray = new cv.Mat();
  const normalized = new cv.Mat();
  const rgba = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(gray, normalized);
    // OCR receives a high-contrast grayscale image. Avoid hard binarization here because
    // faint strokes can disappear; Tesseract can threshold internally.
    cv.cvtColor(normalized, rgba, cv.COLOR_GRAY2RGBA);
    const copy = new Uint8ClampedArray(rgba.data);
    return { width: rgba.cols, height: rgba.rows, buffer: copy.buffer };
  } finally {
    safeDelete(src, gray, normalized, rgba);
  }
}

self.onmessage = async (event) => {
  const message = event.data || {};
  const id = Number(message.id || 0);
  try {
    const cv = await getCv();
    if (message.type === "ping") {
      self.postMessage({ id, ok: true, type: "pong" });
      return;
    }
    if (message.type === "detect") {
      const result = detectDocument(cv, Number(message.width), Number(message.height), message.buffer);
      self.postMessage({ id, ok: true, ...result });
      return;
    }
    if (message.type === "process") {
      const result = processDocument(
        cv, Number(message.width), Number(message.height), message.buffer,
        message.corners, message.mode, message.brightness, message.contrast, message.sharpness, message.rotation,
      );
      self.postMessage({ id, ok: true, width: result.width, height: result.height, buffer: result.buffer }, [result.buffer]);
      return;
    }
    if (message.type === "ocr-preprocess") {
      const result = preprocessOcr(cv, Number(message.width), Number(message.height), message.buffer);
      self.postMessage({ id, ok: true, width: result.width, height: result.height, buffer: result.buffer }, [result.buffer]);
      return;
    }
    throw new Error(`Unknown scanner worker operation: ${message.type}`);
  } catch (error) {
    self.postMessage({ id, ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
