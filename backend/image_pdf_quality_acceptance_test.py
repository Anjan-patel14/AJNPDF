from __future__ import annotations
import tempfile
from pathlib import Path
import fitz
from PIL import Image, ImageDraw
from app.conversion_engine import validate_output_file
from app.image_pdf_quality import images_to_pdf

def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ajn-image-pdf-quality-') as temporary:
        root = Path(temporary)
        transparent = root / 'transparent.png'
        photo = root / 'photo.jpg'
        output = root / 'images.pdf'
        rgba = Image.new('RGBA', (600, 400), (0, 0, 0, 0))
        draw = ImageDraw.Draw(rgba)
        draw.rectangle((100, 80, 500, 320), fill=(255, 0, 0, 128))
        rgba.save(transparent, 'PNG')
        rgba.close()
        rgb = Image.new('RGB', (640, 360), (35, 110, 205))
        rgb.save(photo, 'JPEG', quality=94)
        rgb.close()
        images_to_pdf([transparent, photo], output, {'page_size': 'auto', 'orientation': 'auto', 'margin_mm': 0, 'dpi': 150, 'quality': 94})
        validate_output_file(output, '.pdf')
        with fitz.open(output) as pdf:
            assert pdf.page_count == 2
            first = pdf[0].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            corner = first.pixel(5, 5)
            assert all((channel >= 235 for channel in corner[:3])), corner
            center = first.pixel(first.width // 2, first.height // 2)
            assert center[0] > center[1] and center[0] > center[2], center
            assert center[1] > 40 and center[2] > 40, center
            assert pdf[0].get_images(full=True), 'transparent page has no embedded image'
            assert pdf[1].get_images(full=True), 'photo page has no embedded image'
        print('PASS: AJN PDF image-to-PDF fidelity — alpha composites on white and photo page remains valid')
if __name__ == '__main__':
    main()
