"use client";

import React,{useEffect,useState} from "react";
import {RuntimeImage} from "@/components/ui/runtime-image";
import {ToolWorkspace,Drop,Btn,Done,Err,F,IS,Range,ToolFile,dl,withProcessingActivity} from "./_shared";
import {makeMeme} from "./_imageUtils";
import {preferredImageExtension,safeImageOutputName} from "@/lib/image-output";

export default function MemeMaker(){
  const [files,setFiles]=useState<ToolFile[]>([]);const [top,setTop]=useState("WHEN YOU FINALLY FIX THE BUG");const [bottom,setBottom]=useState("BUT CREATE 3 MORE");
  const [fontSize,setFontSize]=useState(0);const [outputName,setOutputName]=useState("meme.jpg");const [preview,setPreview]=useState("");
  const [result,setResult]=useState<Blob|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{if(!files.length){setPreview("");return;}const file=files[0].file;const url=URL.createObjectURL(file);setPreview(url);setOutputName(`${files[0].name.replace(/\.[^/.]+$/,"")}-meme${preferredImageExtension(file)}`);return()=>URL.revokeObjectURL(url);},[files]);
  const run=async()=>{if(!files.length)return;setError("");setLoading(true);try{setResult(await withProcessingActivity("Create meme",()=>makeMeme(files[0].file,top,bottom,fontSize)));}catch(e:any){setError(e?.message||"The meme could not be created.");}finally{setLoading(false);}};
  const name=result?safeImageOutputName(outputName,"meme",result):outputName;
  return <ToolWorkspace title="Meme Maker" description="Add readable top and bottom captions without changing the file format behind the filename." accent="#F59E0B">
    {result?<Done msg="Meme created" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setResult(null);setFiles([]);setError("");}}/>:<div className="space-y-4">
      <Drop files={files} onChange={setFiles} accept=".jpg,.jpeg,.png,.webp,.bmp,.gif" label="Choose an image" sub="JPG, PNG, WEBP, BMP or GIF"/>
      {preview&&<div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4"><RuntimeImage src={preview} alt="Selected image preview" className="max-h-[360px] max-w-full rounded-lg object-contain"/></div>}
      <div className="grid gap-3 sm:grid-cols-2"><F label="Top caption"><input style={IS} value={top} onChange={e=>setTop(e.target.value)}/></F><F label="Bottom caption"><input style={IS} value={bottom} onChange={e=>setBottom(e.target.value)}/></F></div>
      <Range label="Caption size" value={fontSize} min={0} max={96} step={4} onChange={setFontSize} fmt={v=>v===0?"Auto":`${v}px`}/>
      <F label="Output filename"><input style={IS} value={outputName} onChange={e=>setOutputName(e.target.value)}/></F>
      <Err msg={error}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#F59E0B"}}>Create meme</Btn>
    </div>}
  </ToolWorkspace>;
}
