"use client";

import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { RuntimeImage } from "@/components/ui/runtime-image";
import { ToolWorkspace, Drop, Btn, Done, Err, F, G2, IS, Info, ToolFile, dl, fmtBytes, withProcessingActivity, updateToolProcessing } from "./_shared";
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { hasPdfHeader, safeOutputName, validateFiles } from "@/lib/file-validation";

type Margins = { top:number; bottom:number; left:number; right:number };

export default function CropPdf() {
  const [files,setFiles]=useState<ToolFile[]>([]);
  const [preview,setPreview]=useState("");
  const [pageSize,setPageSize]=useState({width:595,height:842});
  const [margins,setMargins]=useState<Margins>({top:0,bottom:0,left:0,right:0});
  const [outputName,setOutputName]=useState("cropped.pdf");
  const [result,setResult]=useState<Blob|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    let cancelled=false;
    if(!files.length){setPreview("");return;}
    const file=files[0].file;
    setOutputName(`${file.name.replace(/\.pdf$/i,"")}-cropped.pdf`);
    void (async()=>{
      try{
        initPdfWorker();
        const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
        const page=await pdf.getPage(1);
        const logical=page.getViewport({scale:1});
        const display=page.getViewport({scale:Math.min(1.15,760/Math.max(logical.width,1))});
        const canvas=document.createElement("canvas");
        const ctx=canvas.getContext("2d");
        if(!ctx) throw new Error("Preview is unavailable on this device.");
        canvas.width=Math.max(1,Math.ceil(display.width));canvas.height=Math.max(1,Math.ceil(display.height));
        await page.render({canvasContext:ctx,viewport:display}).promise;
        if(!cancelled){setPageSize({width:logical.width,height:logical.height});setPreview(canvas.toDataURL("image/jpeg",.86));setError("");}
      }catch(e:any){if(!cancelled)setError(e.message||"A preview could not be created for this PDF.");}
    })();
    return()=>{cancelled=true;};
  },[files]);

  const setMargin=(key:keyof Margins,value:number)=>setMargins(current=>({...current,[key]:Math.max(0,Number.isFinite(value)?value:0)}));
  const run=async()=>{
    const validation=validateFiles(files.map(x=>x.file),{extensions:[".pdf"],minFiles:1,maxFiles:1,maxSizeMb:50});
    if(validation){setError(validation);return;}
    if(!(await hasPdfHeader(files[0].file))){setError("Choose a valid PDF file.");return;}
    setError("");setLoading(true);
    try{
      const blob=await withProcessingActivity("Crop PDF",async()=>{
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer(),{ignoreEncryption:true});
        const pages=doc.getPages();
        pages.forEach((page,index)=>{
          const {width,height}=page.getSize();
          const left=Math.min(margins.left,Math.max(0,width-1));
          const right=Math.min(margins.right,Math.max(0,width-left-1));
          const bottom=Math.min(margins.bottom,Math.max(0,height-1));
          const top=Math.min(margins.top,Math.max(0,height-bottom-1));
          const cropWidth=width-left-right; const cropHeight=height-top-bottom;
          if(cropWidth<=0||cropHeight<=0) throw new Error(`Crop margins are too large for page ${index+1}.`);
          page.setCropBox(left,bottom,cropWidth,cropHeight);
          updateToolProcessing(Math.round(((index+1)/pages.length)*100),`Cropping page ${index+1} of ${pages.length}`);
        });
        const bytes=await doc.save();
        const outputBuffer=new ArrayBuffer(bytes.byteLength);
        new Uint8Array(outputBuffer).set(bytes);
        return new Blob([outputBuffer],{type:"application/pdf"});
      });
      setResult(blob);
    }catch(e:any){setError(e.message||"The PDF could not be cropped.");}
    finally{setLoading(false);}
  };
  const name=safeOutputName(outputName,"cropped",".pdf");
  const overlay={
    top:`${Math.min(49,(margins.top/pageSize.height)*100)}%`,
    bottom:`${Math.min(49,(margins.bottom/pageSize.height)*100)}%`,
    left:`${Math.min(49,(margins.left/pageSize.width)*100)}%`,
    right:`${Math.min(49,(margins.right/pageSize.width)*100)}%`,
  };

  return <ToolWorkspace title="Crop PDF" description="Trim PDF page margins with a clear preview" accent="#F59E0B">
    {result?<Done msg="PDF cropped" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setResult(null);setFiles([]);setMargins({top:0,bottom:0,left:0,right:0});setError("");}}/>:<div className="space-y-4">
      <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Choose a PDF" sub="One PDF · maximum 50 MB" />
      {files[0]&&<Info><strong>{files[0].name}</strong> · {fmtBytes(files[0].size)}. Margins are applied to every page and automatically clamped to each page size.</Info>}
      {preview&&<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="relative max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><RuntimeImage src={preview} alt="First PDF page crop preview" className="max-h-[560px] max-w-full object-contain"/><div className="pointer-events-none absolute border-2 border-amber-500/80 bg-amber-500/[.04]" style={overlay}/></div></div>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div><p className="text-sm font-black text-slate-950">Crop margins</p><p className="mt-1 text-xs font-medium leading-5 text-slate-500">Enter points to trim from each edge. The preview uses the real first-page dimensions.</p></div><G2><F label="Top (pt)"><input style={IS} type="number" min={0} value={margins.top} onChange={e=>setMargin("top",+e.target.value)}/></F><F label="Bottom (pt)"><input style={IS} type="number" min={0} value={margins.bottom} onChange={e=>setMargin("bottom",+e.target.value)}/></F><F label="Left (pt)"><input style={IS} type="number" min={0} value={margins.left} onChange={e=>setMargin("left",+e.target.value)}/></F><F label="Right (pt)"><input style={IS} type="number" min={0} value={margins.right} onChange={e=>setMargin("right",+e.target.value)}/></F></G2><F label="Output filename"><input style={IS} value={outputName} onChange={e=>setOutputName(e.target.value)}/></F></div>
      </div>}
      <Err msg={error}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#F59E0B"}}>Crop PDF</Btn>
    </div>}
  </ToolWorkspace>;
}
