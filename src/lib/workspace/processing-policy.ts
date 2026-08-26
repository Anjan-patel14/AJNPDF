import { getToolPolicy, type ProcessingMode } from "@/lib/tool-policy";

export type WorkspaceProcessingMode = ProcessingMode;

export function getWorkspaceProcessingPolicy(toolId: string) {
  const policy = getToolPolicy(toolId);
  return {
    mode: policy.processingMode,
    label: policy.processingMode === "browser" ? "On-device processing" : "Temporary processing",
    description:
      policy.processingMode === "browser"
        ? "This tool processes the selected file in this browser session."
        : "This tool uses AJN PDF's temporary processing service for the active request.",
    limitation: policy.limitation,
  };
}
