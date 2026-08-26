"use client";
import React,{useState} from "react";
import {ToolWorkspace,Drop,Btn,Done,Range,F,Pills,Info,Err,ToolFile,dl,T,beginToolProcessing,completeToolProcessing,failToolProcessing} from "./_shared";
import {convertImageFormat} from "./_imageUtils";

// Canvas export support is intentionally limited to formats browsers can verify
// consistently. BMP/HEIC/AVIF output belongs to the server conversion engine when
// a real encoder is available; AJN PDF never returns a renamed JPEG fallback.
const FMTS=[
  {label:"JPEG",value:"jpeg"},
  {label:"PNG",value:"png"},
  {label:"WebP",value:"webp"}];
const DESC:Record<string,string>={
  jpeg:"Best for photos. Smaller files with configurable lossy quality. Transparent areas are placed on white.",
  png:"Lossless output with transparency. Best for graphics, logos and screenshots.",
  webp:"Modern browser image format with strong compression and transparency support.",
};

export default function ConvertImage(){
  const [files,setF]=useState<ToolFile[]>([]);
  const [fmt,setFmt]=useState("jpeg");
  const [q,setQ]=useState(90);
  const [loading,setL]=useState(false);
  const [result,setR]=useState<Blob|null>(null);
  const [err,setE]=useState("");

  const run=async()=>{
    if(!files.length){setE("Upload an image.");return;}
    setE("");setL(true);beginToolProcessing("Convert image");
    try{
      const blob=await convertImageFormat(files[0].file,fmt,q);
      const expected=fmt==="jpeg"?"image/jpeg":`image/${fmt}`;
      if(!blob.size||blob.type!==expected) throw new Error(`Your browser could not create a valid ${fmt.toUpperCase()} image.`);
      setR(blob);completeToolProcessing();
    }catch(e:any){failToolProcessing();setE(e?.message||"The image could not be converted safely.");}
    finally{setL(false);}
  };

  const ext=fmt==="jpeg"?"jpg":fmt;
  const name=(files[0]?.name.replace(/\.[^.]+$/,"")||"converted")+"."+ext;

  return(<ToolWorkspace title="Convert Image" description="Convert images to verified JPEG, PNG or WebP output." accent={T.purple}>
    {result?<Done msg={`Converted to ${fmt.toUpperCase()}!`} dlLabel={`Download .${ext}`} onDownload={()=>dl(result,name)} shareFile={{blob:result,name}} onReset={()=>{setR(null);setF([]);setE("");}}/>
    :<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Drop files={files} onChange={setF} accept=".jpg,.jpeg,.png,.webp,.bmp,.gif,.tif,.tiff" label="Drop image to convert" sub="JPG, PNG, WebP, BMP, GIF and TIFF inputs"/>
      <F label="Convert to"><Pills opts={FMTS} val={fmt} onChange={(v:any)=>setFmt(v)}/></F>
      <Info bg="#F5F3FF" col="#5B21B6">{DESC[fmt]}</Info>
      {fmt!=="png"&&<Range label="Quality" value={q} min={10} max={100} step={5} onChange={setQ} fmt={v=>`${v}%`}/>}
      {files.length>0&&<div style={{fontSize:13,color:T.gray,fontWeight:500}}><strong>{files[0].name}</strong> → <strong>{name}</strong></div>}
      <Err msg={err}/>
      <Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:T.purple}}>🔀 Convert to {fmt.toUpperCase()}</Btn>
    </div>}
  </ToolWorkspace>);
}
