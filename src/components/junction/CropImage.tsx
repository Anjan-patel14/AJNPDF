"use client";
import React,{useState} from "react";
import {ToolWorkspace,Drop,Btn,Done,G2,F,Info,Err,IS,ToolFile,dl,beginToolProcessing,completeToolProcessing,failToolProcessing} from "./_shared";
import {cropImage} from "./_imageUtils";
import {safeImageOutputName} from "@/lib/image-output";

export default function CropImage(){
  const [files,setF]=useState<ToolFile[]>([]);const [x,setX]=useState(0);const [y,setY]=useState(0);
  const [w,setW]=useState(400);const [h,setH]=useState(300);const [loading,setL]=useState(false);
  const [result,setR]=useState<Blob|null>(null);const [err,setE]=useState("");
  const run=async()=>{if(!files.length){setE("Upload an image.");return;}setE("");setL(true);beginToolProcessing("Crop image");try{setR(await cropImage(files[0].file,x,y,w,h));completeToolProcessing();}catch(e:any){failToolProcessing();setE(e?.message||"The image could not be cropped.");}finally{setL(false);}};
  const name=result?safeImageOutputName(`cropped_${files[0]?.name||"image"}`,"cropped-image",result):"cropped-image.png";
  return <ToolWorkspace title="Crop Image" description="Cut out a specific rectangular region without returning a mismatched file format." accent="#D97706">
    {result?<Done msg="Image cropped!" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setR(null);setF([]);setE("");}}/>:<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Drop files={files} onChange={setF} accept=".jpg,.jpeg,.png,.webp,.bmp"/>
      <G2><F label="X — left offset (px)"><input style={IS} type="number" min={0} value={x} onChange={e=>setX(+e.target.value)}/></F><F label="Y — top offset (px)"><input style={IS} type="number" min={0} value={y} onChange={e=>setY(+e.target.value)}/></F><F label="Crop width (px)"><input style={IS} type="number" min={1} value={w} onChange={e=>setW(+e.target.value)}/></F><F label="Crop height (px)"><input style={IS} type="number" min={1} value={h} onChange={e=>setH(+e.target.value)}/></F></G2>
      <Info bg="#FFFBEB" col="#92400E">X=0, Y=0 is the top-left corner. Out-of-bounds crop values are safely clipped to the image.</Info>
      <Err msg={err}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#D97706"}}>Crop image</Btn>
    </div>}
  </ToolWorkspace>;
}
