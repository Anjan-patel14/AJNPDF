'use client';

import React, { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import { Btn, Done, Err, F, IS, ToolWorkspace, dl, safeOutputName, withProcessingActivity } from './_shared';

type Mode = 'html' | 'markdown';

const CONFIG: Record<Mode, { title: string; description: string; accept: string; extensions: string[] }> = {
  html: {
    title: 'HTML to PDF',
    description: 'Convert an HTML file or pasted HTML into a clean PDF directly in your browser.',
    accept: '.html,.htm,text/html',
    extensions: ['.html', '.htm'],
  },
  markdown: {
    title: 'Markdown to PDF',
    description: 'Convert Markdown text or a .md file into a readable PDF directly in your browser.',
    accept: '.md,.markdown,text/markdown,text/plain',
    extensions: ['.md', '.markdown'],
  },
};

function stripHtml(html: string) {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function ext(name: string) {
  const match = /\.[^.]+$/.exec(name.toLowerCase());
  return match?.[0] || '';
}

export default function TextMarkupToPdf() {
  const pathname = usePathname();
  const mode: Mode = pathname.includes('markdown-to-pdf') ? 'markdown' : 'html';
  const config = CONFIG[mode];
  const [raw, setRaw] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [outputName, setOutputName] = useState(mode === 'markdown' ? 'markdown-document' : 'html-document');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const preview = useMemo(() => {
    if (!raw.trim()) return '';
    if (mode === 'markdown') return stripHtml(marked.parse(raw, { async: false }) as string);
    return stripHtml(raw);
  }, [raw, mode]);

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!config.extensions.includes(ext(file.name))) {
      setError(`Choose a ${config.extensions.join(' or ')} file.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The source file must be 5 MB or smaller for browser processing.');
      return;
    }
    const text = await file.text();
    setRaw(text);
    setSourceName(file.name);
    setOutputName(file.name.replace(/\.[^.]+$/, '') || (mode === 'markdown' ? 'markdown-document' : 'html-document'));
    setError('');
    setResult(null);
  };

  const convert = async () => {
    if (!preview.trim()) {
      setError('Add some content before creating the PDF.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const blob = await withProcessingActivity(config.title, async () => {
        const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
        pdf.setProperties({ title: outputName || config.title, creator: 'AJN PDF' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 48;
        const lineHeight = 16;
        const lines = pdf.splitTextToSize(preview, pageWidth - margin * 2) as string[];
        let y = margin;
        for (const line of lines) {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        }
        return pdf.output('blob');
      });
      setResult(blob);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The PDF could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolWorkspace title={config.title} description={config.description} accent="#2563EB">
      {result ? (
        <Done
          msg="PDF created successfully"
          onDownload={() => dl(result, safeOutputName(outputName, 'document', '.pdf'))}
          shareFile={{ blob: result, name: safeOutputName(outputName, 'document', '.pdf') }}
          onReset={() => { setResult(null); setRaw(''); setSourceName(''); setError(''); }}
        />
      ) : (
        <div className="space-y-4">
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
            Choose {mode === 'markdown' ? 'Markdown' : 'HTML'} file
            <input type="file" accept={config.accept} className="hidden" onChange={chooseFile} />
          </label>
          {sourceName && <p className="text-xs font-semibold text-slate-500">Loaded: {sourceName}</p>}
          <F label={mode === 'markdown' ? 'Markdown content' : 'HTML content'}>
            <textarea
              value={raw}
              onChange={(event) => { setRaw(event.target.value); setResult(null); }}
              placeholder={mode === 'markdown' ? '# Heading\nWrite or paste Markdown here…' : '<h1>Heading</h1>\n<p>Write or paste HTML here…</p>'}
              style={{ ...IS, minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
            />
          </F>
          <F label="Output filename">
            <input value={outputName} onChange={(event) => setOutputName(event.target.value)} style={IS} />
          </F>
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold leading-5 text-blue-900">
            Browser-only conversion. External scripts are not executed. HTML is converted to readable document text; Markdown is rendered to readable text before PDF creation.
          </p>
          <Err msg={error} />
          <Btn onClick={convert} loading={loading} disabled={!raw.trim()} full>Create PDF</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
