import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';

/**
 * AJN Professional PDF Compression Worker - Hardened v8.5
 * Performs object-level optimization in a background thread.
 * Uses enumerateIndirectObjects for stable reference assignment.
 */

const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, settings } = e.data;

  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    if (settings.removeMetadata) {
      try {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("AJN Studio");
        pdfDoc.setCreator("AJN Studio");
      } catch {
        console.warn("[Worker] Metadata wipe skipped.");
      }
    }

    const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
    const total = indirectObjects.length;

    for (let i = 0; i < total; i++) {
      if (i % 20 === 0) {
        ctx.postMessage({ type: 'progress', value: Math.round((i / total) * 85), stage: `Analyzing PDF object ${i + 1}...` });
      }

      const [ref, obj] = indirectObjects[i];
      if (!(obj instanceof PDFRawStream)) continue;

      const dict = obj.dict;
      const subtype = dict.get(PDFName.of("Subtype"));
      if (subtype !== PDFName.of("Image")) continue;

      if (settings.recompressImages) {
        const raw = obj.getContents();
        if (!raw || raw.length < 15000) continue;

        try {
          const blob = new Blob([raw.buffer as ArrayBuffer]);
          const bitmap = await createImageBitmap(blob);
          let width = bitmap.width;
          let height = bitmap.height;
          const maxW = settings.maxImageWidth || 1200;
          const maxH = settings.maxImageHeight || 1600;

          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = new OffscreenCanvas(width, height);
          const canvasCtx = canvas.getContext('2d')!;
          if (settings.grayscaleImages) canvasCtx.filter = 'grayscale(100%)';
          canvasCtx.drawImage(bitmap, 0, 0, width, height);

          const compressedBlob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: settings.imageQuality || 0.75
          });

          const newBytes = new Uint8Array(await compressedBlob.arrayBuffer());
          
          if (newBytes.length < raw.length) {
            // Replace the stream at the given reference directly using the ref from enumeration
            const newStream = PDFRawStream.of(dict, newBytes);
            pdfDoc.context.assign(ref, newStream);
            
            dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
            dict.set(PDFName.of("Length"), pdfDoc.context.obj(newBytes.length));
          }
          bitmap.close();
        } catch {
          console.warn("[Worker] Image recompression failed for object:", ref.toString());
        }
      }
    }

    if (settings.removeFormFields) {
      try { pdfDoc.getForm().flatten(); } catch { console.warn("[Worker] Form flattening skipped."); }
    }

    ctx.postMessage({ type: 'progress', value: 95, stage: "Finalizing PDF..." });
    const output = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
    
    // Use Transferable for memory efficiency
    ctx.postMessage({ type: 'done', data: output }, [output.buffer as ArrayBuffer]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF processing stopped unexpectedly.";
    ctx.postMessage({ type: 'error', error: message });
  }
};