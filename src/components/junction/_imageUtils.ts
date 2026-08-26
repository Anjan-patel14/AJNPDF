// _imageUtils.ts — privacy-first image processing in the browser via Canvas API.
// Production rule: never silently rename/return a different image format.

const MAX_CANVAS_PIXELS = 50_000_000;
const MAX_CANVAS_DIMENSION = 16_384;
const SUPPORTED_OUTPUTS = new Set(['jpeg', 'jpg', 'png', 'webp']);

type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizedFormat(format: string): 'jpeg' | 'png' | 'webp' {
  const fmt = String(format || '').toLowerCase();
  if (!SUPPORTED_OUTPUTS.has(fmt)) {
    throw new Error(`This browser cannot safely export ${fmt || 'that'} format. Choose JPG, PNG or WEBP.`);
  }
  return fmt === 'jpg' ? 'jpeg' : fmt as 'jpeg' | 'png' | 'webp';
}

function mimeFor(format: string): string {
  const fmt = normalizedFormat(format);
  if (fmt === 'png') return 'image/png';
  if (fmt === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function assertCanvasSize(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error('The requested image dimensions are invalid.');
  }
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION || width * height > MAX_CANVAS_PIXELS) {
    throw new Error('This image is too large for safe browser processing. Use smaller dimensions or the server conversion tool.');
  }
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const w = Math.round(width);
  const h = Math.round(height);
  assertCanvasSize(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function quality01(quality: number): number {
  const q = Number.isFinite(Number(quality)) ? Number(quality) : 92;
  return Math.max(0.05, Math.min(1, q > 1 ? q / 100 : q));
}

function fillForLossy(ctx: CanvasRenderingContext2D, width: number, height: number, format: string): void {
  if (normalizedFormat(format) === 'jpeg') {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  if (!file || file.size <= 0) return Promise.reject(new Error('Choose a non-empty image file.'));
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      cleanup();
      try {
        assertCanvasSize(img.naturalWidth, img.naturalHeight);
        resolve(img);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error('The image could not be decoded. It may be damaged or unsupported by this browser.'));
    };
    img.src = url;
  });
}

export async function canvasToBlob(canvas: CanvasLike, format: string, quality: number): Promise<Blob> {
  const fmt = normalizedFormat(format);
  const mime = mimeFor(fmt);
  const q = quality01(quality);

  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: mime, quality: q });
    if (!blob || blob.size <= 0 || blob.type !== mime) {
      throw new Error(`The browser could not encode a valid ${fmt.toUpperCase()} image.`);
    }
    return blob;
  }

  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      blob => {
        if (!blob || blob.size <= 0) {
          reject(new Error('The browser could not create the output image.'));
          return;
        }
        if (blob.type !== mime) {
          reject(new Error(`The browser does not support ${fmt.toUpperCase()} encoding. No fallback file was returned.`));
          return;
        }
        resolve(blob);
      },
      mime,
      q,
    );
  });
}

export function getExt(file: File, forceFormat?: string): string {
  if (forceFormat) return normalizedFormat(forceFormat);
  const n = (file?.name || '').toLowerCase();
  if (n.endsWith('.png') || n.endsWith('.gif') || n.endsWith('.bmp')) return 'png';
  if (n.endsWith('.webp')) return 'webp';
  return 'jpeg';
}

export async function compressImage(file: File, quality: number, format: string): Promise<Blob> {
  const img = await loadImage(file);
  const outFormat = normalizedFormat(format || getExt(file));
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  fillForLossy(ctx, canvas.width, canvas.height, outFormat);
  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas, outFormat, quality);
}

export async function resizeImage(file: File, targetW: number, targetH: number, maintainAspect: boolean): Promise<Blob> {
  const img = await loadImage(file);
  let w = Number(targetW) || 0;
  let h = Number(targetH) || 0;
  if (w <= 0 && h <= 0) {
    w = img.naturalWidth;
    h = img.naturalHeight;
  }
  if (maintainAspect) {
    const ar = img.naturalWidth / img.naturalHeight;
    if (w > 0 && h > 0) {
      if (w / h > ar) w = h * ar;
      else h = w / ar;
    } else if (w > 0) {
      h = w / ar;
    } else {
      w = h * ar;
    }
  } else {
    if (w <= 0) w = img.naturalWidth;
    if (h <= 0) h = img.naturalHeight;
  }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvasToBlob(canvas, format, 92);
}

