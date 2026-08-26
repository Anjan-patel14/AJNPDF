"use client";

import React, { useState, useEffect } from "react";
import { engine } from "../../lib/engine";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Download } from "lucide-react";

/**
 * AJN Download Responsibility Notice
 * Professional dark-themed consent portal matching industrial specification.
 */
export function DownloadNoticeDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ blob: Blob, name: string } | null>(null);

  useEffect(() => {
    const handleRequest = (e: any) => {
      setPending(e.detail);
      setOpen(true);
    };
    window.addEventListener('show-download-notice', handleRequest);
    return () => window.removeEventListener('show-download-notice', handleRequest);
  }, []);

  const handleConfirm = () => {
    if (pending) {
      engine.download(pending.blob, pending.name);
    }
    setOpen(false);
    setPending(null);
  };

  const handleCancel = () => {
    setOpen(false);
    setPending(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[9999] p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#14171f] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] max-w-md w-full overflow-hidden"
          >
            <div className="p-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center border border-amber-500/20">
                <ShieldAlert className="w-10 h-10 text-amber-500" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                  Download Notice
                </h3>
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Files may be copyrighted, unsafe, or inaccurate.
                  </p>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                    Please scan before opening. By continuing, you accept full responsibility.
                  </p>
                </div>
              </div>

              <div className="flex w-full gap-4 pt-4">
                <button 
                  onClick={handleCancel}
                  className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-[2] h-14 bg-card text-card-foreground hover:bg-muted font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Continue
                </button>
              </div>
            </div>
            
            <div className="bg-white/[0.02] py-4 px-10 border-t border-white/5">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] text-center">
                AJN Security Protocol v1.2
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
