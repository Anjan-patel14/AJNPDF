(() => {
  'use strict';
  const enc = new TextEncoder();
  const ascii = (value) => enc.encode(value);
  const concat = (parts) => {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(size); let offset = 0;
    for (const part of parts) { out.set(part, offset); offset += part.length; }
    return out;
  };
  const fmt = (value) => Number(value.toFixed(2));

  function buildImagePdf(images) {
    if (!Array.isArray(images) || images.length === 0) throw new Error('At least one image is required.');
    const parts = [];
    const offsets = [0];
    let length = 0;
    const push = (bytes) => { parts.push(bytes); length += bytes.length; };
    const addObject = (number, chunks) => {
      offsets[number] = length;
      push(ascii(`${number} 0 obj\n`));
      for (const chunk of chunks) push(chunk);
      push(ascii('\nendobj\n'));
    };

    push(concat([ascii('%PDF-1.4\n%'), new Uint8Array([0xe2,0xe3,0xcf,0xd3]), ascii('\n')]));
    const kids = images.map((_, index) => `${3 + index * 3} 0 R`).join(' ');
    addObject(1, [ascii('<< /Type /Catalog /Pages 2 0 R >>')]);
    addObject(2, [ascii(`<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>`)]);

    images.forEach((image, index) => {
      const pageRef = 3 + index * 3;
      const imageRef = pageRef + 1;
      const contentRef = pageRef + 2;
      const landscape = image.width > image.height;
      const pageW = landscape ? 841.89 : 595.28;
      const pageH = landscape ? 595.28 : 841.89;
      const margin = 36;
      const scale = Math.min((pageW - margin * 2) / image.width, (pageH - margin * 2) / image.height);
      const drawW = fmt(image.width * scale);
      const drawH = fmt(image.height * scale);
      const x = fmt((pageW - drawW) / 2);
      const y = fmt((pageH - drawH) / 2);
      const content = ascii(`q\n${drawW} 0 0 ${drawH} ${x} ${y} cm\n/Im${index + 1} Do\nQ\n`);
      addObject(pageRef, [ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(pageW)} ${fmt(pageH)}] /Resources << /XObject << /Im${index + 1} ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`)]);
      addObject(imageRef, [ascii(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`), image.jpeg, ascii('\nendstream')]);
      addObject(contentRef, [ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii('endstream')]);
    });

    const objectCount = 2 + images.length * 3;
    const xrefStart = length;
    push(ascii(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`));
    for (let i = 1; i <= objectCount; i += 1) push(ascii(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`));
    push(ascii(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`));
    return concat(parts);
  }

  window.AJNPdfBuilder = { buildImagePdf };
})();
