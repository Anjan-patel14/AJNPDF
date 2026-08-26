import capabilityData from '@/generated/backend-capabilities.json';
import type { ServiceTool } from './tools-data';
import { getToolPolicy } from './tool-policy';

export type BuildCapability = {
  id: string;
  name?: string;
  category?: string;
  available: boolean;
  unavailableReason?: string | null;
  outputExtension?: string;
  inputExtensions?: string[];
  recognitionLanguages?: string[];
  processingMode?: 'browser' | 'temporary-server' | string;
};

type CapabilityFile = {
  schemaVersion?: number;
  generatedAt?: string | null;
  backendVersion?: string | null;
  toolCount?: number;
  availableCount?: number;
  unavailableCount?: number;
  capabilityFingerprint?: string | null;
  tools?: BuildCapability[];
};

const file = capabilityData as CapabilityFile;
const tools = Array.isArray(file.tools) ? file.tools : [];
const manifestValid = Boolean(
  file.schemaVersion === 2 &&
  file.generatedAt &&
  file.backendVersion &&
  file.capabilityFingerprint &&
  typeof file.toolCount === 'number' &&
  file.toolCount === tools.length &&
  tools.length > 0,
);
const capabilityMap = new Map(tools.map((entry) => [entry.id, entry]));

export const BUILD_CAPABILITY_MANIFEST_VALID = manifestValid;
export const BUILD_CAPABILITY_GENERATED_AT = manifestValid ? file.generatedAt || null : null;
export const BUILD_BACKEND_VERSION = manifestValid ? file.backendVersion || null : null;
export const BUILD_BACKEND_TOOL_COUNT = manifestValid ? file.toolCount || 0 : 0;
export const BUILD_BACKEND_AVAILABLE_COUNT = manifestValid ? file.availableCount || 0 : 0;
export const BUILD_BACKEND_UNAVAILABLE_COUNT = manifestValid ? file.unavailableCount || 0 : 0;
export const BUILD_CAPABILITY_FINGERPRINT = manifestValid ? file.capabilityFingerprint || null : null;

export function getBuildCapability(id: string): BuildCapability | null {
  if (!manifestValid) return null;
  return capabilityMap.get(id) || null;
}

export function isBuildToolAvailable(id: string): boolean {
  const policy = getToolPolicy(id);
  if (!policy.publicByDefault) return false;
  if (policy.processingMode === 'browser') return true;
  if (!manifestValid) return false;
  return Boolean(getBuildCapability(id)?.available);
}

export function filterBuildAvailableTools<T extends ServiceTool>(items: T[]): T[] {
  return items.filter((tool) => isBuildToolAvailable(tool.id));
}

export function unavailableBuildReason(id: string): string | null {
  const policy = getToolPolicy(id);
  if (!policy.publicByDefault) return policy.limitation || 'This tool is not included in the public release.';
  if (policy.processingMode === 'browser') return null;
  if (!manifestValid) return 'Live availability information is missing for this deployment.';
  const capability = getBuildCapability(id);
  if (!capability) return 'This online workflow is not enabled for the current deployment.';
  return capability.available ? null : capability.unavailableReason || 'A required conversion dependency is unavailable.';
}
