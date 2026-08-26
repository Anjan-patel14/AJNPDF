import { PUBLIC_TOOLS } from './tools-data';
import { filterBuildAvailableTools } from './tool-capabilities';

// R13 keeps every public workflow addressable at its canonical root URL.
// Build/runtime capability data controls whether online processing is enabled,
// but temporary dependency outages must not turn established tool URLs into 404s.
export const BUILD_PUBLIC_TOOLS = PUBLIC_TOOLS;
export const BUILD_PUBLIC_TOOL_IDS = new Set(BUILD_PUBLIC_TOOLS.map((tool) => tool.id));

// Use this when a surface specifically needs only currently build-available tools.
export const BUILD_AVAILABLE_PUBLIC_TOOLS = filterBuildAvailableTools(PUBLIC_TOOLS);
export const BUILD_AVAILABLE_PUBLIC_TOOL_IDS = new Set(BUILD_AVAILABLE_PUBLIC_TOOLS.map((tool) => tool.id));
