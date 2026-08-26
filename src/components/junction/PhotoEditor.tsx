"use client";

import React,{useEffect,useMemo,useState} from "react";
import {RuntimeImage} from "@/components/ui/runtime-image";
import {Button} from "../ui/button";
import {Card} from "../ui/card";
import {Label} from "../ui/label";
import {Activity,CheckCircle2,Download,FlipHorizontal,FlipVertical,RefreshCcw,RotateCw,Share2,SlidersHorizontal,Zap} from "lucide-react";
import {ToolWorkspace,Drop,Range,ToolFile,dl,fmtBytes,shareResult,beginToolProcessing,completeToolProcessing,failToolProcessing,T,Err} from "./_shared";
import {editPhotoQuality} from "./_photoEditorQuality";
import {safeImageOutputName} from "@/lib/image-output";

const FILTERS=[
  {v:"none",l:"None"},{v:"grayscale",l:"Grayscale"},{v:"sepia",l:"Sepia"},
  {v:"invert",l:"Invert"},{v:"warm",l:"Warm"},{v:"cool",l:"Cool"}];

const DEFAULTS={brightness:1,contrast:1,saturation:1,exposure:0,filter:"none",rotation:0,flipH:false,flipV:false};

export default function PhotoEditor(){
  const [files,setFiles]=useState<ToolFile[]>([]);
  const [settings,setSettings]=useState({...DEFAULTS});
  const [preview,setPreview]=useState("");
  const [result,setResult]=useState<Blob|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!files.length){setPreview("");return;}
    const url=URL.createObjectURL(files[0].file);setPreview(url);return()=>URL.revokeObjectURL(url);
  },[files]);

  const cssFilter=useMemo(()=>{
    const filterExtra=settings.filter==="grayscale"?"grayscale(100%)":settings.filter==="sepia"?"sepia(100%)":settings.filter==="invert"?"invert(100%)":settings.filter==="warm"?"sepia(18%) saturate(1.15)":settings.filter==="cool"?"hue-rotate(8deg) saturate(1.05)":"";
    const exposureBrightness=Math.max(.1,1+settings.exposure/220);
    return `brightness(${settings.brightness*exposureBrightness}) contrast(${settings.contrast}) saturate(${settings.saturation}) ${filterExtra}`;
  },[settings]);

  const outputName=result?safeImageOutputName(`${files[0]?.name.replace(/\.[^/.]+$/,"")||"edited"}-edited`,"edited-photo",result):"edited-photo.png";

  const run=async()=>{
    if(!files.length){setError("Upload an image.");return;}
    setError("");setLoading(true);beginToolProcessing("Photo Editor");
    try{const blob=await editPhotoQuality(files[0].file,settings);setResult(blob);completeToolProcessing();}
    catch(e:any){failToolProcessing();setError(e?.message||"The edited image could not be created.");}
    finally{setLoading(false);}
  };

  const resetAll=()=>{setFiles([]);setSettings({...DEFAULTS});setResult(null);setError("");};

  if(result){
    return <ToolWorkspace title="Photo Editor" description="Real local photo adjustments that are applied to the downloaded pixels." accent={T.pink}>
      <div className="mx-auto max-w-xl space-y-6 py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50"><CheckCircle2 className="h-10 w-10 text-emerald-600"/></div>
        <div><h3 className="text-3xl font-black text-slate-950">Edited image ready</h3><p className="mt-2 text-sm text-slate-500">All visible colour and transform controls were rendered into the output.</p></div>
        <Card className="rounded-2xl border-black/5 p-5 text-left"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Output</p><p className="mt-1 font-bold">{outputName}</p><p className="text-sm text-slate-500">{fmtBytes(result.size)} · {result.type}</p></Card>
        <Button className="h-14 w-full rounded-2xl font-black" onClick={()=>dl(result,outputName)}><Download className="mr-2 h-4 w-4"/>Download edited image</Button>
        <Button variant="outline" className="w-full rounded-2xl" onClick={()=>void shareResult(result,outputName)}><Share2 className="mr-2 h-4 w-4"/>Share result</Button>
        <Button variant="ghost" className="w-full" onClick={resetAll}><RefreshCcw className="mr-2 h-4 w-4"/>Edit another image</Button>
      </div>
    </ToolWorkspace>;
  }

  return <ToolWorkspace title="Photo Editor" description="Adjust image colour and transforms locally; every visible control affects the final download." accent={T.pink}>
    <div className="space-y-6">
      <Drop files={files} onChange={setFiles} accept=".jpg,.jpeg,.png,.webp,.bmp" label="Choose an image" sub="JPG, PNG, WEBP or BMP"/>
      {files.length>0&&<div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border-black/5 bg-slate-950/5 p-8">
          {preview&&<div style={{filter:cssFilter,transform:`rotate(${settings.rotation}deg) scaleX(${settings.flipH?-1:1}) scaleY(${settings.flipV?-1:1})`}} className="transition-all duration-200"><RuntimeImage src={preview} alt="Edited image preview" className="max-h-[520px] max-w-full rounded-lg object-contain shadow-xl"/></div>}
        </Card>
        <div className="space-y-5">
          <Card className="rounded-3xl border-black/5 p-6">
            <div className="mb-5 flex items-center gap-2"><Activity className="h-4 w-4 text-pink-500"/><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Source</p><p className="max-w-[260px] truncate font-bold">{files[0].name}</p><p className="text-xs text-slate-400">{fmtBytes(files[0].size)}</p></div></div>
            <div className="space-y-5"><Range label="Brightness" value={Math.round(settings.brightness*100)} min={10} max={250} step={5} onChange={v=>setSettings(s=>({...s,brightness:v/100}))} fmt={v=>`${v}%`}/><Range label="Contrast" value={Math.round(settings.contrast*100)} min={50} max={200} step={5} onChange={v=>setSettings(s=>({...s,contrast:v/100}))} fmt={v=>`${v}%`}/><Range label="Saturation" value={Math.round(settings.saturation*100)} min={0} max={200} step={5} onChange={v=>setSettings(s=>({...s,saturation:v/100}))} fmt={v=>`${v}%`}/><Range label="Exposure" value={settings.exposure} min={-100} max={100} step={5} onChange={v=>setSettings(s=>({...s,exposure:v}))} fmt={v=>v>0?`+${v}`:`${v}`}/></div>
          </Card>
          <Card className="rounded-3xl border-black/5 p-6"><div className="mb-3 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-pink-500"/><Label className="text-xs font-black uppercase tracking-wider text-slate-500">Filter</Label></div><div className="grid grid-cols-3 gap-2">{FILTERS.map(filter=><button key={filter.v} type="button" onClick={()=>setSettings(s=>({...s,filter:filter.v}))} className={`rounded-xl px-2 py-3 text-xs font-bold transition ${settings.filter===filter.v?"bg-pink-500 text-white shadow":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{filter.l}</button>)}</div></Card>
          <Card className="rounded-3xl border-black/5 p-6"><Label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">Transform</Label><div className="grid grid-cols-3 gap-2"><Button variant="outline" onClick={()=>setSettings(s=>({...s,rotation:(s.rotation+90)%360}))}><RotateCw className="h-4 w-4"/></Button><Button variant={settings.flipH?"default":"outline"} onClick={()=>setSettings(s=>({...s,flipH:!s.flipH}))}><FlipHorizontal className="h-4 w-4"/></Button><Button variant={settings.flipV?"default":"outline"} onClick={()=>setSettings(s=>({...s,flipV:!s.flipV}))}><FlipVertical className="h-4 w-4"/></Button></div></Card>
          <div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={()=>setSettings({...DEFAULTS})}>Reset controls</Button><Button className="h-14 flex-[2] rounded-2xl font-black" disabled={loading} onClick={run}>{loading?"Processing…":<><Zap className="mr-2 h-4 w-4"/>Save image</>}</Button></div>
          <Err msg={error}/>
        </div>
      </div>}
    </div>
  </ToolWorkspace>;
}
