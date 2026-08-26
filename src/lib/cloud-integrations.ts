'use client';

export type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive';

export interface CloudProviderStatus {
  id: CloudProvider;
  label: string;
  configured: boolean;
  importAvailable: boolean;
  exportAvailable: boolean;
  reason?: string;
}

type GoogleTokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };
type GoogleTokenClient = { callback: (response: GoogleTokenResponse) => void; requestAccessToken: (options?: { prompt?: string }) => void };
type GooglePickerDocument = { id?: string; name?: string; mimeType?: string; type?: string };
type DropboxFile = { name: string; link: string; bytes?: number; icon?: string; thumbnailLink?: string; isDir?: boolean };

declare global {
  interface Window {
    google?: any;
    gapi?: any;
    Dropbox?: {
      choose: (options: {
        success: (files: DropboxFile[]) => void;
        cancel?: () => void;
        linkType?: 'preview' | 'direct';
        multiselect?: boolean;
        extensions?: string[];
        folderselect?: boolean;
      }) => void;
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || '';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '';
const GOOGLE_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID || '';
const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || '';
const ONEDRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID || '';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const MAX_CLOUD_FILE_BYTES = 75 * 1024 * 1024;

let googleAccessToken = '';
let googleAccessTokenExpiresAt = 0;
let googleTokenClient: GoogleTokenClient | null = null;
let googlePickerLoaded = false;

function loadScript(
  src: string,
  id: string,
  attributes: Record<string, string> = {},
  ready?: () => boolean,
): Promise<void> {
  if (typeof document === 'undefined') return Promise.reject(new Error('Cloud files are available only in the browser.'));
  if (ready?.()) return Promise.resolve();
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.ajnLoaded === 'true' && (!ready || ready())) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    let settled = false;
    const cleanup = () => {
      script.removeEventListener('load', done);
      script.removeEventListener('error', failed);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      script.dataset.ajnLoaded = 'true';
      cleanup();
      resolve();
    };
    const done = () => {
      if (!ready || ready()) finish();
      else {
        settled = true;
        cleanup();
        reject(new Error('The cloud provider library loaded but did not initialize.'));
      }
    };
    const failed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('The cloud provider library could not be loaded. Check your connection and provider configuration.'));
    };
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
      document.head.appendChild(script);
    } else if (ready?.()) {
      finish();
    }
  });
}

function safeCloudFilename(value: string, fallback: string): string {
  const cleaned = String(value || '').trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/[. ]+$/g, '').slice(0, 180);
  return cleaned || fallback;
}

function extensionFilters(accept?: string): string[] | undefined {
  const values = String(accept || '').split(',').map(value => value.trim().toLowerCase()).filter(value => /^\.[a-z0-9]+$/.test(value));
  return values.length ? [...new Set(values)] : undefined;
}

async function responseToFile(response: Response, filename: string, declaredMime?: string): Promise<File> {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Cloud access expired or this file was not shared with AJN PDF. Reconnect and choose it again.');
    throw new Error(`Cloud file download failed (${response.status}).`);
  }
  const lengthHeader = response.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_CLOUD_FILE_BYTES) throw new Error('This cloud file is larger than the current AJN PDF file limit.');
  const blob = await response.blob();
  if (!blob.size) throw new Error('The cloud provider returned an empty file.');
  if (blob.size > MAX_CLOUD_FILE_BYTES) throw new Error('This cloud file is larger than the current AJN PDF file limit.');
  const mime = declaredMime || blob.type || 'application/octet-stream';
  return new File([blob], safeCloudFilename(filename, 'cloud-file'), { type: mime, lastModified: Date.now() });
}

