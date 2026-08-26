'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileOutput, Loader2 } from 'lucide-react';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { checkPdfBackendHealth, convertOnServer, getConversionToolManifest, getPdfBackendErrorCode, type ConversionToolManifest, type PdfBackendHealth } from '@/lib/pdf-backend';
import { conversionQualityLimitation } from '@/lib/conversion-quality-copy';
import { getToolPolicy } from '@/lib/tool-policy';
import { validateBackendSelection } from '@/lib/tool-limits';
import { Btn, Done, Drop, Err, F, G2, Info, IS, Pills, Range, ToolWorkspace, type ToolFile, dl } from './_shared';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';
import { useLanguage } from '@/lib/i18n/language-context';
import { friendlyBackendError } from '@/lib/i18n/backend-errors';

const PDF_IMAGE_IDS = new Set([
  'pdf-to-image','pdf-to-jpg','pdf-to-jpeg','pdf-to-png','pdf-to-webp',
  'pdf-to-tiff','pdf-to-bmp','pdf-to-gif','pdf-to-svg','pdf-to-avif','pdf-to-heic']);
const IMAGE_PDF_IDS = new Set([
  'image-to-pdf','jpg-to-pdf','jpeg-to-pdf','png-to-pdf','webp-to-pdf','tiff-to-pdf','bmp-to-pdf','gif-to-pdf','svg-to-pdf','heic-to-pdf',
]);

function extensionAccept(extensions: string[] | undefined): string {
  return extensions?.length ? extensions.join(',') : '*/*';
}

