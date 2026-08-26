"use client";

import React from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, X, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { FileItem } from "@/lib/pdf-tools";

interface FileListProps {
  files: FileItem[];
  onReorder: (files: FileItem[]) => void;
  onRemove: (id: string) => void;
  title?: string;
}

function SortableItem({ file, onRemove }: { file: FileItem; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-black/5 rounded-2xl transition-all duration-300",
        isDragging && "opacity-50 scale-[0.98] shadow-2xl ring-2 ring-primary/20"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-900 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center text-primary">
        <FileText className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">
          {file.file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-slate-400">{file.originalSize}</span>
          {file.pageCount !== undefined && (
            <>
              <span className="w-1 h-1.5 rounded-sm bg-slate-200" />
              <span className="text-[10px] font-mono text-slate-400">{file.pageCount} Pages</span>
            </>
          )}
          {file.processedSize && (
            <>
              <ArrowRight className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono text-primary font-bold">{file.processedSize}</span>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(file.id)}
        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function FileList({ files, onReorder, onRemove, title = "document manifest" }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(files, oldIndex, newIndex));
    }
  }

  if (files.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          {title} ({files.length})
        </h3>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {files.map((file) => (
              <SortableItem 
                key={file.id} 
                file={file} 
                onRemove={onRemove} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
