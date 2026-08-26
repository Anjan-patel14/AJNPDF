import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

/**
 * AJN Professional PDF Compression Worker - Hardened v7.6
 * Performs PDF optimization in a background thread.
 * Type-Safe: Uses enumerateIndirectObjects for reliable reference mapping.
 */
const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, level, customSettings } = e.data;

  if (!fileBuffer || fileBuffer.byteLength < 10) {
    ctx.postMessage({ type: "error", error: "The PDF data could not be read." });
    return;
  }

  const CONFIG = {
    extreme: { quality: 0.3, maxWidth: 800, grayscale: true, removeMetadata: true },
    recommended: { quality: 0.6, maxWidth: 1200, grayscale: false, removeMetadata: true },
    less: { quality: 0.85, maxWidth: 2000, grayscale: false, removeMetadata: false },
    custom: { 
      quality: customSettings?.quality ? (100 - customSettings.quality) / 100 : 0.6, 
      maxWidth: customSettings?.maxWidth || 1200, 
      grayscale: customSettings?.grayscale || false, 
      removeMetadata: true 
    }
  };

  const settings = CONFIG[level as keyof typeof CONFIG] || CONFIG.recommended;

  try {
    // 1. Load Document
    const pdfDoc = await PDFDocument.load(fileBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false 
    });

    // 2. Metadata Purge
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

    // 3. Object-Level Optimization
    const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
    const totalObjects = indirectObjects.length;

    for (let i = 0; i < totalObjects; i++) {
      // Progress pulse
      if (i % 30 === 0) {
        ctx.postMessage({ type: "progress", value: Math.round((i / totalObjects) * 90) });
      }

      const [ref, obj] = indirectObjects[i];
      if (!(obj instanceof PDFRawStream)) continue;

      const dict = obj.dict;
      const subtype = dict.get(PDFName.of("Subtype"));
      if (subtype !== PDFName.of("Image")) continue;

      const rawContents = obj.getContents();
      // Skip small structural elements
      if (!rawContents || rawContents.length < 25000) continue; 

      try {
        const blob = new Blob([rawContents.buffer as ArrayBuffer]);
        const bitmap = await createImageBitmap(blob);

        const scale = Math.min(1, settings.maxWidth / bitmap.width);
        const finalW = Math.round(bitmap.width * scale);
        const finalH = Math.round(bitmap.height * scale);

        const canvas = new OffscreenCanvas(finalW, finalH);
        const drawCtx = canvas.getContext("2d")!;

        if (settings.grayscale) drawCtx.filter = "grayscale(100%)";
        drawCtx.drawImage(bitmap, 0, 0, finalW, finalH);

        const compressedBlob = await canvas.convertToBlob({
          type: "image/jpeg",
          quality: settings.quality,
        });

        const newBytes = new Uint8Array(await compressedBlob.arrayBuffer());

        // 4. Update Dictionary (Only if efficiency gained)
        if (newBytes.length < rawContents.length) {
          const newStream = PDFRawStream.of(dict, newBytes);
          pdfDoc.context.assign(ref, newStream);
          
          dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
          dict.set(PDFName.of("Length"), pdfDoc.context.obj(newBytes.length));
          
          if (settings.grayscale) {
            dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceGray"));
          } else {
            dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
          }
          
          dict.delete(PDFName.of("SMask"));
          dict.delete(PDFName.of("PieceInfo"));
          dict.delete(PDFName.of("Metadata"));
        }
        bitmap.close();
      } catch {
        continue; 
      }
    }

    ctx.postMessage({ type: "progress", value: 95 });

    // 5. Final Synthesis
    const output = await pdfDoc.save({ 
      useObjectStreams: true,
      addDefaultPage: false
    });

    // Use Transferable for memory efficiency
    ctx.postMessage({ type: "done", data: output }, [output.buffer as ArrayBuffer]);
  } catch (err: any) {
    ctx.postMessage({ type: "error", error: err.message || "PDF processing stopped unexpectedly." });
  }
};