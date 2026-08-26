'use client';

import React, { useState, useRef } from 'react';
import { ToolWorkspaceClient } from './tool-workspace-client';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { cn } from '../../lib/utils';
import { Zap } from 'lucide-react';

interface ToolWorkspaceProps {
  defaultCategory?: string;
}

function LiquidWorkspaceCard({ tool, onClick }: { tool: any; onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--x", x + "%");
    cardRef.current.style.setProperty("--y", y + "%");
    const rotateX = (y - 50) / 12;
    const rotateY = (50 - x) / 12;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  const IconComponent = tool.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="liquid-card cursor-pointer group"
    >
      <div className="flex flex-col items-center gap-4 p-8 text-center relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-lg border border-black/5 transition-all duration-500 group-hover:scale-110",
          tool.color
        )}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-900 leading-tight">{tool.name}</span>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ToolWorkspace({ defaultCategory = 'Document' }: ToolWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categoryMap: Record<string, string> = {
    'Document': 'pdf',
    'Imagery': 'img',
    'Image': 'img',
    'AI': 'ai',
    'All': 'All',
  };

  const mapped = categoryMap[defaultCategory] || 'pdf';
  const filtered = mapped === 'All'
    ? BUILD_PUBLIC_TOOLS
    : BUILD_PUBLIC_TOOLS.filter(t => t.cat === mapped);

  if (selectedId) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md">
          <button
            onClick={() => setSelectedId(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            ← Back to Tools
          </button>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-3 py-1 rounded-full">Ready</span>
        </div>
        <div className="flex-1 overflow-auto scrollbar-hide">
          <ToolWorkspaceClient id={selectedId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 md:p-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-7xl mx-auto animate-in fade-in duration-500">
          {filtered.map(tool => (
            <LiquidWorkspaceCard 
              key={tool.id} 
              tool={tool} 
              onClick={() => setSelectedId(tool.id)} 
            />
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-black/5 text-center bg-white/10 backdrop-blur-sm">
      </div>
    </div>
  );
}
