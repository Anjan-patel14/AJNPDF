"use client";

import React,{useRef,useState} from "react";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import {Download,FileText,Image as ImageIcon,RefreshCcw,ShieldCheck} from "lucide-react";
import {RuntimeImage} from "@/components/ui/runtime-image";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {ToolWorkspace,beginToolProcessing,completeToolProcessing,dl,failToolProcessing,fmtBytes,getFilesFromEvent} from "./_shared";
import {initPdfWorker} from "@/lib/pdfjs-worker";
import {useToast} from "@/hooks/use-toast";
import { validatePdfFile } from "@/lib/file-validation";

const MAX_IMAGES=500;
const MAX_IMAGE_PIXELS=50_000_000;
const MAX_TOTAL_PIXELS=180_000_000;

type PdfImageData={
  width?:number;
  height?:number;
  data?:Uint8ClampedArray|Uint8Array;
  bitmap?:ImageBitmap|HTMLCanvasElement|HTMLImageElement|OffscreenCanvas;
};

function safeBaseName(value:string){
  return String(value||"AJN_PDF_Images").trim().replace(/\.pdf$/i,"").replace(/[<>:"/\\|?*\u0000-\u001F]/g,"_").replace(/[. ]+$/g,"").slice(0,90)||"AJN_PDF_Images";
}

function canvasPng(canvas:HTMLCanvasElement):Promise<Blob>{
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("The embedded image could not be encoded as PNG.")),"image/png"));
}

async function digestBlob(blob:Blob):Promise<string>{
  const digest=await crypto.subtle.digest("SHA-256",await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,"0")).join("");
}

function imageCanvas(image:PdfImageData):HTMLCanvasElement|null{
  const width=Math.max(0,Number(image.width||0));
  const height=Math.max(0,Number(image.height||0));
  if(!width||!height||width*height>MAX_IMAGE_PIXELS)return null;
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
  const context=canvas.getContext("2d");if(!context)return null;
  if(image.bitmap){
    context.drawImage(image.bitmap as CanvasImageSource,0,0,width,height);
    return canvas;
  }
  const raw=image.data;
  if(!raw)return null;
  const expected=width*height*4;
  if(raw.length!==expected)return null;
  const pixels=new Uint8ClampedArray(expected);
  pixels.set(raw);
  context.putImageData(new ImageData(pixels,width,height),0,0);
  return canvas;
}

function getPdfImage(page:any,imageId:string):Promise<PdfImageData|null>{
  return new Promise(resolve=>{
    let settled=false;
    const finish=(value:PdfImageData|null)=>{if(settled)return;settled=true;resolve(value);};
    const timer=window.setTimeout(()=>finish(null),10000);
    const onValue=(value:any)=>{window.clearTimeout(timer);finish(value&&typeof value==="object"?value as PdfImageData:null);};
    try{
      const direct=page.objs?.get?.(imageId,onValue);
      if(direct)onValue(direct);
    }catch{
      window.clearTimeout(timer);finish(null);
    }
  });
}

function pdfImageOperatorIds():Set<number>{
  const ops=pdfjsLib.OPS as unknown as Record<string,number>;
  return new Set(
    ["paintImageXObject","paintImageXObjectRepeat","paintJpegXObject"]
      .map(name=>ops[name])
      .filter((value):value is number=>typeof value==="number")
  );
}

