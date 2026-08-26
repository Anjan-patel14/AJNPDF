"use client";

import React, { useState, useRef } from "react";
import { Captions, CheckCircle2, Download, Loader2, X, RefreshCcw, Zap, Upload, Settings2, Edit3, RotateCcw, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, getFilesFromEvent, beginToolProcessing, completeToolProcessing, failToolProcessing, shareResult } from './_shared';

interface SubtitleSegment {
  id: string;
  start: number; // seconds
  end: number;
  text: string;
}

/**
 * AJN Professional Subtitle Creator - Production v1.0
 */
export default function SubtitleGenerator() {
  const { toast } = useToast();
  const [inputText, setRawText] = useState<string>("");
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");
  const [outputName, setOutputName] = useState("");
  const [exportFormat, setExportFormat] = useState<'SRT' | 'VTT'>('SRT');
  const [isDragging, setIsDragging] = useState(false);
  
  const [settings] = useState({
    charsPerLine: 42,
    wpm: 160,
    minDuration: 1.5,
    gap: 0.1
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (!f) return;
    const text = await f.text();
    setRawText(text);
    setPhase('configure');
    setOutputName(f.name.replace(/\.[^/.]+$/, "") + "_Subtitles");
  };

  const autoSplit = () => {
    if (!inputText.trim()) return;
    
    setStatus("Analyzing cadence...");
    const words = inputText.trim().split(/\s+/);
    const newSegments: SubtitleSegment[] = [];
    let currentStart = 0;
    
    // Chunking logic: group words by length or character limit
    let currentWords: string[] = [];
    let currentCharCount = 0;

    words.forEach((word, idx) => {
      currentWords.push(word);
      currentCharCount += word.length + 1;

      if (currentCharCount >= settings.charsPerLine || idx === words.length - 1) {
        const text = currentWords.join(" ");
        const duration = Math.max(settings.minDuration, (currentWords.length / settings.wpm) * 60);
        
        newSegments.push({
          id: Math.random().toString(36).substr(7),
          start: currentStart,
          end: currentStart + duration,
          text
        });

        currentStart += duration + settings.gap;
        currentWords = [];
        currentCharCount = 0;
      }
    });

    setSegments(newSegments);
    setPhase('configure');
  };

  const executeExport = async () => {
    beginToolProcessing("SubtitleGenerator");
    setPhase('processing');
    setProgress(0);
    setStatus("Creating the subtitle file…");

    try {
      let content = "";
      const formatTime = (s: number) => {
        const ms = Math.floor((s % 1) * 1000);
        const sec = Math.floor(s % 60);
        const min = Math.floor((s / 60) % 60);
        const hrs = Math.floor(s / 3600);
        
        const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
        const sep = exportFormat === 'SRT' ? ',' : '.';
        return `${pad(hrs)}:${pad(min)}:${pad(sec)}${sep}${pad(ms, 3)}`;
      };

      if (exportFormat === 'VTT') content = "WEBVTT\n\n";

      segments.forEach((seg, i) => {
        if (exportFormat === 'SRT') {
          content += `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n\n`;
        } else {
          content += `${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n\n`;
        }
        setProgress(Math.round(((i + 1) / segments.length) * 100));
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const name = `${outputName}.${exportFormat.toLowerCase()}`;
      setResultBlob(blob);
      setResultName(name);
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      toast({ title: "Export Error", variant: "destructive" });
      setPhase('configure');
    }
  };

  const updateSegment = (id: string, field: keyof SubtitleSegment, val: any) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const reset = () => { setRawText(""); setSegments([]); setResultBlob(null); setResultName(""); setPhase('upload'); setProgress(0); };

  return (
    <ToolWorkspace title="Subtitle Creator" description="Create timed SRT or VTT subtitle files" accent="#4F46E5">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl mx-auto space-y-10">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                className={cn(
                  "group relative min-h-[200px] w-full rounded-2xl border border-dashed transition-all duration-700 shadow-md overflow-hidden flex flex-col items-center justify-center cursor-pointer",
                  isDragging ? "border-primary bg-primary/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                )}
              >
                <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-1 px-8">
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Drop Transcript File</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Subtitle timing</p>
                </div>
              </div>

              <div className="bg-white/40 border-2 border-black/5 rounded-2xl p-10 space-y-6 shadow-md backdrop-blur-xl">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Text</Label>
                <Textarea 
                  placeholder="Paste script text here to auto-segment..." 
                  value={inputText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[200px] bg-slate-50 border-none rounded-2xl font-medium p-6 shadow-inner focus:ring-primary/20"
                />
                <Button onClick={autoSplit} disabled={!inputText.trim()} className="w-full h-14 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all gap-3 border-2 border-white/20">
                  <Zap className="w-4 h-4" /> Create subtitles
                </Button>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Captions className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">Settings</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{segments.length} Segments ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Clear</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Timeline Settings</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px]">
                    <ScrollArea className="h-[600px]">
                      <div className="divide-y divide-black/5">
                        {segments.map((seg, idx) => (
                          <div key={seg.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[10px] text-slate-400 shrink-0">{idx + 1}</div>
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[8px] font-black uppercase text-slate-400">Start Time (s)</Label>
                                  <Input type="number" step="0.1" value={seg.start} onChange={e => updateSegment(seg.id, 'start', parseFloat(e.target.value))} className="h-9 bg-white border-black/5 text-xs font-bold font-mono" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[8px] font-black uppercase text-slate-400">End Time (s)</Label>
                                  <Input type="number" step="0.1" value={seg.end} onChange={e => updateSegment(seg.id, 'end', parseFloat(e.target.value))} className="h-9 bg-white border-black/5 text-xs font-bold font-mono" />
                                </div>
                              </div>
                              <Textarea value={seg.text} onChange={e => updateSegment(seg.id, 'text', e.target.value)} className="min-h-[60px] bg-white border-black/5 text-sm font-medium focus:ring-primary/20" />
                            </div>
                            <button onClick={() => setSegments(prev => prev.filter(s => s.id !== seg.id))} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                <aside className="lg:col-span-4 space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Settings</Label>
                    </div>
                    
                    <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-3xl p-8 space-y-8 shadow-xl">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Export Standard</Label>
                        <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                          <SelectTrigger className="h-12 bg-white/5 border-black/5 rounded-xl font-black text-xs uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white rounded-xl">
                            <SelectItem value="SRT" className="text-xs font-bold">SubRip (.SRT)</SelectItem>
                            <SelectItem value="VTT" className="text-xs font-bold">WebVTT (.VTT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Output Name</Label>
                        <div className="relative">
                          <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input placeholder="captions" value={outputName} onChange={(e) => setOutputName(e.target.value)} className="h-12 pl-12 bg-white/5 border-black/5 rounded-xl font-bold" />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                          <RotateCcw className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Auto adjust</span>
                        </div>
                        <Button variant="outline" onClick={autoSplit} className="w-full h-10 border-black/5 bg-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white rounded-xl shadow-sm transition-all">Apply again</Button>
                      </div>
                    </Card>
                  </section>

                  <Button onClick={executeExport} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Generate subtitle file
                  </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center space-y-10 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="w-full max-w-sm space-y-4 mx-auto">
                <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{status}</span><span className="text-xl font-black text-primary tracking-tighter">{progress}%</span></div>
                <Progress value={progress} className="h-1.5 bg-black/5" />
              </div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="py-12 flex flex-col items-center space-y-10 text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-950">Success 🎉</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtitle file created successfully</p>
              </div>

              <div className="w-full max-w-sm flex flex-col gap-4 mx-auto pt-4 pb-32">
                <Button onClick={() => resultBlob && dl(resultBlob, resultName || `${outputName}.${exportFormat.toLowerCase()}`)} disabled={!resultBlob} className="h-16 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Download className="w-4 h-4" /> Download .{exportFormat}
                </Button>
                <Button variant="outline" onClick={() => { if (resultBlob) void shareResult(resultBlob, resultName || `${outputName}.${exportFormat.toLowerCase()}`); }} disabled={!resultBlob} className="h-12 border-slate-200 bg-white text-slate-700 font-black text-xs rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/60 gap-2">
                  <Share2 className="w-4 h-4" /> Share result
                </Button>
                <button onClick={reset} className="h-12 rounded-xl font-black text-[10px] uppercase text-slate-400 gap-2 flex items-center justify-center hover:bg-black/5 transition-all">
                  <RefreshCcw className="w-3.5 h-3.5" /> Process another file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolWorkspace>
  );
}
