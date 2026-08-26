"use client"

import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { Info, CircleCheck, TriangleAlert } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * AJN Network Toaster - Production Stabilized v15.8
 * Standardized: Using modern Lucide icon definitions (CircleCheck, TriangleAlert).
 * Fixed: Enforced strict hydration guard for Next.js 15 compatibility.
 */
export function Toaster() {
  const { toasts } = useToast()
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-4">
              <div className="shrink-0 mt-0.5">
                {variant === 'success' && <CircleCheck className="w-5 h-5 text-emerald-500" />}
                {variant === 'info' && <Info className="w-5 h-5 text-primary" />}
                {variant === 'destructive' && <TriangleAlert className="w-5 h-5 text-red-500" />}
                {!variant && <Info className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