async function ensureGoogleLibraries(): Promise<void> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY || !GOOGLE_APP_ID) throw new Error('Google Drive is not configured for this AJN PDF deployment.');
  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client', 'ajn-google-gis', {}, () => Boolean(window.google?.accounts?.oauth2)),
    loadScript('https://apis.google.com/js/api.js', 'ajn-google-api', {}, () => Boolean(window.gapi))]);
  if (!window.google?.accounts?.oauth2 || !window.gapi) throw new Error('Google Drive libraries did not initialize correctly.');
  if (!googlePickerLoaded) {
    await new Promise<void>((resolve, reject) => {
      window.gapi.load('picker', {
        callback: () => { googlePickerLoaded = true; resolve(); },
        onerror: () => reject(new Error('Google Picker could not be loaded.')),
      });
    });
  }
  if (!googleTokenClient) {
    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      include_granted_scopes: true,
      callback: () => undefined,
    }) as GoogleTokenClient;
  }
}

async function googleToken(): Promise<string> {
  await ensureGoogleLibraries();
  if (googleAccessToken && Date.now() < googleAccessTokenExpiresAt - 60_000) return googleAccessToken;
  return new Promise<string>((resolve, reject) => {
    if (!googleTokenClient) return reject(new Error('Google Drive authorization is unavailable.'));
    googleTokenClient.callback = (response: GoogleTokenResponse) => {
      if (response.error || !response.access_token) {
        reject(new Error(response.error_description || 'Google Drive authorization was cancelled or denied.'));
        return;
      }
      googleAccessToken = response.access_token;
      googleAccessTokenExpiresAt = Date.now() + Math.max(60, Number(response.expires_in || 3600)) * 1000;
      resolve(googleAccessToken);
    };
    googleTokenClient.requestAccessToken({ prompt: googleAccessToken ? '' : 'consent' });
  });
}

function googleExportTarget(mimeType: string, name: string): { mime: string; extension: string } | null {
  if (mimeType === 'application/vnd.google-apps.document') return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: '.docx' };
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' };
  if (mimeType === 'application/vnd.google-apps.presentation') return { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: '.pptx' };
  if (mimeType === 'application/vnd.google-apps.drawing') return { mime: 'application/pdf', extension: '.pdf' };
  if (mimeType.startsWith('application/vnd.google-apps.')) throw new Error(`This Google Workspace file type cannot currently be exported into AJN PDF: ${name}.`);
  return null;
}

