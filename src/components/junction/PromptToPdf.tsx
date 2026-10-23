'use client';

import { useMemo, useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Download, FileText, RotateCcw, Sparkles } from 'lucide-react';
import { ToolWorkspace, dl, beginToolProcessing, completeToolProcessing, failToolProcessing } from './_shared';
import { Button } from '../ui/button';

const PAGE_SIZES = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
} as const;

export default function PromptToPdf() {
  const [title, setTitle] = useState('My Prompt');
  const [content, setContent] = useState('Write or paste your prompt, instructions, notes, checklist, or document text here.\n\nYou can use blank lines to separate sections.');
  const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>('A4');
  const [fontSize, setFontSize] = useState('11');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);

  const createPdf = async () => {
    if (!content.trim()) { setStatus('Enter some text before creating your PDF.'); return; }
    setBusy(true); setDone(false); setStatus('Creating your PDF in this browser…'); beginToolProcessing('PromptToPdf');
    try {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const [width, height] = PAGE_SIZES[pageSize];
      const size = Math.max(8, Math.min(18, Number(fontSize) || 11));
      const margin = 52;
      const maxWidth = width - margin * 2;
      let page = pdf.addPage([width, height]);
      let y = height - margin;
      const addPage = () => { page = pdf.addPage([width, height]); y = height - margin; };
      const drawWrapped = (text: string, textSize: number, textFont: typeof font, color = rgb(0.13, 0.17, 0.24), lineGap = 1.45) => {
        // Standard PDF fonts support a limited Latin character set. Replace unsupported glyphs visibly rather than failing the whole export.
        const safe = text.replace(/[^\x20-\x7E]/g, '?');
        const words = safe.split(/\s+/);
        let line = '';
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (textFont.widthOfTextAtSize(candidate, textSize) > maxWidth && line) {
            if (y < margin + textSize * 2) addPage();
            page.drawText(line, { x: margin, y, size: textSize, font: textFont, color });
            y -= textSize * lineGap; line = word;
          } else line = candidate;
        }
        if (line) {
          if (y < margin + textSize * 2) addPage();
          page.drawText(line, { x: margin, y, size: textSize, font: textFont, color });
          y -= textSize * lineGap;
        }
      };
      const safeTitle = title.trim() || 'Prompt Document';
      drawWrapped(safeTitle, Math.min(size + 7, 24), bold, rgb(0.08, 0.22, 0.52), 1.4);
      y -= 12;
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.82, 0.87, 0.94) });
      y -= 22;
      for (const paragraph of content.replace(/\r\n/g, '\n').split('\n')) {
        if (!paragraph.trim()) { y -= size * 0.8; if (y < margin + size * 2) addPage(); continue; }
        drawWrapped(paragraph, size, font);
      }
      const pages = pdf.getPages();
      pages.forEach((p, index) => {
        p.drawText(`${index + 1} / ${pages.length}`, { x: width - margin - 44, y: 24, size: 8, font, color: rgb(0.45, 0.49, 0.56) });
      });
      pdf.setTitle(safeTitle); pdf.setSubject('Created locally with AJN PDF Prompt to PDF');
      const bytes = await pdf.save();
      dl(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${safeTitle.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'prompt-document'}.pdf`);
      setDone(true); setStatus('PDF created. Your download should start automatically.'); completeToolProcessing();
    } catch {
      setStatus('Could not create this PDF. Try simpler text or a shorter title.'); failToolProcessing();
    } finally { setBusy(false); }
  };

  const reset = () => { setTitle('My Prompt'); setContent(''); setStatus(''); setDone(false); };

  return <ToolWorkspace title="Prompt to PDF" description="Create a clean PDF from a prompt, instructions, notes, or text. Everything is processed in your browser; no server processing is used." accent="#6D4AFF">
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-slate-900">Your document</h2><p className="mt-1 text-sm text-slate-600">Paste a prompt or write the final text you want inside the PDF.</p></div></div>
        <label className="block text-sm font-bold text-slate-700" htmlFor="prompt-pdf-title">Document title</label>
        <input id="prompt-pdf-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="e.g. Study Plan or AI Prompt" />
        <label className="block text-sm font-bold text-slate-700" htmlFor="prompt-pdf-content">Prompt or content</label>
        <textarea id="prompt-pdf-content" value={content} onChange={e => { setContent(e.target.value); setDone(false); }} maxLength={100000} rows={14} className="min-h-[260px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Paste your prompt, instructions, notes, or text here…" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{wordCount.toLocaleString()} words · {content.length.toLocaleString()} characters</span><button type="button" onClick={reset} className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-violet-700"><RotateCcw className="h-3.5 w-3.5" /> Clear</button></div>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold text-slate-700">Page size<select value={pageSize} onChange={e => setPageSize(e.target.value as keyof typeof PAGE_SIZES)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="A4">A4</option><option value="Letter">US Letter</option></select></label><label className="text-sm font-bold text-slate-700">Body text size<select value={fontSize} onChange={e => setFontSize(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="9">Small · 9 pt</option><option value="10">Compact · 10 pt</option><option value="11">Standard · 11 pt</option><option value="12">Large · 12 pt</option><option value="14">Extra large · 14 pt</option></select></label></div>
        <Button type="button" onClick={createPdf} disabled={busy || !content.trim()} className="h-12 w-full rounded-xl bg-violet-700 text-white hover:bg-violet-800">{busy ? 'Creating PDF…' : <><Download className="mr-2 h-4 w-4" /> Create and download PDF</>}</Button>
        {status && <p role="status" aria-live="polite" className={`rounded-xl p-3 text-sm ${done ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}>{status}</p>}
        <p className="text-xs leading-5 text-slate-500">Note: the built-in PDF font supports basic English/ASCII characters. Accented characters and non-Latin scripts are replaced with “?”. For Hindi, Telugu, Tamil, Kannada or other scripts, use a PDF workflow that embeds a suitable font.</p>
      </section>
      <aside className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-700"/><h2 className="font-black text-slate-900">Live text preview</h2></div><div className="mt-4 min-h-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h3 className="break-words text-xl font-black text-slate-900">{title.trim() || 'Untitled document'}</h3><div className="my-4 h-px bg-slate-200"/><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{content || 'Your document preview will appear here as you type.'}</p></div><p className="mt-3 text-xs leading-5 text-slate-500">The preview shows the text layout. Page breaks are applied automatically during export.</p></aside>
    </div>
  </ToolWorkspace>;
}
