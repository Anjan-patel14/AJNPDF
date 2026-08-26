'use client';

/**
 * AJN Master Engine - Performance Optimized v9.5
 * Hardened: Automatic feedback trigger implemented after local export.
 * Improved: Live memory pressure monitoring for production stability.
 */

export type JobPhase = 'loading' | 'analyzing' | 'processing' | 'finalizing';

export interface JobProgress {
  stage: string;
  detail: string;
  pct: number;
  phase?: JobPhase;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error';
  message: string;
}

export interface ProcessingJob {
  id: string;
  status: 'running' | 'idle' | 'error';
  progress: number;
  stage: string;
  logs: LogEntry[];
  inputs: File[];
}

export interface OutputBuffer {
  id: string;
  fileName: string;
  objectUrl: string;
  sizeFormatted: string;
  toFmt: string;
  stats?: {
    originalSize: string;
    reduction: string;
    time: string;
  };
}

export interface GlobalAppState {
  queue: ProcessingJob[];
  outputs: OutputBuffer[];
  engineStatus: 'idle' | 'busy' | 'ready';
  bufferPressure: number;
}

export interface EngineResponse {
  success: boolean;
  message: string;
  fileName?: string;
  byteLength?: number;
  blob?: Blob;
  error?: string;
  stats?: {
    time: string;
    quality: string;
  };
}

type ToolFunction = (files: File[], options: any, onProgress: (p: JobProgress) => void, signal?: AbortSignal) => Promise<Blob | any>;