export async function cropImage(file: File, x: number, y: number, w: number, h: number): Promise<Blob> {
  const img = await loadImage(file);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const sx = Math.max(0, Math.min(Math.floor(Number(x) || 0), iw - 1));
  const sy = Math.max(0, Math.min(Math.floor(Number(y) || 0), ih - 1));
  const requestedW = Math.floor(Number(w));
  const requestedH = Math.floor(Number(h));
  if (!Number.isFinite(requestedW) || !Number.isFinite(requestedH) || requestedW <= 0 || requestedH <= 0) {
    throw new Error('Crop width and height must be greater than zero.');
  }
  const sw = Math.min(requestedW, iw - sx);
  const sh = Math.min(requestedH, ih - sy);
  const canvas = makeCanvas(sw, sh);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, sw, sh, format);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvasToBlob(canvas, format, 92);
}

export async function rotateImage(file: File, angleDeg: number): Promise<Blob> {
  const img = await loadImage(file);
  const degrees = Number.isFinite(Number(angleDeg)) ? Number(angleDeg) : 90;
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = Math.max(1, Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin));
  const h = Math.max(1, Math.ceil(img.naturalWidth * sin + img.naturalHeight * cos));
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvasToBlob(canvas, format, 92);
}

function watermarkPosition(position: string, width: number, height: number, textWidth: number, fontSize: number, margin: number): [number, number] {
  switch (position) {
    case 'top-left': return [margin, fontSize + margin];
    case 'top-center': return [(width - textWidth) / 2, fontSize + margin];
    case 'top-right': return [width - textWidth - margin, fontSize + margin];
    case 'center': return [(width - textWidth) / 2, (height + fontSize) / 2];
    case 'bottom-left': return [margin, height - margin];
    case 'bottom-right': return [width - textWidth - margin, height - margin];
    default: return [(width - textWidth) / 2, height - margin];
  }
}

export async function watermarkImage(file: File, text: string, opacity: number, fontSize: number, color: string, position: string): Promise<Blob> {
  const img = await loadImage(file);
  const watermark = String(text || '').trim();
  if (!watermark) throw new Error('Enter watermark text before processing.');
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, canvas.width, canvas.height, format);
  ctx.drawImage(img, 0, 0);
  let fs = Math.round(clampNumber(fontSize, 10, Math.max(10, canvas.width / 3), Math.max(24, canvas.width / 12)));
  const margin = Math.max(8, Math.round(Math.min(canvas.width, canvas.height) * 0.025));
  ctx.font = `700 ${fs}px Arial, sans-serif`;
  while (ctx.measureText(watermark).width > canvas.width - margin * 2 && fs > 10) {
    fs -= 2;
    ctx.font = `700 ${fs}px Arial, sans-serif`;
  }
  const tw = ctx.measureText(watermark).width;
  const [x, y] = watermarkPosition(position, canvas.width, canvas.height, tw, fs, margin);
  ctx.save();
  ctx.globalAlpha = clampNumber(opacity, 0.05, 1, 0.6);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.max(2, Math.round(fs / 12));
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = color || '#ffffff';
  ctx.fillText(watermark, Math.max(margin, x), Math.max(fs, y));
  ctx.restore();
  return canvasToBlob(canvas, format, 92);
}

export async function enhanceImage(file: File, scale: number): Promise<Blob> {
  const img = await loadImage(file);
  const safeScale = clampNumber(scale, 1, 4, 2);
  const w = Math.round(img.naturalWidth * safeScale);
  const h = Math.round(img.naturalHeight * safeScale);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c;
            sum += src[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        dst[(y * w + x) * 4 + c] = clamp(sum);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas, format, 92);
}

