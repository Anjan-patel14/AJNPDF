from __future__ import annotations
import io
from pathlib import Path
from typing import Any, Iterable
import fitz
from PIL import Image, ImageOps, ImageSequence
from . import conversion_engine as legacy
from .processing_quality import _prepare_scan_image

def _frames(path: Path) -> Iterable[Image.Image]:
    with Image.open(path) as source:
        for index, frame in enumerate(ImageSequence.Iterator(source), start=1):
            if index > legacy.MAX_IMAGE_FRAMES:
                raise ValueError(f'This image contains too many frames. Maximum:{legacy.MAX_IMAGE_FRAMES}.')
            prepared = ImageOps.exif_transpose(frame.copy())
            if prepared.width * prepared.height > legacy.MAX_IMAGE_PIXELS:
                prepared.close()
                raise ValueError('The image dimensions are too large to process safely.')
            yield prepared

def _page_points(image: Image.Image, options: dict[str, Any]) -> tuple[float, float]:
    requested = str(options.get('page_size', 'auto')).strip().lower()
    dpi = max(72.0, min(600.0, float(options.get('dpi', 150))))
    if requested == 'a4':
        width, height = (595.276, 841.89)
    elif requested in {'letter', 'us-letter'}:
        width, height = (612.0, 792.0)
    else:
        width = image.width * 72.0 / dpi
        height = image.height * 72.0 / dpi
    orientation = str(options.get('orientation', 'auto')).strip().lower()
    if orientation == 'landscape' and height > width:
        width, height = (height, width)
    elif orientation == 'portrait' and width > height:
        width, height = (height, width)
    return (max(36.0, width), max(36.0, height))

def _has_alpha(image: Image.Image) -> bool:
    if image.mode in {'RGBA', 'LA'}:
        alpha = image.getchannel('A')
        extrema = alpha.getextrema()
        return bool(extrema and extrema[0] < 255)
    return image.mode == 'P' and 'transparency' in image.info

def _encoded_image(image: Image.Image, quality: int) -> tuple[bytes, str]:
    buffer = io.BytesIO()
    if _has_alpha(image):
        rgba = image.convert('RGBA')
        try:
            rgba.save(buffer, 'PNG', optimize=True)
        finally:
            rgba.close()
        return (buffer.getvalue(), 'png')
    rgb = image.convert('RGB')
    try:
        rgb.save(buffer, 'JPEG', quality=quality, optimize=True, progressive=True, subsampling=0)
    finally:
        rgb.close()
    return (buffer.getvalue(), 'jpeg')

def images_to_pdf(files: list[Path], output: Path, options: dict[str, Any], *, scan: bool=False) -> None:
    quality = max(55, min(100, int(options.get('quality', 92))))
    margin_mm = max(0.0, min(50.0, float(options.get('margin_mm', 0))))
    total_pixels = 0
    pdf = fitz.open()
    try:
        for path in files:
            for frame in _frames(path):
                image: Image.Image | None = None
                try:
                    total_pixels += frame.width * frame.height
                    if total_pixels > legacy.MAX_BATCH_PIXELS:
                        raise ValueError('The selected images are too large for one PDF job. Use fewer or smaller images.')
                    if scan:
                        image = _prepare_scan_image(frame, options, preserve_color=not bool(options.get('grayscale', True)))
                    else:
                        image = frame.copy()
                    page_width, page_height = _page_points(image, options)
                    margin = margin_mm * 72.0 / 25.4
                    available = fitz.Rect(margin, margin, page_width - margin, page_height - margin)
                    if available.width <= 1 or available.height <= 1:
                        raise ValueError('The selected margin leaves no room for the image.')
                    scale = min(available.width / image.width, available.height / image.height)
                    draw_width = image.width * scale
                    draw_height = image.height * scale
                    left = available.x0 + (available.width - draw_width) / 2
                    top = available.y0 + (available.height - draw_height) / 2
                    rect = fitz.Rect(left, top, left + draw_width, top + draw_height)
                    encoded, kind = _encoded_image(image, quality)
                    if not encoded or kind not in {'png', 'jpeg'}:
                        raise RuntimeError('The image encoder returned an invalid payload.')
                    page = pdf.new_page(width=page_width, height=page_height)
                    page.insert_image(rect, stream=encoded, keep_proportion=True)
                finally:
                    if image is not None:
                        image.close()
                    frame.close()
        if pdf.page_count < 1:
            raise ValueError('No readable images were found.')
        pdf.save(output, garbage=4, deflate=True, clean=True)
    finally:
        pdf.close()
