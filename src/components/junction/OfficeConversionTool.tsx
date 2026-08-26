'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileOutput } from 'lucide-react';
import {
  checkPdfBackendHealth,
  convertOnServer,
  getConversionToolManifest,
  type ConversionToolManifest,
  type PdfBackendHealth,
} from '@/lib/pdf-backend';
import { getToolPolicy } from '@/lib/tool-policy';
import { validateBackendSelection } from '@/lib/tool-limits';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { Btn, Done, Drop, Err, F, Info, IS, Pills, Range, ToolWorkspace, type ToolFile, dl } from './_shared';

const OFFICE_TO_PDF = new Set([
  'word-to-pdf','doc-to-pdf','docx-to-pdf','excel-to-pdf','xls-to-pdf','xlsx-to-pdf',
  'powerpoint-to-pdf','ppt-to-pdf','pptx-to-pdf','odt-to-pdf','ods-to-pdf','odp-to-pdf']);
const EXCEL_TO_PDF = new Set(['excel-to-pdf','xls-to-pdf','xlsx-to-pdf','ods-to-pdf']);
const PPT_TO_PDF = new Set(['powerpoint-to-pdf','ppt-to-pdf','pptx-to-pdf','odp-to-pdf']);
const PDF_TO_PPT = new Set(['pdf-to-powerpoint','pdf-to-pptx']);
const PDF_TO_TABLE = new Set(['pdf-to-excel','pdf-to-xlsx','pdf-to-csv']);
const PDF_TO_WORD = new Set(['pdf-to-word','pdf-to-docx']);

