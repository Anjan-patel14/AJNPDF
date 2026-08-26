"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';
import { LogoAnimation } from './landing/logo-animation';

const brandSteps = [
  "Starting safe session...",
  "Setting up tools...",
  "Loading file...",
  "Almost ready..."
];

export function PlatformLoader({ 
  message, 
  onComplete 
}: { 
  message?: string, 
  onComplete?: () => void 
}) {
  const [percent, setPercent] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const interval = setInterval(() => {
      setPercent(prev => {
        const next = prev + (100 / 25); 
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 150);
          return 100;
        }
        
        if (next > 25 && next < 50) setTextIndex(1);
        if (next > 50 && next < 75) setTextIndex(2);
        if (next > 75) setTextIndex(3);
        
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#9fb7c6] bg-[linear-gradient(to_bottom,#9fb7c6_0%,#c7d3db_30%,#e6e2dc_60%,#d8cfc4_100%)]">
      <div className="flex flex-col items-center w-full max-sm px-10 gap-10">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key="loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center w-full gap-8"
          >
            <div className="relative">
              <LogoAnimation className="w-32 h-16 md:w-48 md:h-24" showGlow={false} />
            </div>

            <div className="w-full space-y-6 flex flex-col items-center">
              <div className="w-full h-1.5 bg-black/5 rounded-lg overflow-hidden shadow-inner border border-black/5 p-0.5">
                <motion.div 
                  className="h-full bg-primary rounded-md shadow-[0_0_20px_rgba(30,58,138,0.4)]"
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "tween", ease: "linear" }}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 text-[10px] md:text-[11px] font-black text-slate-900 tracking-[0.2em] uppercase italic text-center min-h-[1.5em]">
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                  <span>{message || brandSteps[textIndex]}</span>
                </div>
                <div className="flex items-center gap-4 opacity-40">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Private</span>
                  </div>
                  <div className="w-1 h-1.5 rounded-sm bg-slate-900" />
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Fast</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}