export async function removeBackground(file: File, threshold: number): Promise<Blob> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([cx, cy]) => {
    const i = (cy * w + cx) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  });
  const bgR = corners.reduce((s, c) => s + c[0], 0) / 4;
  const bgG = corners.reduce((s, c) => s + c[1], 0) / 4;
  const bgB = corners.reduce((s, c) => s + c[2], 0) / 4;
  const cutoff = clampNumber(threshold, 1, 442, 45);
  for (let i = 0; i < px.length; i += 4) {
    const dr = px[i] - bgR;
    const dg = px[i + 1] - bgG;
    const db = px[i + 2] - bgB;
    if (Math.sqrt(dr * dr + dg * dg + db * db) < cutoff) px[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  return canvasToBlob(canvas, 'png', 100);
}

export async function blurRegion(file: File, x: number, y: number, w: number, h: number, radius: number): Promise<Blob> {
  const img = await loadImage(file);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const canvas = makeCanvas(iw, ih);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, iw, ih, format);
  ctx.drawImage(img, 0, 0);
  const sx = Math.max(0, Math.min(iw - 1, Math.floor(Number(x) || 0)));
  const sy = Math.max(0, Math.min(ih - 1, Math.floor(Number(y) || 0)));
  const sw = Math.max(0, Math.min(Math.floor(Number(w) || 0), iw - sx));
  const sh = Math.max(0, Math.min(Math.floor(Number(h) || 0), ih - sy));
  if (sw < 1 || sh < 1) throw new Error('Choose a valid region to blur.');
  const block = Math.round(clampNumber(radius, 4, 80, 12));
  const region = ctx.getImageData(sx, sy, sw, sh);
  const rd = region.data;
  for (let by = 0; by < sh; by += block) {
    for (let bx = 0; bx < sw; bx += block) {
      const idx = (by * sw + bx) * 4;
      const r = rd[idx], g = rd[idx + 1], b = rd[idx + 2], a = rd[idx + 3];
      for (let dy = 0; dy < block && by + dy < sh; dy++) {
        for (let dx = 0; dx < block && bx + dx < sw; dx++) {
          const ii = ((by + dy) * sw + (bx + dx)) * 4;
          rd[ii] = r; rd[ii + 1] = g; rd[ii + 2] = b; rd[ii + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(region, sx, sy);
  return canvasToBlob(canvas, format, 92);
}

export async function editPhoto(file: File, settings: any): Promise<Blob> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const brightness = clampNumber(settings?.brightness, 0, 3, 1);
  const contrast = clampNumber(settings?.contrast, 0, 3, 1);
  const filter = String(settings?.filter || 'none');
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] * brightness;
    let g = px[i + 1] * brightness;
    let b = px[i + 2] * brightness;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    if (filter === 'grayscale') {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = g = b = gray;
    } else if (filter === 'sepia') {
      const nr = r * 0.393 + g * 0.769 + b * 0.189;
      const ng = r * 0.349 + g * 0.686 + b * 0.168;
      const nb = r * 0.272 + g * 0.534 + b * 0.131;
      r = nr; g = ng; b = nb;
    } else if (filter === 'invert') {
      r = 255 - r; g = 255 - g; b = 255 - b;
    }
    px[i] = clamp(r); px[i + 1] = clamp(g); px[i + 2] = clamp(b);
  }
  ctx.putImageData(data, 0, 0);
  return canvasToBlob(canvas, format, 93);
}

function fitMemeFont(ctx: CanvasRenderingContext2D, text: string, width: number, requested: number): number {
  let size = Math.round(clampNumber(requested, 18, Math.max(18, width / 4), Math.max(24, width / 10)));
  while (size > 18) {
    ctx.font = `900 ${size}px Impact, "Arial Narrow", Arial, sans-serif`;
    if (ctx.measureText(text).width <= width * 0.92) break;
    size -= 2;
  }
  return size;
}

export async function makeMeme(file: File, top: string, bottom: string, fontSize: number): Promise<Blob> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.drawImage(img, 0, 0);
  const draw = (raw: string, topText: boolean) => {
    const text = String(raw || '').trim().toUpperCase();
    if (!text) return;
    const size = fitMemeFont(ctx, text, w, fontSize);
    ctx.font = `900 ${size}px Impact, "Arial Narrow", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = topText ? 'top' : 'bottom';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, Math.round(size / 10));
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    const y = topText ? Math.max(8, size * 0.12) : h - Math.max(8, size * 0.12);
    ctx.strokeText(text, w / 2, y, w * 0.94);
    ctx.fillText(text, w / 2, y, w * 0.94);
  };
  draw(top, true);
  draw(bottom, false);
  return canvasToBlob(canvas, format, 93);
}

export async function flipImage(file: File, horizontal: boolean, vertical: boolean): Promise<Blob> {
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  const format = getExt(file);
  fillForLossy(ctx, w, h, format);
  ctx.translate(horizontal ? w : 0, vertical ? h : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas, format, 92);
}

export async function convertImageFormat(file: File, toFormat: string, quality: number): Promise<Blob> {
  const img = await loadImage(file);
  const format = normalizedFormat(toFormat);
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
  fillForLossy(ctx, canvas.width, canvas.height, format);
  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas, format, quality);
}
