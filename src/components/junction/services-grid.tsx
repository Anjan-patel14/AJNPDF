"use client";

import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useMemo, useState, useEffect, useRef } from "react";
import { toolPath } from '@/lib/tool-routes';

interface ServicesGridProps {
  query: string;
  category: string;
}

function LiquidToolCard({ tool, query }: { tool: any; query: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    cardRef.current.style.setProperty("--x", x + "%");
    cardRef.current.style.setProperty("--y", y + "%");

    const rotateX = (y - 50) / 10;
    const rotateY = (50 - x) / 10;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/10 text-primary rounded-sm px-0.5 border-b border-primary/20">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <Link href={toolPath(tool.id)}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="liquid-card h-full"
      >
        <div className="p-6 md:p-8 flex flex-col h-full gap-5 relative z-10">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg border border-black/5 transition-all duration-700 bg-white/80 backdrop-blur-sm",
                tool.color
              )}
            >
              <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            {tool.badge && (
              <Badge
                className={cn(
                  "text-[7px] md:text-[8px] font-black uppercase px-2 h-5 tracking-widest border-none shadow-sm",
                  tool.badge === "Popular" ? "bg-amber-500 text-white" : tool.badge === "Smart" ? "bg-primary text-white" : "bg-emerald-500 text-white"
                )}
              >
                {tool.badge}
              </Badge>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-sm md:text-base font-black uppercase tracking-tighter leading-tight text-slate-950">
              <Highlight text={tool.name} highlight={query} />
            </h3>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-2 opacity-80">
              <Highlight text={tool.desc} highlight={query} />
            </p>
          </div>

          <div className="pt-4 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-2 rounded-sm bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary font-black uppercase text-[9px] tracking-widest opacity-0 group-hover:opacity-100 transition-all">
              Try Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ServicesGrid({ query, category }: ServicesGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.toLowerCase().trim();
    return BUILD_PUBLIC_TOOLS.filter((tool) => {
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q));
      const matchesCat =
        category === "All" || (category === "AJN PDF" && tool.cat === "pdf") || (category === "AJN IMG" && tool.cat === "img");
      return matchesSearch && matchesCat;
    });
  }, [query, category]);

  if (!mounted) return <div className="h-[400px] bg-white/5 animate-pulse rounded-3xl" />;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <LiquidToolCard tool={tool} query={query} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTools.length === 0 && (
        <div className="py-24 text-center space-y-4 opacity-40 animate-in fade-in duration-700">
          <div className="w-16 h-16 bg-black/5 rounded-[2rem] flex items-center justify-center mx-auto border border-dashed border-black/5">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-900">No tools matched your search</p>
        </div>
      )}
    </div>
  );
}
