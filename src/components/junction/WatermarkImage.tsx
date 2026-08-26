"use client";
import React,{useState} from "react";
import {ToolWorkspace,Drop,Btn,Done,Range,F,G2,Err,IS,SS,ToolFile,dl,T,beginToolProcessing,completeToolProcessing,failToolProcessing} from "./_shared";
import {watermarkImage} from "./_imageUtils";
import {safeImageOutputName} from "@/lib/image-output";
const POSITIONS=["top-left","top-center","top-right","center","bottom-left","bottom-center","bottom-right"];
export default function WatermarkImage(){
  const [files,setF]=useState<ToolFile[]>([]);const [text,setT]=useState("© My Brand");
  const [opacity,setOp]=useState(0.6);const [size,setSize]=useState(40);const [color,setColor]=useState("#ffffff");
  const [pos,setPos]=useState("bottom-center");const [loading,setL]=useState(false);
  const [result,setR]=useState<Blob|null>(null);const [err,setE]=useState("");
  const run=async()=>{if(!files.length){setE("Upload an image.");return;}if(!text.trim()){setE("Enter watermark text.");return;}setE("");setL(true);beginToolProcessing("Watermark image");try{setR(await watermarkImage(files[0].file,text,opacity,size,color,pos));completeToolProcessing();}catch(e:any){failToolProcessing();setE(e?.message||"The watermark could not be applied.");}finally{setL(false);}};
  const name=result?safeImageOutputName(`watermarked_${files[0]?.name||"image"}`,"watermarked-image",result):"watermarked-image.png";
  return <ToolWorkspace title="Watermark Image" description="Add a real rendered brand or copyright text watermark to an image." accent="#06B6D4">
    {result?<Done msg="Watermark added!" onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setR(null);setF([]);setE("");}}/>:<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Drop files={files} onChange={setF} accept=".jpg,.jpeg,.png,.webp,.bmp"/>
      <F label="Watermark text"><input style={IS} value={text} onChange={e=>setT(e.target.value)} placeholder="© Your Brand"/></F>
      <G2><Range label="Opacity" value={Math.round(opacity*100)} min={10} max={100} step={5} onChange={v=>setOp(v/100)} fmt={v=>`${v}%`}/><Range label="Font size (px)" value={size} min={12} max={120} step={4} onChange={setSize}/></G2>
      <G2><F label="Text color"><input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:"100%",height:40,borderRadius:8,border:`1.5px solid ${T.border}`,cursor:"pointer",padding:2}}/></F><F label="Position"><select style={SS} value={pos} onChange={e=>setPos(e.target.value)}>{POSITIONS.map(p=><option key={p} value={p}>{p.split("-").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ")}</option>)}</select></F></G2>
      <Err msg={err}/><Btn onClick={run} loading={loading} disabled={!files.length||!text.trim()} full style={{background:"#06B6D4"}}>Add Watermark</Btn>
    </div>}
  </ToolWorkspace>;
}