export default function OfficeConversionTool({ toolId }: { toolId: string }) {
  const tool = BUILD_PUBLIC_TOOLS.find(item => item.id === toolId);
  const policy = getToolPolicy(toolId);
  const [manifest, setManifest] = useState<ConversionToolManifest | null>(null);
  const [health, setHealth] = useState<PdfBackendHealth | null>(null);
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [status, setStatus] = useState<'checking'|'idle'|'processing'|'done'>('checking');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [outputName, setOutputName] = useState(toolId);
  const [fitMode, setFitMode] = useState<'preserve'|'single-page-sheet'>('preserve');
  const [exportNotes, setExportNotes] = useState(false);
  const [pptMode, setPptMode] = useState<'preserve'|'editable'>('preserve');
  const [dpi, setDpi] = useState(160);
  const [allowUnstructured, setAllowUnstructured] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [nextHealth, tools] = await Promise.all([checkPdfBackendHealth(), getConversionToolManifest()]);
      if (!active) return;
      setHealth(nextHealth);
      const nextManifest = tools.find(entry => entry.id === toolId) || null;
      setManifest(nextManifest);
      if (nextHealth.status !== 'online') setError('Conversion backend is unavailable.');
      else if (!nextManifest) setError('This conversion is not registered on the active processing server yet.');
      else if (!nextManifest.available) setError(nextManifest.unavailableReason || 'This conversion is unavailable on the active processing server.');
      else setError('');
      setStatus('idle');
    })();
    return () => { active = false; };
  }, [toolId]);

  useEffect(() => {
    setFiles([]);
    setResult(null);
    setError('');
    setOutputName(toolId);
  }, [toolId]);

  const accept = manifest?.inputExtensions?.join(',') || '*/*';
  const canProcess = status === 'idle' && manifest?.available === true && files.length > 0;
  const inputFormats = manifest?.inputExtensions?.map(value => value.replace(/^\./, '').toUpperCase()).join(', ') || 'Checking';
  const outputFormat = manifest?.outputExtension?.replace(/^\./, '').toUpperCase() || 'Checking';
  const summary = useMemo(() => {
    if (EXCEL_TO_PDF.has(toolId)) return fitMode === 'preserve' ? 'Preserve workbook print settings' : 'Fit each sheet to one PDF page';
    if (PPT_TO_PDF.has(toolId)) return exportNotes ? 'Slides plus notes pages' : 'Slides only';
    if (PDF_TO_PPT.has(toolId)) return pptMode === 'preserve' ? 'Preserve appearance · page image slides' : 'Editable reconstruction · text and images';
    if (PDF_TO_TABLE.has(toolId)) return 'Detect real table structure first; optional line fallback is explicit.';
    if (PDF_TO_WORD.has(toolId)) return includeImages
      ? 'Reconstruct selectable text, detected tables, basic formatting and embedded images into DOCX.'
      : 'Reconstruct selectable text, detected tables and basic formatting into DOCX without embedded images.';
    if (OFFICE_TO_PDF.has(toolId)) return 'Format-specific LibreOffice PDF export with post-conversion validation';
    return 'Fidelity-first conversion';
  }, [toolId, fitMode, exportNotes, pptMode, includeImages]);

  if (!tool) return null;

  const onFiles = (next: ToolFile[]) => {
    const issue = validateBackendSelection(next.map(item => item.file), policy.maxFiles, health);
    if (issue) { setError(issue); return; }
    setFiles(next);
    setError('');
  };

  const process = async () => {
    setError('');
    setResult(null);
    const latest = await checkPdfBackendHealth();
    setHealth(latest);
    if (latest.status !== 'online') { setError('Conversion backend is unavailable.'); return; }
    if (!manifest?.available) { setError(manifest?.unavailableReason || 'This conversion is not available on the active processing server.'); return; }
    const issue = validateBackendSelection(files.map(item => item.file), policy.maxFiles, latest);
    if (issue) { setError(issue); return; }
    setStatus('processing');
    try {
      const converted = await convertOnServer({
        toolId,
        files: files.map(item => item.file),
        outputName: outputName.trim() || toolId,
        options: {
          office_fit_mode: fitMode,
          export_notes: exportNotes,
          ppt_mode: pptMode,
          dpi,
          scanned_table_fallback: false,
          allow_unstructured: allowUnstructured,
          include_images: includeImages,
        },
      });
      if (!converted.blob.size) throw new Error('Converter returned an empty result.');
      if (manifest.outputExtension && !converted.filename.toLowerCase().endsWith(manifest.outputExtension.toLowerCase())) {
        throw new Error(`The processing server returned an unexpected output format. Expected ${manifest.outputExtension.toUpperCase()}.`);
      }
      setResult(converted);
      setStatus('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Conversion failed.');
      setStatus('idle');
    }
  };

  if (status === 'done' && result) {
    return (
      <ToolWorkspace title={tool.name} description={tool.desc} accent="#2563EB">
        <Done
          msg={`Conversion ready · ${outputFormat}`}
          onDownload={() => dl(result.blob, result.filename)}
          dlLabel={`Download ${outputFormat}`}
          onReset={() => { setFiles([]); setResult(null); setStatus('idle'); }}
          shareFile={{ blob: result.blob, name: result.filename }}
        />
      </ToolWorkspace>
    );
  }

  return (
    <ToolWorkspace title={tool.name} description={tool.desc} accent="#2563EB">
      <div className="space-y-4">
        <Drop
          files={files}
          onChange={onFiles}
          accept={accept}
          multiple={false}
          label="Choose source file"
          sub={manifest?.inputExtensions?.join(', ') || 'Checking supported document format'}
        />

        <Info bg="rgba(37,99,235,.08)" col="#1D4ED8">
          Input: {inputFormats} → Output: {outputFormat}{health?.version ? ` · Processing service ${health.version}` : ''}
        </Info>

        <div className="space-y-4 rounded-2xl border border-border bg-muted/45 p-4">
          <F label="Output name"><input value={outputName} onChange={event => setOutputName(event.target.value)} style={IS} /></F>

          {EXCEL_TO_PDF.has(toolId) && (
            <F label="Spreadsheet pagination">
              <Pills
                opts={[{ label:'Preserve source', value:'preserve' }, { label:'Fit each sheet', value:'single-page-sheet' }]}
                val={fitMode}
                onChange={(value:any) => setFitMode(value)}
              />
            </F>
          )}

          {PPT_TO_PDF.has(toolId) && (
            <F label="PowerPoint export">
              <Pills
                opts={[{ label:'Slides only', value:'slides' }, { label:'Include notes', value:'notes' }]}
                val={exportNotes ? 'notes' : 'slides'}
                onChange={value => setExportNotes(value === 'notes')}
              />
            </F>
          )}

          {PDF_TO_PPT.has(toolId) && (
            <>
              <F label="PowerPoint mode">
                <Pills
                  opts={[{ label:'Preserve appearance', value:'preserve' }, { label:'Editable reconstruction', value:'editable' }]}
                  val={pptMode}
                  onChange={(value:any) => setPptMode(value)}
                />
              </F>
              <Range label="Render quality" min={96} max={300} step={10} value={dpi} onChange={setDpi} fmt={value => `${value} DPI`} />
            </>
          )}

          {PDF_TO_TABLE.has(toolId) && (
            <F label="No table detected">
              <Pills
                opts={[{ label:'Stop safely', value:'stop' }, { label:'Allow line fallback', value:'allow' }]}
                val={allowUnstructured ? 'allow' : 'stop'}
                onChange={value => setAllowUnstructured(value === 'allow')}
              />
            </F>
          )}

          {PDF_TO_WORD.has(toolId) && (
            <F label="Embedded images">
              <Pills
                opts={[{ label:'Include', value:'on' }, { label:'Text only', value:'off' }]}
                val={includeImages ? 'on' : 'off'}
                onChange={value => setIncludeImages(value === 'on')}
              />
            </F>
          )}
        </div>

        <Info>{summary}</Info>
        <Info bg="rgba(245,158,11,.09)" col="#92400E">
          AJN PDF validates the real output format. Complex Office/PDF layouts can still require adjustment; the tool does not claim pixel-perfect editability.
        </Info>
        <Err msg={error} />
        <Btn full onClick={process} disabled={!canProcess} loading={status === 'processing'}>
          <FileOutput size={16} />Convert with fidelity checks
        </Btn>
      </div>
    </ToolWorkspace>
  );
}
