"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
}

export function FileDropzone({
  onFilesAdded,
  accept = { "application/pdf": [".pdf"] },
  multiple = true,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const reduceMotion = useReducedMotion();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActive(false);
    if (acceptedFiles.length > 0) onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept,
    multiple,
    noClick: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const rootProps = getRootProps();
  const dropzoneHandlers = {
    onDrop: rootProps.onDrop as React.DragEventHandler<HTMLDivElement>,
    onDragOver: rootProps.onDragOver as React.DragEventHandler<HTMLDivElement>,
    onDragEnter: rootProps.onDragEnter as React.DragEventHandler<HTMLDivElement>,
    onDragLeave: rootProps.onDragLeave as React.DragEventHandler<HTMLDivElement>,
  };

  return (
    <motion.div
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Choose files or drag and drop files here"
      {...dropzoneHandlers}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "ajn-dropzone group relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-5 py-8 text-center transition duration-300 md:min-h-[220px] md:px-10",
        isDragActive && "is-active"
      )}
    >
      <input {...getInputProps()} />

      <motion.div
        animate={reduceMotion ? undefined : { y: isDragActive ? -7 : 0, scale: isDragActive ? 1.05 : 1 }}
        className="ajn-upload-icon relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl md:h-16 md:w-16"
      >
        <CloudUpload className="h-8 w-8 md:h-9 md:w-9" />
      </motion.div>

      <div className="relative z-10 max-w-lg">
        <h3 className="text-xl font-black tracking-[-.025em] text-slate-950 md:text-2xl">
          {isDragActive ? "Drop files to continue" : "Choose or drop your files"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-[12px] font-semibold leading-5 text-slate-500 md:text-sm">
          Select the files needed for this tool. Choose the files you want to work with. The next step shows only the options you need.
        </p>
        <span className="ajn-dropzone-button mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-xs font-black">
          <CloudUpload className="h-4 w-4" /> Choose {multiple ? "files" : "file"}
        </span>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-extrabold">
        <span className="ajn-mini-trust"><ShieldCheck className="h-3.5 w-3.5" /> Validated input</span>
        <span className="ajn-mini-trust"><Sparkles className="h-3.5 w-3.5" /> Clear workflow</span>
      </div>

      <AnimatePresence>
        {isDragActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ajn-dropzone-active-layer absolute inset-0 pointer-events-none" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
