import { canvasToBlob, getExt, loadImage } from './_imageUtils';

const MAX_CANVAS_PIXELS = 50_000_000;
const MAX_CANVAS_DIMENSION = 16_384;

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function bounded(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (w > MAX_CANVAS_DIMENSION || h > MAX_CANVAS_DIMENSION || w * h > MAX_CANVAS_PIXELS) {
    throw new Error('This edited image is too large for safe browser processing.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function applyColorSettings(data: ImageData, settings: any): void {
  const pixels = data.data;
  const brightness = bounded(settings?.brightness, 0.1, 2.5, 1);
  const contrast = bounded(settings?.contrast, 0.5, 2, 1);
  const saturation = bounded(settings?.saturation, 0, 2, 1);
  const exposure = bounded(settings?.exposure, -100, 100, 0) * 1.15;
  const filter = String(settings?.filter || 'none');

  for (let index = 0; index < pixels.length; index += 4) {
    let r = pixels[index] * brightness + exposure;
    let g = pixels[index + 1] * brightness + exposure;
    let b = pixels[index + 2] * brightness + exposure;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luminance + (r - luminance) * saturation;
    g = luminance + (g - luminance) * saturation;
    b = luminance + (b - luminance) * saturation;

    if (filter === 'grayscale') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    } else if (filter === 'sepia') {
      const nr = r * 0.393 + g * 0.769 + b * 0.189;
      const ng = r * 0.349 + g * 0.686 + b * 0.168;
      const nb = r * 0.272 + g * 0.534 + b * 0.131;
      r = nr; g = ng; b = nb;
    } else if (filter === 'invert') {
      r = 255 - r; g = 255 - g; b = 255 - b;
    } else if (filter === 'warm') {
      r *= 1.08; g *= 1.02; b *= 0.88;
    } else if (filter === 'cool') {
      r *= 0.90; g *= 0.99; b *= 1.10;
    }

    pixels[index] = clamp(r);
    pixels[index + 1] = clamp(g);
    pixels[index + 2] = clamp(b);
  }
}

export async function editPhotoQuality(file: File, settings: any): Promise<Blob> {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const colorCanvas = makeCanvas(sourceWidth, sourceHeight);
  const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });
  if (!colorContext) throw new Error('Image rendering is unavailable in this browser.');
  colorContext.drawImage(image, 0, 0);
  const colorData = colorContext.getImageData(0, 0, sourceWidth, sourceHeight);
  applyColorSettings(colorData, settings);
  colorContext.putImageData(colorData, 0, 0);

  const normalizedRotation = ((Math.round(bounded(settings?.rotation, -3600, 3600, 0) / 90) * 90) % 360 + 360) % 360;
  const swap = normalizedRotation === 90 || normalizedRotation === 270;
  const outputWidth = swap ? sourceHeight : sourceWidth;
  const outputHeight = swap ? sourceWidth : sourceHeight;
  const outputCanvas = makeCanvas(outputWidth, outputHeight);
  const context = outputCanvas.getContext('2d');
  if (!context) throw new Error('Image rendering is unavailable in this browser.');

  const format = getExt(file);
  if (format === 'jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputWidth, outputHeight);
  }

  context.translate(outputWidth / 2, outputHeight / 2);
  context.rotate(normalizedRotation * Math.PI / 180);
  context.scale(settings?.flipH ? -1 : 1, settings?.flipV ? -1 : 1);
  context.drawImage(colorCanvas, -sourceWidth / 2, -sourceHeight / 2);

  return canvasToBlob(outputCanvas, format, 93);
}
