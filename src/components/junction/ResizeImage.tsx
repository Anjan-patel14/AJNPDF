"use client";

import React,{useEffect,useState} from "react";
import {RuntimeImage} from "@/components/ui/runtime-image";
import {ToolWorkspace,Drop,Btn,Done,Err,F,G2,IS,Pills,ToolFile,dl,withProcessingActivity} from "./_shared";
import {resizeImage} from "./_imageUtils";
import {preferredImageExtension,safeImageOutputName} from "@/lib/image-output";

const PRESETS=[
  {label:"HD 720p",value:"1280x720"},{label:"Full HD",value:"1920x1080"},
  {label:"Square",value:"1080x1080"},{label:"Thumbnail",value:"300x300"}];

export default function ResizeImage(){
  const [files,setFiles]=useState<ToolFile[]>([]);
  const [width,setWidth]=useState(800);const [height,setHeight]=useState(600);
  const [keepAspect,setKeepAspect]=useState(true);const [preview,setPreview]=useState("");
  const [outputName,setOutputName]=useState("resized.png");const [result,setResult]=useState<Blob|null>(null);
  const [loading,setLoading]=useState(false);const [error,setError]=useState("");

  useEffect(()=>{
    if(!files.length){setPreview("");return;}
    const file=files[0].file;const url=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{setWidth(img.naturalWidth);setHeight(img.naturalHeight);setOutputName(`${files[0].name.replace(/\.[^/.]+$/,"")}-resized${preferredImageExtension(file)}`);};
    img.src=url;setPreview(url);return()=>URL.revokeObjectURL(url);
  },[files]);

  const run=async()=>{if(!files.length)return;setError("");setLoading(true);try{setResult(await withProcessingActivity("Resize image",()=>resizeImage(files[0].file,width,height,keepAspect)));}catch(e:any){setError(e?.message||"The image could not be resized.");}finally{setLoading(false);}};
  const name=result?safeImageOutputName(outputName,"resized",result):outputName;

  return <ToolWorkspace title="Resize Image" description="Resize an image while keeping the downloaded file format truthful." accent="#2563EB">
    {result?<Done msg="Image resized" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setResult(null);setFiles([]);setError("");}}/>:<div className="space-y-4">
      <Drop files={files} onChange={setFiles} accept=".jpg,.jpeg,.png,.webp,.bmp" label="Choose an image" sub="JPG, PNG, WEBP or BMP"/>
      {preview&&<div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4"><RuntimeImage src={preview} alt="Selected image preview" className="max-h-[360px] max-w-full rounded-lg object-contain"/></div>}
      <F label="Quick sizes"><Pills opts={PRESETS} val={`${width}x${height}`} onChange={v=>{const [w,h]=String(v).split("x").map(Number);setWidth(w);setHeight(h);setKeepAspect(false);}}/></F>
      <G2><F label="Width (px)"><input style={IS} type="number" min={1} max={12000} value={width} onChange={e=>setWidth(Math.max(1,+e.target.value||1))}/></F><F label="Height (px)"><input style={IS} type="number" min={1} max={12000} value={height} onChange={e=>setHeight(Math.max(1,+e.target.value||1))}/></F></G2>
      <label className="jn-file-pill"><input type="checkbox" checked={keepAspect} onChange={e=>setKeepAspect(e.target.checked)}/><span className="text-xs font-bold text-slate-700">Keep original proportions</span></label>
      <F label="Output filename"><input style={IS} value={outputName} onChange={e=>setOutputName(e.target.value)}/></F>
      <Err msg={error}/><Btn onClick={run} loading={loading} disabled={!files.length} full>Resize image</Btn>
    </div>}
  </ToolWorkspace>;
}