async function downloadGoogleFile(document: GooglePickerDocument, token: string): Promise<File> {
  const id = String(document.id || '');
  if (!id) throw new Error('Google Picker did not return a file id.');
  const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,capabilities(canDownload)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metadataResponse.ok) throw new Error('Google Drive file metadata could not be read.');
  const metadata = await metadataResponse.json() as { name?: string; mimeType?: string; size?: string; capabilities?: { canDownload?: boolean } };
  if (metadata.capabilities?.canDownload === false) throw new Error('The selected Google Drive file does not allow downloading.');
  if (metadata.size && Number(metadata.size) > MAX_CLOUD_FILE_BYTES) throw new Error('This Google Drive file is larger than the current AJN PDF file limit.');
  const name = safeCloudFilename(metadata.name || document.name || 'drive-file', 'drive-file');
  const mime = metadata.mimeType || document.mimeType || 'application/octet-stream';
  const exportTarget = googleExportTarget(mime, name);
  if (exportTarget) {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(exportTarget.mime)}`, { headers: { Authorization: `Bearer ${token}` } });
    const base = name.replace(/\.[^/.]+$/, '') || name;
    return responseToFile(response, `${base}${exportTarget.extension}`, exportTarget.mime);
  }
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  return responseToFile(response, name, mime);
}

export async function importFromGoogleDrive(options: { multiple?: boolean } = {}): Promise<File[]> {
  const token = await googleToken();
  return new Promise<File[]>((resolve, reject) => {
    let builder = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setAppId(GOOGLE_APP_ID)
      .setOrigin(window.location.origin)
      .setTitle('Choose files for AJN PDF')
      .setMaxItems(options.multiple ? 20 : 1)
      .setCallback(async (data: any) => {
        const action = data?.action || data?.[window.google.picker.Response.ACTION];
        if (action === window.google.picker.Action.CANCEL) { resolve([]); return; }
        if (action !== window.google.picker.Action.PICKED) return;
        try {
          const documents = (data?.docs || data?.[window.google.picker.Response.DOCUMENTS] || []) as GooglePickerDocument[];
          const selected = options.multiple ? documents.slice(0, 20) : documents.slice(0, 1);
          const files: File[] = [];
          for (const document of selected) files.push(await downloadGoogleFile(document, token));
          resolve(files);
        } catch (error) { reject(error); }
      });
    if (options.multiple && window.google.picker.Feature?.MULTISELECT_ENABLED) {
      builder = builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
    }
    builder.build().setVisible(true);
  });
}

async function ensureDropbox(): Promise<void> {
  if (!DROPBOX_APP_KEY) throw new Error('Dropbox is not configured for this AJN PDF deployment.');
  if (window.Dropbox?.choose) return;
  await loadScript(
    'https://www.dropbox.com/static/api/2/dropins.js',
    'dropboxjs',
    { 'data-app-key': DROPBOX_APP_KEY },
    () => Boolean(window.Dropbox?.choose),
  );
  if (!window.Dropbox?.choose) throw new Error('Dropbox Chooser did not initialize correctly.');
}

export async function importFromDropbox(options: { multiple?: boolean; accept?: string } = {}): Promise<File[]> {
  await ensureDropbox();
  return new Promise<File[]>((resolve, reject) => {
    window.Dropbox!.choose({
      linkType: 'direct',
      multiselect: Boolean(options.multiple),
      folderselect: false,
      extensions: extensionFilters(options.accept),
      cancel: () => resolve([]),
      success: async entries => {
        try {
          const selected = options.multiple ? entries.slice(0, 20) : entries.slice(0, 1);
          const files: File[] = [];
          for (const entry of selected) {
            if (entry.isDir) continue;
            if (entry.bytes && entry.bytes > MAX_CLOUD_FILE_BYTES) throw new Error(`${entry.name} is larger than the current AJN PDF file limit.`);
            const response = await fetch(entry.link, { method: 'GET' });
            files.push(await responseToFile(response, entry.name));
          }
          resolve(files);
        } catch (error) { reject(error); }
      },
    });
  });
}

export async function exportToGoogleDrive(blob: Blob, filename: string): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await googleToken();
  if (blob.size > MAX_CLOUD_FILE_BYTES) throw new Error('This result is larger than the current AJN PDF Google Drive export limit.');
  const metadata = { name: safeCloudFilename(filename, 'ajn-pdf-result') };
  const boundary = `ajn_pdf_${Math.random().toString(36).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`]);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!response.ok) throw new Error(`Google Drive export failed (${response.status}).`);
  return response.json();
}

export function cloudProviderStatuses(): CloudProviderStatus[] {
  return [
    {
      id: 'google-drive',
      label: 'Google Drive',
      configured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID),
      importAvailable: Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID),
      exportAvailable: Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID),
      reason: GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID ? undefined : 'Add Google OAuth client ID, browser API key and Cloud project number.',
    },
    {
      id: 'dropbox',
      label: 'Dropbox',
      configured: Boolean(DROPBOX_APP_KEY),
      importAvailable: Boolean(DROPBOX_APP_KEY),
      exportAvailable: false,
      reason: DROPBOX_APP_KEY ? 'Import uses Dropbox Chooser. Export requires a separate scoped OAuth upload integration.' : 'Add a Dropbox Chooser app key and allowed production domain.',
    },
    {
      id: 'onedrive',
      label: 'OneDrive',
      configured: Boolean(ONEDRIVE_CLIENT_ID),
      importAvailable: false,
      exportAvailable: false,
      reason: 'OneDrive production access is intentionally gated until MSAL.js authorization-code + PKCE is configured for the SPA redirect URI.',
    }];
}