export default function ExtractImages(){
  const {toast}=useToast();
  const inputRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<string>("");
  const [phase,setPhase]=useState<"upload"|"ready"|"processing"|"done">("upload");
  const [progress,setProgress]=useState(0);
  const [result,setResult]=useState<Blob|null>(null);
  const [count,setCount]=useState(0);
  const [outputName,setOutputName]=useState("AJN_PDF_Images");

  const reset=()=>{setFile(null);setPreview("");setResult(null);setCount(0);setProgress(0);setPhase("upload");};

  const load=async(f:File)=>{
    const validation=await validatePdfFile(f,40);
    if(validation){toast({title:"Choose a valid PDF",description:validation,variant:"destructive"});return;}
    try{
      initPdfWorker();
      const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
      if(pdf.numPages<1) throw new Error("This PDF contains no pages.");
      const page=await pdf.getPage(1);
      const viewport=page.getViewport({scale:0.55});
      const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(viewport.width));canvas.height=Math.max(1,Math.round(viewport.height));
      const ctx=canvas.getContext("2d");if(!ctx) throw new Error("PDF preview is unavailable in this browser.");
      await page.render({canvasContext:ctx,viewport}).promise;
      setPreview(canvas.toDataURL("image/jpeg",0.78));
      setFile(f);setOutputName(`${safeBaseName(f.name)}_images`);setPhase("ready");
    }catch(error:any){toast({title:"PDF could not be opened",description:error?.message||"The PDF may be damaged or unsupported.",variant:"destructive"});}
  };

  const onUpload=(event:React.ChangeEvent<HTMLInputElement>|React.DragEvent<HTMLElement>)=>{
    const selected=getFilesFromEvent(event)?.[0];if(selected) void load(selected);
  };

  const extract=async()=>{
    if(!file)return;
    beginToolProcessing("Extract Images");setPhase("processing");setProgress(1);
    try{
      initPdfWorker();
      const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const zip=new JSZip();
      const seen=new Set<string>();
      let extracted=0;let totalPixels=0;
      const imageOps=pdfImageOperatorIds();

      for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
        const page=await pdf.getPage(pageNumber);
        const operations=await page.getOperatorList();
        for(let index=0;index<operations.fnArray.length;index++){
          if(!imageOps.has(operations.fnArray[index]))continue;
          if(extracted>=MAX_IMAGES)throw new Error(`This PDF contains more than ${MAX_IMAGES} embedded images. Split the PDF and extract in smaller batches.`);
          const imageId=String(operations.argsArray[index]?.[0]||"");if(!imageId)continue;
          const object=await getPdfImage(page,imageId);if(!object)continue;
          const canvas=imageCanvas(object);if(!canvas)continue;
          totalPixels+=canvas.width*canvas.height;
          if(totalPixels>MAX_TOTAL_PIXELS)throw new Error("The embedded images are too large for one browser extraction job. Split the PDF and try again.");
          const blob=await canvasPng(canvas);
          const hash=await digestBlob(blob);
          if(seen.has(hash))continue;
          seen.add(hash);
          extracted++;
          zip.file(`page-${String(pageNumber).padStart(3,"0")}-image-${String(extracted).padStart(3,"0")}.png`,blob,{binary:true});
        }
        setProgress(Math.max(1,Math.round(pageNumber/pdf.numPages*92)));
      }

      if(!extracted)throw new Error("No embedded raster images were found. Use PDF to PNG/JPG if you want full-page images instead.");
      const zipBlob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}},metadata=>setProgress(92+Math.round(metadata.percent*0.08)));
      if(!zipBlob.size)throw new Error("The extracted image archive could not be created.");
      setResult(zipBlob);setCount(extracted);setProgress(100);setPhase("done");completeToolProcessing();
    }catch(error:any){failToolProcessing();setPhase("ready");toast({title:"Extraction failed",description:error?.message||"The embedded images could not be extracted safely.",variant:"destructive"});}
  };

  const archiveName=`${safeBaseName(outputName)}.zip`;

  return <ToolWorkspace title="Extract Images" description="Extract embedded raster images from a PDF. For full PDF pages, use PDF to PNG/JPG instead." accent="#EC4899">
    {phase==="upload"&&<div className="w-full">
      <div onClick={()=>inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onUpload(e);}} className="min-h-[240px] rounded-3xl border border-dashed border-black/10 bg-white/60 flex flex-col items-center justify-center cursor-pointer p-8 text-center shadow-sm hover:border-pink-400/60 transition-colors">
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onUpload}/>
        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-5"><ImageIcon className="w-8 h-8 text-pink-500"/></div>
        <h3 className="text-2xl font-black text-slate-950">Choose a PDF</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md">AJN PDF extracts embedded image objects. It does not screenshot every page or invent image assets.</p>
      </div>
    </div>}

    {phase==="ready"&&file&&<div className="grid lg:grid-cols-[1.2fr_.8fr] gap-7">
      <Card className="rounded-3xl p-5 border-black/5 bg-white/70 min-h-[380px] flex items-center justify-center overflow-hidden">
        {preview?<RuntimeImage src={preview} alt="PDF first page preview" className="max-h-[520px] w-auto shadow-lg"/>:<FileText className="w-14 h-14 text-slate-300"/>}
      </Card>
      <div className="space-y-5">
        <Card className="rounded-3xl p-6 border-black/5 bg-white/70 space-y-4">
          <div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Source</p><p className="font-bold text-slate-900 break-all">{file.name}</p><p className="text-sm text-slate-500">{fmtBytes(file.size)}</p></div>
          <div><label className="text-xs font-black uppercase tracking-wider text-slate-400">Archive name</label><input value={outputName} onChange={e=>setOutputName(e.target.value)} maxLength={90} className="mt-2 w-full h-11 rounded-xl border border-black/10 bg-white px-3 font-semibold outline-none focus:border-pink-400"/></div>
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4 text-xs leading-6 text-pink-950"><ShieldCheck className="inline w-4 h-4 mr-2"/>Embedded images are decoded by PDF.js and saved as PNG to avoid an additional lossy JPEG encode. Duplicate decoded assets are removed.</div>
        </Card>
        <Button onClick={()=>void extract()} className="w-full h-14 rounded-2xl font-black">Extract embedded images</Button>
        <Button variant="ghost" onClick={reset} className="w-full">Choose another PDF</Button>
      </div>
    </div>}

    {phase==="processing"&&<div className="py-20 max-w-xl mx-auto space-y-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto"><ImageIcon className="w-8 h-8 text-pink-500 animate-pulse"/></div>
      <h3 className="text-2xl font-black text-slate-950">Extracting real image objects</h3>
      <p className="text-sm text-slate-500">Reading PDF image resources, removing duplicates, and packaging PNG files.</p>
      <Progress value={progress}/><p className="text-xs font-bold text-slate-500">{progress}%</p>
    </div>}

    {phase==="done"&&result&&<div className="py-16 max-w-xl mx-auto space-y-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto"><ImageIcon className="w-8 h-8 text-emerald-600"/></div>
      <h3 className="text-3xl font-black text-slate-950">{count} image{count===1?"":"s"} extracted</h3>
      <p className="text-sm text-slate-500">The ZIP contains decoded embedded raster images as PNG. Full-page rendering is intentionally a separate PDF to PNG/JPG workflow.</p>
      <Button onClick={()=>dl(result,archiveName)} className="w-full h-14 rounded-2xl font-black"><Download className="w-4 h-4 mr-2"/>Download ZIP</Button>
      <Button variant="outline" onClick={reset} className="w-full"><RefreshCcw className="w-4 h-4 mr-2"/>Extract another PDF</Button>
    </div>}
  </ToolWorkspace>;
}
