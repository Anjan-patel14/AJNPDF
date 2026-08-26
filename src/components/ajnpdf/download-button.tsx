"use client";

import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface DownloadButtonProps {
  onClick: () => void;
  fileName: string;
  fileSize?: string;
  className?: string;
  label?: string;
}

export function DownloadButton({ 
  onClick, 
  fileName, 
  fileSize, 
  className,
  label = "Download PDF"
}: DownloadButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("w-full max-w-md", className)}
    >
      <Button
        onClick={onClick}
        className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-tighter rounded-2xl shadow-xl transition-all duration-300 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="flex items-center justify-between w-full px-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="block font-black">{label}</span>
              <span className="text-[10px] text-white/60 font-mono mt-1 block truncate max-w-[180px]">
                {fileName}
              </span>
            </div>
          </div>
          
          {fileSize && (
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">file size</span>
              <span className="font-mono text-sm font-bold">{fileSize}</span>
            </div>
          )}
        </div>
      </Button>
      
      <div className="flex items-center justify-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Download prepared in this session</span>
      </div>
    </motion.div>
  );
}
