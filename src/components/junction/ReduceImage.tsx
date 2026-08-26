"use client";

import React, { useEffect, useState } from "react";
import { RuntimeImage } from "@/components/ui/runtime-image";
import { ToolWorkspace, Drop, Btn, Done, Err, F, G2, IS, Info, Pills, Range, ToolFile, dl, fmtBytes, withProcessingActivity } from "./_shared";
import { compressImage } from "./_imageUtils";
import { safeOutputName } from "@/lib/file-validation";

export default function ReduceImage() {
  const [files,setFiles]=useState<ToolFile[]>([]); const [quality,setQuality]=useState(70); const [format,setFormat]=useState<"jpeg"|"png"|"webp">("jpeg");
  const [preview,setPreview]=useState(""); const [outputName,setOutputName]=useState("compressed.jpg"); const [result,setResult]=useState<Blob|null>(null);
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{if(!files.length){setPreview("");return;}const url=URL.createObjectURL(files[0].file);setPreview(url);setOutputName(`${files[0].name.replace(/\.[^/.]+$/,"")}-compressed.${format==="jpeg"?"jpg":format}`);return()=>URL.revokeObjectURL(url);},[files,format]);
  const run=async()=>{if(!files.length)return;setError("");setLoading(true);try{setResult(await withProcessingActivity("Reduce image size",()=>compressImage(files[0].file,quality,format)));}catch(e:any){setError(e.message||"The image could not be compressed.");}finally{setLoading(false);}};
  const ext=format==="jpeg"?".jpg":`.${format}`; const name=safeOutputName(outputName,"compressed-image",ext); const saved=result&&files[0]?files[0].size-result.size:0;
  return <ToolWorkspace title="Reduce Image" description="Reduce image file size with adjustable quality" accent="#E8380D">
    {result?<div className="space-y-3">{files[0]&&<Info><strong>{fmtBytes(files[0].size)}</strong> → <strong>{fmtBytes(result.size)}</strong>{saved>0?` · ${fmtBytes(saved)} saved`:""}</Info>}<Done msg="Image optimized" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setResult(null);setFiles([]);setError("");}}/></div>:<div className="space-y-4">
      <Drop files={files} onChange={setFiles} accept=".jpg,.jpeg,.png,.webp,.bmp" label="Choose an image" sub="JPG, PNG, WEBP or BMP" />
      {preview&&<div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4"><RuntimeImage src={preview} alt="Selected image preview" className="max-min-h-[210px] max-w-full rounded-lg object-contain" /></div>}
      <Range label="Quality" value={quality} min={10} max={100} step={5} onChange={setQuality} fmt={v=>`${v}%`}/>
      <G2><F label="Output format"><Pills opts={[{label:"JPG",value:"jpeg"},{label:"PNG",value:"png"},{label:"WEBP",value:"webp"}]} val={format} onChange={setFormat}/></F><F label="Output filename"><input style={IS} value={outputName} onChange={e=>setOutputName(e.target.value)}/></F></G2>
      <Err msg={error}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#E8380D"}}>Reduce image size</Btn>
    </div>}
  </ToolWorkspace>;
}
