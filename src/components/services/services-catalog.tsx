
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ImageIcon, Video, Music, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'pdf',
    title: 'PDF Tools',
    count: '14 Tools',
    desc: 'Merge, split, compress and edit PDFs with clear, focused tools.',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    id: 'image',
    title: 'Image Tools',
    count: '12 Tools',
    desc: 'Convert formats, optimize size, crop, and apply AI enhancements.',
    icon: ImageIcon,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  },
  {
    id: 'video',
    title: 'Video Tools',
    count: '8 Tools',
    desc: 'Trim clips, compress for web, and convert to any device format.',
    icon: Video,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    id: 'audio',
    title: 'Audio Tools',
    count: '7 Tools',
    desc: 'Extract audio from video, trim tracks, and normalize volume.',
    icon: Music,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10'
  }
];

export function ServicesCatalog() {
  return (
    <div className="max-w-6xl mx-auto px-8 pb-32 space-y-16 relative">
      {/* HEADER SECTION */}
      <section className="text-center space-y-6 animate-in fade-in duration-1000">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-white">
          Universal File <br />
          <span className="text-primary/80">Mastery</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto font-bold text-[10px] uppercase tracking-[0.4em] opacity-60">
          Click a category to explore specialized tools for every workflow.
        </p>
      </section>

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat) => (
          <Card 
            key={cat.id} 
            className="bg-white/[0.02] border-white/5 hover:border-primary/40 transition-all duration-500 group overflow-hidden rounded-[3rem] border-2 shadow-2xl"
          >
            <CardContent className="p-12 flex flex-col items-center text-center space-y-10 relative">
              {/* Subtle background glow on hover */}
              <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none",
                cat.bg
              )} />

              <div className="space-y-3 relative z-10">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] px-4 h-6">
                  {cat.count}
                </Badge>
                <h2 className="text-4xl font-black tracking-tighter uppercase text-white group-hover:text-primary transition-colors">
                  {cat.title}
                </h2>
              </div>

              <div className={cn(
                "w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 relative z-10 shadow-2xl border border-white/5",
                cat.color
              )}>
                <cat.icon className="w-12 h-12" />
              </div>

              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed max-w-xs relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                {cat.desc}
              </p>

              <Button className="h-14 px-10 bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all gap-3 shadow-2xl relative z-10 group-hover:translate-y-[-6px]">
                EXPLORE TOOLS <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
