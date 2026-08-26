'use client';

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export type SignatureSource = 'draw' | 'type' | 'upload';
export type SignatureMarkKind = 'signature' | 'initials' | 'date';

export interface SignaturePlacementInput {
  id?: string;
  kind?: SignatureMarkKind;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  dataUrl?: string;
}

export interface ElectronicSignatureInput {
  signerName: string;
  signerEmail: string;
  reason: string;
  consented: boolean;
  consentText: string;
  signatureSource: SignatureSource;
  page?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  placements?: SignaturePlacementInput[];
  includeAuditCaption?: boolean;
}

export interface ElectronicSignatureEvidence {
  version: '1.1';
  evidence_id: string;
  created_at_utc: string;
  product: 'AJN PDF';
  signature_type: 'electronic-signature';
  certificate_signature: false;
  signer: { name: string; email: string };
  intent: { consented: true; consent_text: string; reason: string };
  document: { original_filename: string; original_sha256: string; signed_content_sha256: string; final_pdf_sha256: string };
  signature: {
    source: SignatureSource;
    signature_image_sha256: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    placements: Array<{
      kind: SignatureMarkKind;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      signature_image_sha256: string;
    }>;
  };
  notice: string;
}

function clean(value: string, maximum: number) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

export async function sha256Hex(input: Blob | ArrayBuffer | Uint8Array) {
  let bytes: ArrayBuffer;
  if (input instanceof Blob) bytes = await input.arrayBuffer();
  else if (input instanceof Uint8Array) bytes = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  else bytes = input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join('');
}

function dataUrlBytes(dataUrl: string) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error('Signature marks must be PNG images.');
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function createElectronicSignature(
  pdfFile: File,
  signaturePngDataUrl: string,
  input: ElectronicSignatureInput,
): Promise<{ pdfBlob: Blob; evidence: ElectronicSignatureEvidence; evidenceBlob: Blob }> {
  const signerName = clean(input.signerName, 120);
  const signerEmail = clean(input.signerEmail, 180);
  const reason = clean(input.reason, 300);
  const consentText = clean(input.consentText, 500);
  if (!signerName) throw new Error('Enter the signer name.');
  if (!/^\S+@\S+\.\S+$/.test(signerEmail)) throw new Error('Enter a valid signer email address.');
  if (!input.consented) throw new Error('Confirm your intent and consent to sign electronically.');

  const originalBytes = await pdfFile.arrayBuffer();
  const originalSha256 = await sha256Hex(originalBytes);
  const createdAt = new Date().toISOString();
  const evidenceId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;

  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(originalBytes, { ignoreEncryption: false });
  } catch {
    throw new Error('This PDF is encrypted, password protected, or structurally unreadable. Unlock it first, then sign it.');
  }
  if (pdf.isEncrypted) throw new Error('Encrypted PDFs must be unlocked before electronic signing.');

  const rawPlacements = input.placements?.length
    ? input.placements
    : [{ kind: 'signature' as const, page: input.page || 1, x: input.x || 100, y: input.y || 100, width: input.width || 165, height: input.height || 78, rotation: input.rotation || 0 }];

  const evidencePlacements: ElectronicSignatureEvidence['signature']['placements'] = [];
  let firstHash = '';

  for (const raw of rawPlacements) {
    const pageIndex = Math.max(0, Math.min(pdf.getPageCount() - 1, Math.round(raw.page || 1) - 1));
    const page = pdf.getPage(pageIndex);
    const pageSize = page.getSize();
    const width = Math.max(24, Math.min(pageSize.width, Number(raw.width) || 160));
    const height = Math.max(16, Math.min(pageSize.height, Number(raw.height) || 80));
    const x = Math.max(0, Math.min(pageSize.width - width, Number(raw.x) || 0));
    const y = Math.max(0, Math.min(pageSize.height - height, Number(raw.y) || 0));
    const rotation = Math.max(-180, Math.min(180, Number(raw.rotation) || 0));
    const bytes = dataUrlBytes(raw.dataUrl || signaturePngDataUrl);
    const hash = await sha256Hex(bytes);
    if (!firstHash) firstHash = hash;
    const image = await pdf.embedPng(bytes);
    page.drawImage(image, { x, y, width, height, rotate: degrees(rotation) });
    evidencePlacements.push({
      kind: raw.kind || 'signature',
      page: pageIndex + 1,
      x, y, width, height, rotation,
      signature_image_sha256: hash,
    });
  }

  const first = evidencePlacements[0];
  if (input.includeAuditCaption !== false && first) {
    const page = pdf.getPage(first.page - 1);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const caption = `Electronically signed by ${signerName} • ${createdAt.slice(0, 10)} UTC`;
    page.drawText(caption.slice(0, 160), {
      x: first.x,
      y: Math.max(3, first.y - 10),
      size: 7,
      font,
      color: rgb(0.2, 0.24, 0.31),
    });
  }

  pdf.setProducer('AJN PDF');
  pdf.setCreator('AJN PDF Signature Studio');
  pdf.setSubject('Evidence-backed electronic signature');
  pdf.setKeywords(['AJN PDF', 'electronic signature', 'audit evidence', evidenceId]);

  const signedContent = await pdf.save({ useObjectStreams: true });
  const signedContentSha256 = await sha256Hex(signedContent);
  const attachment = {
    version: '1.1', evidence_id: evidenceId, created_at_utc: createdAt, product: 'AJN PDF',
    signature_type: 'electronic-signature', certificate_signature: false,
    signer: { name: signerName, email: signerEmail },
    intent: { consented: true, consent_text: consentText, reason },
    document: {
      original_filename: clean(pdfFile.name, 200),
      original_sha256: originalSha256,
      signed_content_sha256: signedContentSha256,
      final_pdf_sha256: 'See companion evidence manifest generated after final serialization.',
    },
    signature: {
      source: input.signatureSource, signature_image_sha256: firstHash,
      page: first.page, x: first.x, y: first.y, width: first.width, height: first.height,
      placements: evidencePlacements,
    },
    notice: 'AJN PDF evidence-backed electronic signature. This is not a certificate-backed PAdES digital signature.',
  };

  await pdf.attach(new TextEncoder().encode(JSON.stringify(attachment, null, 2)), 'ajn-signature-evidence.json', {
    mimeType: 'application/json',
    description: 'AJN PDF electronic signature evidence manifest',
    creationDate: new Date(createdAt),
    modificationDate: new Date(createdAt),
  });

  const finalBytes = await pdf.save({ useObjectStreams: true });
  const finalPdfSha256 = await sha256Hex(finalBytes);
  const evidence = {
    ...attachment,
    version: '1.1' as const,
    document: { ...attachment.document, final_pdf_sha256: finalPdfSha256 },
  } as ElectronicSignatureEvidence;
  const evidenceBlob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
  return {
    pdfBlob: new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    evidence,
    evidenceBlob,
  };
}