export default function ServerConversionTool({ toolId }: { toolId: string }) {
  const { t } = useLanguage();
  const tool = BUILD_PUBLIC_TOOLS.find(item => item.id === toolId);
  const policy = getToolPolicy(toolId);
  const [manifest,setManifest]=useState<ConversionToolManifest|null>(null);
  const [backendReady,setBackendReady]=useState(false);
  const [backendHealth,setBackendHealth]=useState<PdfBackendHealth|null>(null);
  const [availabilityIssue,setAvailabilityIssue]=useState<'service'|'manifest'|null>(null);
  const [files,setFiles]=useState<ToolFile[]>([]);
  const [sourceUrl,setSourceUrl]=useState('');
  const [outputName,setOutputName]=useState(toolId);
  const [dpi,setDpi]=useState(180);
  const [quality,setQuality]=useState(92);
  const [grayscale,setGrayscale]=useState(false);
  const [pageRange,setPageRange]=useState('all');
  const [pageSize,setPageSize]=useState<'auto'|'a4'|'letter'>('auto');
  const [orientation,setOrientation]=useState<'auto'|'portrait'|'landscape'>('auto');
  const [marginMm,setMarginMm]=useState(0);
  const [status,setStatus]=useState<'idle'|'checking'|'processing'|'done'>('checking');
  const [processingStage,setProcessingStage]=useState('processing.preparing');
  const [error,setError]=useState('');
  const [result,setResult]=useState<{blob:Blob;filename:string}|null>(null);

  const refreshAvailability=useCallback(async(signal?:AbortSignal)=>{
    setStatus('checking');setAvailabilityIssue(null);
    const [health,tools]=await Promise.all([checkPdfBackendHealth(signal),getConversionToolManifest(signal)]);
    const next=tools.find(entry=>entry.id===toolId)||null;
    setBackendReady(health.status==='online');setBackendHealth(health);setManifest(next);
    if(health.status!=='online')setAvailabilityIssue('service');else if(!next)setAvailabilityIssue('manifest');
    setStatus('idle');
  },[toolId]);

  useEffect(()=>{const controller=new AbortController();void refreshAvailability(controller.signal);return()=>controller.abort();},[refreshAvailability]);
  useEffect(()=>{setFiles([]);setSourceUrl('');setOutputName(toolId);setResult(null);setError('');setPageRange('all');setPageSize('auto');setOrientation('auto');setMarginMm(0);setProcessingStage('processing.preparing');},[toolId]);

  const isUrlTool=toolId==='url-to-pdf';
  const multiple=manifest?.multiFile??policy.maxFiles>1;
  const accept=extensionAccept(manifest?.inputExtensions);
  const selectionSub=manifest?.inputExtensions?.join(', ')||t('conversion.supportedFormats');
  const inputFormats=manifest?.inputExtensions?.map(value=>value.replace(/^\./,'').toUpperCase()).join(', ')||(isUrlTool?'URL':'Checking');
  const outputFormat=manifest?.outputExtension?.replace(/^\./,'').toUpperCase()||'Checking';
  const onFilesChange=(next:ToolFile[])=>{const validation=validateBackendSelection(next.map(item=>item.file),policy.maxFiles,backendHealth);if(validation){setError(validation);return;}setError('');setFiles(next);};
  const canProcess=Boolean(tool&&status!=='processing'&&backendReady&&manifest?.available===true&&(isUrlTool?/^https?:\/\//i.test(sourceUrl.trim()):files.length>0));
  const qualityLimitation=conversionQualityLimitation(toolId,manifest?.limitation||policy.limitation);

  const optionSummary=useMemo(()=>{
    const parts:string[]=[];
    if(PDF_IMAGE_IDS.has(toolId))parts.push(`${dpi} DPI`);
    if(PDF_IMAGE_IDS.has(toolId)||IMAGE_PDF_IDS.has(toolId))parts.push(`${quality}% quality`);
    if(PDF_IMAGE_IDS.has(toolId))parts.push(pageRange.trim().toLowerCase()==='all'?'All pages':`Pages ${pageRange}`);
    if(IMAGE_PDF_IDS.has(toolId))parts.push(`${pageSize.toUpperCase()} · ${orientation} · ${marginMm} mm margin`);
    if(false)parts.push(grayscale?t('conversion.documentCleanup'):t('conversion.colourMode'));
    return parts.join(' • ');
  },[dpi,grayscale,marginMm,orientation,pageRange,pageSize,quality,toolId,t]);

  if(!tool)return null;

  const process=async()=>{
    setError('');setResult(null);
    const latestHealth=await checkPdfBackendHealth();setBackendHealth(latestHealth);
    if(latestHealth.status!=='online'||manifest?.available!==true){setBackendReady(false);setAvailabilityIssue(latestHealth.status!=='online'?'service':'manifest');setError(t('errors.SERVICE_UNAVAILABLE'));return;}
    if(!isUrlTool){const validation=validateBackendSelection(files.map(item=>item.file),policy.maxFiles,latestHealth);if(validation){setError(validation);return;}}
    if(PDF_IMAGE_IDS.has(toolId)&&!/^all$|^\s*\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*\s*$/i.test(pageRange)){setError('Enter pages like all, 2, 1-3, or 1,4,7-9.');return;}
    setStatus('processing');setProcessingStage('processing.converting');
    sendAjnAnalytics({event_name:'tool_start',path:window.location.pathname,tool_id:toolId});
    try{
      const converted=await convertOnServer({
        toolId,files:files.map(item=>item.file),outputName:outputName.trim()||toolId,sourceUrl:sourceUrl.trim(),
        options:{dpi,quality,grayscale,pages:pageRange,page_size:pageSize,orientation,margin_mm:marginMm,auto_rotate:true,deskew:true,denoise:true,contrast:1.35},
      });
      if(!converted.blob.size)throw new Error('The converter returned an empty output file.');
      if(manifest.outputExtension&&!converted.filename.toLowerCase().endsWith(manifest.outputExtension.toLowerCase()))throw new Error(`The processing server returned an unexpected output format. Expected ${manifest.outputExtension.toUpperCase()}.`);
      setProcessingStage('processing.finishing');setResult(converted);setStatus('done');
      sendAjnAnalytics({event_name:'tool_complete',path:window.location.pathname,tool_id:toolId});
    }catch(cause){setStatus('idle');setProcessingStage('processing.preparing');if(getPdfBackendErrorCode(cause)==='CANCELLED'){setError('');return;}setError(friendlyBackendError(t,cause));sendAjnAnalytics({event_name:'tool_error',path:window.location.pathname,tool_id:toolId});}
  };

  const reset=()=>{setFiles([]);setSourceUrl('');setResult(null);setError('');setProcessingStage('processing.preparing');setStatus('idle');};

  return <ToolWorkspace title={tool.name} description={tool.desc} accent={tool.cat==='img'?'#10B981':'#2563EB'}>
    <div className="space-y-4">
      {status==='checking'?<div className="flex min-h-48 items-center justify-center gap-3 text-sm font-bold text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-blue-600"/>{t('processing.preparing')}</div>
      :status==='done'&&result?<Done msg={`${t('result.ready')} · ${outputFormat}`} onDownload={()=>dl(result.blob,result.filename)} dlLabel={`${t('common.download')} ${outputFormat}`} onReset={reset} shareFile={{blob:result.blob,name:result.filename}}/>
      :<>
        {manifest?.available===false&&<Info bg="rgba(239,68,68,.08)" col="#991B1B">{manifest.unavailableReason||t('conversion.dependencyMissing')}</Info>}
        {availabilityIssue&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="text-sm font-bold text-red-900">{availabilityIssue==='service'?t('errors.SERVICE_UNAVAILABLE'):t('conversion.dependencyMissing')}</div><button type="button" onClick={()=>void refreshAvailability()} className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-800">{t('common.tryAgain')}</button></div>}
        {isUrlTool?<F label={t('conversion.publicUrl')} hint={t('conversion.publicUrlHint')}><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://example.com/article" style={IS} inputMode="url"/></F>:<Drop files={files} onChange={onFilesChange} accept={accept} multiple={multiple} label={multiple?t('common.chooseFiles'):t('common.chooseFile')} sub={selectionSub}/>}

        <Info bg="rgba(37,99,235,.08)" col="#1D4ED8">Input: {inputFormats} → Output: {outputFormat}{backendHealth?.version?` · Processing service ${backendHealth.version}`:''}</Info>

        <div className="rounded-2xl border border-border bg-muted/45 p-4 space-y-4">
          <G2><F label={t('common.outputName')} hint={t('conversion.outputExtensionHint',{extension:manifest?.outputExtension||''})}><input value={outputName} onChange={e=>setOutputName(e.target.value)} maxLength={100} style={IS}/></F>
          <F label={t('common.output')}><div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-black"><FileOutput className="h-4 w-4 text-blue-600"/>{manifest?.outputExtension||t('conversion.resultFile')}</div></F></G2>

          {PDF_IMAGE_IDS.has(toolId)&&<Range label={t('conversion.resolution')} min={72} max={400} step={10} value={dpi} onChange={setDpi} fmt={v=>`${v} DPI`}/>}
          {(PDF_IMAGE_IDS.has(toolId)||IMAGE_PDF_IDS.has(toolId))&&<Range label={t('common.quality')} min={45} max={100} step={5} value={quality} onChange={setQuality} fmt={v=>`${v}%`}/>}
          {PDF_IMAGE_IDS.has(toolId)&&<F label="Pages" hint="Use all, 2, 1-3, or 1,4,7-9"><input value={pageRange} onChange={e=>setPageRange(e.target.value)} style={IS}/></F>}
          {IMAGE_PDF_IDS.has(toolId)&&<><G2><F label="Page size"><Pills opts={[{label:'Auto',value:'auto'},{label:'A4',value:'a4'},{label:'Letter',value:'letter'}]} val={pageSize} onChange={(v:any)=>setPageSize(v)}/></F><F label="Orientation"><Pills opts={[{label:'Auto',value:'auto'},{label:'Portrait',value:'portrait'},{label:'Landscape',value:'landscape'}]} val={orientation} onChange={(v:any)=>setOrientation(v)}/></F></G2><Range label="Page margin" min={0} max={30} step={1} value={marginMm} onChange={setMarginMm} fmt={v=>`${v} mm`}/></>}
          {false&&<F label={t('common.appearance')}><Pills opts={[{label:t('conversion.documentCleanup'),value:'clean'},{label:t('conversion.colourMode'),value:'colour'}]} val={grayscale?'clean':'colour'} onChange={value=>setGrayscale(value==='clean')}/></F>}
        </div>

        {PDF_IMAGE_IDS.has(toolId)&&manifest?.outputExtension==='.zip'&&<Info bg="rgba(14,165,233,.08)" col="#075985">This tool renders the requested image format inside the ZIP. Each selected PDF page becomes its own {toolId.replace('pdf-to-','').replace('image','png').toUpperCase()} image.</Info>}
        {optionSummary&&<Info>{optionSummary}</Info>}
        {qualityLimitation&&<Info bg="rgba(245,158,11,.09)" col="#92400E">{qualityLimitation}</Info>}
        <Err msg={error}/>
        {status==='processing'&&<div className="sr-only" role="status" aria-live="polite">{t(processingStage)}</div>}
        <Btn full onClick={process} disabled={!canProcess||status==='processing'} loading={status==='processing'}><FileOutput size={16}/>{t('processing.converting')}</Btn>
      </>}
    </div>
  </ToolWorkspace>;
}
