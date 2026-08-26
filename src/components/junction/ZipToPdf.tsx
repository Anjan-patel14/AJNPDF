
"use client";
import React,{useState} from "react";
import {ToolWorkspace,Drop,Btn,Done,Info,Err,ToolFile,dl,beginToolProcessing,completeToolProcessing,failToolProcessing} from "./_shared";
import {imagesToPdf,zipToPdfs,mergePdfs} from "./_pdfUtils";
export default function ZipToPdf(){
  const [files,setF]=useState<ToolFile[]>([]);const [loading,setL]=useState(false);
  const [result,setR]=useState<Blob|null>(null);const [err,setE]=useState("");
  const run=async()=>{if(!files.length){setE("Upload a ZIP file.");return;}setE("");setL(true);beginToolProcessing("ZIP to PDF");
    try{const ex=await zipToPdfs(files[0].file);const imgs=ex.filter(f=>/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f.name));
      const pdfs=ex.filter(f=>/\.pdf$/i.test(f.name));let blob:Blob;
      if(imgs.length&&!pdfs.length)blob=await imagesToPdf(imgs);
      else if(pdfs.length&&!imgs.length)blob=pdfs.length===1?new Blob([await pdfs[0].arrayBuffer()],{type:"application/pdf"}):await mergePdfs(pdfs);
      else if(imgs.length&&pdfs.length){const ip=await imagesToPdf(imgs);blob=await mergePdfs([...pdfs,new File([ip],"imgs.pdf",{type:"application/pdf"})]);}
      else throw new Error("ZIP contains no supported image or PDF files.");
      setR(blob);completeToolProcessing();}catch(e:any){failToolProcessing();setE(e.message || "The ZIP could not be converted.");}setL(false);};
  return(<ToolWorkspace title="ZIP to PDF" description="Create a PDF from images stored in a ZIP archive" accent="#6B7280">
    {result?<Done msg="ZIP converted to PDF!" onDownload={()=>dl(result,"from_zip.pdf")} shareFile={{blob:result,name:"from_zip.pdf"}} onReset={()=>{setR(null);setF([]);}}/>
    :<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Drop files={files} onChange={setF} accept=".zip" label="Drop ZIP file here" sub="ZIP should contain JPG, PNG, or PDF files"/>
      <Info>Supported: <strong>JPG/PNG</strong> (each to one page); <strong>PDF</strong> files (merged). Mixed ZIPs supported.</Info>
      <Err msg={err}/><Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:"#6B7280"}}>Convert ZIP to PDF</Btn>
    </div>}
  </ToolWorkspace>);
}