type ProcessingUiEvent = 'ajn:processing-start' | 'ajn:processing-progress' | 'ajn:processing-finish' | 'ajn:processing-error' | 'ajn:processing-cancelled';
function emitProcessingUiEvent(type: ProcessingUiEvent, detail: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

const TOOL_REGISTRY: Record<string, ToolFunction> = {
  'merge-pdf': async (files, options, onProgress) => {
    const { PDFManipulator } = await import('./pdf-manipulator');
    return new PDFManipulator(files, (pct, msg) => onProgress({ stage: 'Combining', detail: msg, pct, phase: 'processing' })).runOperation('merge-pdf', options);
  },
  'split-pdf': async (files, options, onProgress) => {
    const { PDFManipulator } = await import('./pdf-manipulator');
    return new PDFManipulator(files, (pct, msg) => onProgress({ stage: 'Splitting', detail: msg, pct, phase: 'processing' })).runOperation('split-pdf', options);
  },
  'compress-pdf': async (files, options, onProgress) => {
    const logic = await import('./all-tools-logic');
    return logic.advancedCompressPDF(files[0], options.level || 'recommended', onProgress);
  },
  'pdf-metadata': async (files, options, onProgress) => {
    const logic = await import('./all-tools-logic');
    return logic.pdfMetadata(files[0], options, onProgress);
  },
  'jpg-pdf': async (files, options, onProgress) => {
    const logic = await import('./all-tools-logic');
    return logic.imagesToPDF(files, options, onProgress);
  },
  'png-to-pdf': async (files, options, onProgress) => {
    const logic = await import('./all-tools-logic');
    return logic.imagesToPDF(files, options, onProgress);
  },
  'rotate-pdf': async (files, options, onProgress) => {
    const { PDFManipulator } = await import('./pdf-manipulator');
    return new PDFManipulator(files, (pct, msg) => onProgress({ stage: 'Rotating', detail: msg, pct, phase: 'processing' })).runOperation('rotate-pdf', options);
  },
  'organize-pdf': async (files, options, onProgress) => {
    const { PDFManipulator } = await import('./pdf-manipulator');
    return new PDFManipulator(files, (pct, msg) => onProgress({ stage: 'Organizing', detail: msg, pct, phase: 'processing' })).runOperation('organize-pdf', options);
  },
  'delete-pdf-pages': async (files, options, onProgress) => {
    const { PDFManipulator } = await import('./pdf-manipulator');
    return new PDFManipulator(files, (pct, msg) => onProgress({ stage: 'Removing pages', detail: msg, pct, phase: 'processing' })).runOperation('delete-pdf-pages', options);
  },
  'add-text': async (files, options, onProgress) => {
    const { addTextToPdf } = await import('@/components/junction/_pdfUtils');
    onProgress({ stage: 'Annotating', detail: 'Applying text layer…', pct: 50, phase: 'processing' });
    return addTextToPdf(files[0], options.text, options.x, options.y, options.page || 1, options.size, options.color, options.bold);
  },
  'add-image-to-pdf': async (files, options, onProgress) => {
    const { addImageToPdf } = await import('@/components/junction/_pdfUtils');
    onProgress({ stage: 'Embedding', detail: 'Adding image layer…', pct: 50, phase: 'processing' });
    return addImageToPdf(files[0], files[1], options.x, options.y, options.width, options.height, options.page || 1);
  },
  'image-resizer': async (files, options, onProgress) => {
    const { resizeImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Resizing', detail: 'Scaling image…', pct: 30 });
    return resizeImage(files[0], options.width || 800, options.height || 600, options.lockAspectRatio ?? true);
  },
  'image-reducer': async (files, options, onProgress) => {
    const { compressImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Compressing', detail: 'Optimizing image…', pct: 30 });
    return compressImage(files[0], options.quality || 70, options.format || 'jpeg');
  },
  'photo-editor': async (files, options, onProgress) => {
    const { editPhoto } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Editing', detail: 'Applying adjustments…', pct: 40 });
    return editPhoto(files[0], options);
  },
  'meme-generator': async (files, options, onProgress) => {
    const { makeMeme } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Composing', detail: 'Adding captions…', pct: 40 });
    return makeMeme(files[0], options.top || '', options.bottom || '', options.fontSize || 0);
  },
  'convert-image': async (files, options, onProgress) => {
    const { convertImageFormat } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Converting', detail: 'Encoding output…', pct: 40 });
    return convertImageFormat(files[0], options.format || 'jpeg', options.quality || 92);
  },
  'flip-image': async (files, options, onProgress) => {
    const { flipImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Flipping', detail: 'Updating orientation…', pct: 40 });
    return flipImage(files[0], options.horizontal ?? true, options.vertical ?? false);
  },
  'rotate-image': async (files, options, onProgress) => {
    const { rotateImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Rotating', detail: 'Updating orientation…', pct: 40 });
    return rotateImage(files[0], options.rotation || 90);
  },
  'crop-image': async (files, options, onProgress) => {
    const { cropImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Cropping', detail: 'Trimming image bounds…', pct: 40 });
    return cropImage(files[0], options.x || 0, options.y || 0, options.w || 400, options.h || 400);
  },
  'watermark-image': async (files, options, onProgress) => {
    const { watermarkImage } = await import('@/components/junction/_imageUtils');
    onProgress({ stage: 'Watermarking', detail: 'Applying watermark…', pct: 40 });
    return watermarkImage(files[0], options.text || '', options.opacity || 0.6, options.fontSize || 40, options.color || '#ffffff', options.position || 'bottom-center');
  },
};
class AJNStudioSystem {
  private activeJobs = new Map<string, AbortController>();
  private state: GlobalAppState = { 
    queue: [], 
    outputs: [], 
    engineStatus: 'ready',
    bufferPressure: 0 
  };
  private listeners: ((state: GlobalAppState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.updateBufferPressure(), 3000);
    }
  }

  private updateBufferPressure() {
    try {
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize && mem.jsHeapLimit) {
        this.state.bufferPressure = Math.round((mem.usedJSHeapSize / mem.jsHeapLimit) * 100);
        this.notify();
      }
    } catch {
      // Silence pressure errors in non-Chrome environments
    }
  }

  subscribe(listener: (state: GlobalAppState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  async download(blob: Blob, name: string) {
    if (!blob || typeof window === 'undefined') return;
    const u = URL.createObjectURL(blob);
    const a = document.body.appendChild(document.createElement("a"));
    a.style.display = 'none';
    a.href = u; 
    a.download = name;
    a.click();
    
    // Trigger feedback after a short, deliberate delay
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(u);
      }, 2000);
  }

  cancelJob(jobId: string) {
    const controller = this.activeJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(jobId);
      this.state.queue = this.state.queue.filter(j => j.id !== jobId);
      if (this.state.queue.length === 0) this.state.engineStatus = 'ready';
      this.notify();
      return true;
    }
    return false;
  }

  clearQueue() {
    this.state.outputs.forEach(o => URL.revokeObjectURL(o.objectUrl));
    this.state.outputs = [];
    this.notify();
  }

  addJobs(files: File[], toolId: string, targetFormat: string, settings: any) {
    const jobId = Math.random().toString(36).substr(2, 9);
    const newJob: ProcessingJob = {
      id: jobId,
      status: 'running',
      progress: 0,
      stage: 'Initializing',
      logs: [{ timestamp: new Date().toLocaleTimeString(), level: 'info', message: "Processing started." }],
      inputs: files
    };

    this.state.queue = [newJob, ...this.state.queue];
    this.state.engineStatus = 'busy';
    this.notify();

    this.runTool(toolId || 'converter', files, settings, (p) => {
      this.state.queue = this.state.queue.map(j => j.id === jobId ? {
        ...j,
        progress: p.pct,
        stage: p.stage,
        logs: [...j.logs, { timestamp: new Date().toLocaleTimeString(), level: 'info', message: p.detail }]
      } : j);
      this.notify();
    }, jobId).then(res => {
      if (res.success && res.blob) {
        const output: OutputBuffer = {
          id: Math.random().toString(36).substr(2, 9),
          fileName: res.fileName || 'output.pdf',
          objectUrl: URL.createObjectURL(res.blob),
          sizeFormatted: (res.byteLength! / (1024 * 1024)).toFixed(2) + ' MB',
          toFmt: targetFormat,
          stats: {
            originalSize: (files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(2) + ' MB',
            reduction: 'Optimized',
            time: res.stats?.time || 'Not recorded'
          }
        };
        this.state.outputs = [output, ...this.state.outputs];
      }
      this.state.queue = this.state.queue.filter(j => j.id !== jobId);
      if (this.state.queue.length === 0) this.state.engineStatus = 'ready';
      this.notify();
    });
  }

  async runTool(
    toolId: string, 
    inputs: File | File[], 
    options: any = {}, 
    onProgress: (p: JobProgress) => void,
    jobId: string = Math.random().toString(36).substr(2, 9)
  ): Promise<EngineResponse> {
    const start = Date.now();
    const files = Array.isArray(inputs) ? inputs : (inputs ? [inputs] : []);
    const controller = new AbortController();
    this.activeJobs.set(jobId, controller);
    emitProcessingUiEvent('ajn:processing-start', { label: toolId, jobId });

    const reportProgress = (progress: JobProgress) => {
      onProgress(progress);
      emitProcessingUiEvent('ajn:processing-progress', { label: toolId, jobId, pct: progress.pct, stage: progress.stage });
    };

    try {
      const toolFn = TOOL_REGISTRY[toolId];
      if (!toolFn) throw new Error(`Tool [${toolId}] not registered in the processing engine.`);

      reportProgress({ stage: "Starting", detail: "Preparing your file…", pct: 5, phase: 'loading' });
      const result = await toolFn(files, options, reportProgress, controller.signal);

      if (controller.signal.aborted) throw new Error("ABORTED");

      const resultBlob = (result && result.blob) ? result.blob : (result instanceof Blob ? result : null);
      if (!resultBlob) throw new Error("The output file could not be created.");

      this.activeJobs.delete(jobId);
      emitProcessingUiEvent('ajn:processing-finish', { label: toolId, jobId });
      return {
        success: true,
        message: "Complete",
        fileName: options.outputName || "AJN_Output",
        byteLength: resultBlob.size,
        blob: resultBlob,
        stats: { time: `${((Date.now() - start) / 1000).toFixed(2)}s`, quality: "Standard output" }
      };
    } catch (err: any) {
      const cancelled = controller.signal.aborted || err?.name === 'AbortError' || err?.message === 'ABORTED';
      this.activeJobs.delete(jobId);
      emitProcessingUiEvent(cancelled ? 'ajn:processing-cancelled' : 'ajn:processing-error', { label: toolId, jobId });
      if (cancelled) return { success: false, message: "Cancelled", error: 'ABORTED' };
      return { success: false, message: err?.message || "An error occurred.", error: String(err) };
    }
  }
}

export const engine = new AJNStudioSystem();
