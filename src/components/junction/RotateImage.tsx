"use client";
import React,{useState} from "react";
import {ToolWorkspace,Drop,Btn,Done,Range,F,Pills,Err,ToolFile,dl,beginToolProcessing,completeToolProcessing,failToolProcessing} from "./_shared";
import {rotateImage} from "./_imageUtils";
import {safeImageOutputName} from "@/lib/image-output";

export default function RotateImage(){
  const [files,setF]=useState<ToolFile[]>([]);const [mode,setMode]=useState<"preset"|"custom">("preset");
  const [deg,setD]=useState(90);const [custom,setC]=useState(45);const [loading,setL]=useState(false);
  const [result,setR]=useState<Blob|null>(null);const [err,setE]=useState("");
  const final=mode==="custom"?custom:deg;
  const run=async()=>{if(!files.length){setE("Upload an image.");return;}setE("");setL(true);beginToolProcessing("Rotate image");try{setR(await rotateImage(files[0].file,final));completeToolProcessing();}catch(e:any){failToolProcessing();setE(e?.message||"The image could not be rotated.");}finally{setL(false);}};
  const name=result?safeImageOutputName(`rotated_${files[0]?.name||"image"}`,"rotated-image",result):"rotated-image.png";
  return <ToolWorkspace title="Rotate Image" description="Turn images left, right, or by any custom angle with real rendered pixels." accent="#059669">
    {result?<Done msg="Image rotated!" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setR(null);setF([]);setE("");}}/>:<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Drop files={files} onChange={setF} accept=".jpg,.jpeg,.png,.webp,.bmp"/>
      <F label="Rotation"><Pills opts={[{label:"Preset",value:"preset"},{label:"Custom",value:"custom"}]} val={mode} onChange={(v:any)=>setMode(v)}/></F>
      {mode==="preset"?<Pills opts={[{label:"90° left",value:-90},{label:"90° right",value:90},{label:"180°",value:180},{label:"270°",value:270}]} val={deg} onChange={(v:any)=>setD(v)}/>:<Range label="Custom angle" value={custom} min={1} max={359} step={1} onChange={setC} fmt={v=>`${v}°`}/>}
      <Err msg={err}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#059669"}}>Rotate {final}°</Btn>
    </div>}
  </ToolWorkspace>;
}
