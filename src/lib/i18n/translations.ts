import en from '@/i18n/locales/en.json';
import hi from '@/i18n/locales/hi.json';
import te from '@/i18n/locales/te.json';
import ta from '@/i18n/locales/ta.json';
import kn from '@/i18n/locales/kn.json';

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn';
export type TranslationVars = Record<string, string | number>;

export const languages: { code: LanguageCode; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }];

export const translations: Record<LanguageCode, Record<string, string>> = { en, hi, te, ta, kn };

export function interpolate(value: string, vars?: TranslationVars): string {
  if (!vars) return value;
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => String(vars[key] ?? ''));
}

export function translateKey(language: LanguageCode, key: string, vars?: TranslationVars): string {
  const value = translations[language]?.[key] ?? translations.en[key] ?? key;
  return interpolate(value, vars);
}

// Compatibility layer for older tool screens. New code should call t(key) directly.
const legacyPhraseToKey: Record<string, string> = {

  'public tools': 'landing.publicTools',
  'Open tool': 'landing.openTool',
  'Search intent guide': 'landing.searchIntent',
  'Choose the right workflow, not just a file extension.': 'landing.workflowChoice',
  'Popular workflows': 'landing.popularWorkflows',
  'Product questions': 'landing.productQuestions',
  'Clear answers without absolute promises.': 'landing.clearAnswers',
  'Need a specific answer?': 'landing.needAnswer',
  'Full FAQ': 'landing.fullFaq',
  'Contact': 'landing.contact',
  'Supported formats': 'landing.supportedFormats',
  'Common formats across current public tools': 'landing.commonFormats',
  'Availability depends on the selected tool and its documented limits.': 'landing.formatLimits',
  'Simple workflow': 'landing.simpleWorkflow',
  'Easy to use without hiding the technical truth.': 'landing.easyTruth',
  'STEP': 'landing.step',
  'PROCESSING ARCHITECTURE': 'landing.architecture',
  'Two modes, clearly explained.': 'landing.twoModes',
  'Read processing transparency': 'landing.readTransparency',
  'BROWSER MODE': 'landing.browserMode',
  'Local-first tools': 'landing.browserTools',
  'ONLINE WORKFLOW': 'landing.serverMode',
  'Security and recovery': 'landing.securityRecovery',
  'Common workflows': 'landing.commonWorkflows',
  'Designed around real tasks, not fabricated testimonials.': 'landing.realTasks',
  'These examples describe supported workflows. They are not user reviews, customer counts or performance guarantees.': 'landing.noTestimonials',
  'Three clear categories': 'landing.threeCategories',
  'Find the right workflow without guessing.': 'landing.findWorkflow',
  'View all public tools': 'landing.viewAll',
  'Browse': 'landing.browse',
  'TRUST AND SECURITY': 'landing.trustSecurity',
  'Clear controls instead of unverified badges.': 'landing.clearControls',
  'Security practices': 'landing.securityPractices',
  'File processing policy': 'landing.processingPolicy',
  'Live status reflects the current online-tool availability check.': 'landing.healthNote',
  'AJN PDF home': 'landing.logoHome',
  'Back': 'common.back',
  'Change File': 'common.changeFile',
  'Change Source': 'common.changeFile',
  'Reset': 'common.reset',
  'Delete': 'common.remove',
  'Clear Queue': 'common.clearAll',
  'Discard All': 'common.clearAll',
  'Flush All': 'common.clearAll',
  'Flush Files': 'common.clearAll',
  'Flush Session': 'common.clearAll',
  'Flush Workspace': 'common.clearAll',
  'Calibration': 'common.settings',
  'Configuration': 'common.settings',
  'Operation Setup': 'common.settings',
  'Document Setup': 'common.settings',
  'Report Setup': 'common.settings',
  'Neural Parameters': 'common.settings',
  'Logic Control': 'common.settings',
  'Controls': 'common.settings',
  'Position': 'common.position',
  'Color': 'common.color',
  'Color & Orientation': 'common.rotation',
  'Rotation': 'common.rotation',
  'Size': 'common.size',
  'Output Format': 'common.format',
  'Output Name': 'common.outputName',
  'Output file': 'common.outputName',
  'Page': 'common.page',
  'Pages': 'common.pages',
  'WIDTH': 'common.width',
  'HEIGHT': 'common.height',
  'X Position': 'common.position',
  'Y Position': 'common.position',
  'Horizontal': 'common.horizontal',
  'Vertical': 'common.vertical',
  'Top Left': 'common.top',
  'Top Center': 'common.top',
  'Top Right': 'common.top',
  'Bottom Left': 'common.bottom',
  'Bottom Center': 'common.bottom',
  'Bottom Right': 'common.bottom',
  'Overlay Visualization': 'common.preview',
  'Synthesis Preview': 'common.preview',
  'Synthesis Viewport': 'common.preview',
  'A4 Synthesis Preview': 'common.preview',
  'Asset Viewport': 'common.preview',
  'Data Stream Preview': 'common.preview',
  'Live Studio Preview': 'common.preview',
  'Live Viewport': 'common.preview',
  'Placement Preview': 'common.preview',
  'Scaling Viewport': 'common.preview',
  'Studio Viewport': 'common.preview',
  'Interactive Workspace': 'tool.customize',
  'Active Workspace': 'tool.customize',
  'Visual Alignment Hub': 'tool.customize',
  'Drop PDF to Annotate': 'upload.choose',
  'Drop PDF to Brand': 'upload.choose',
  'Drop PDF to Flatten': 'upload.choose',
  'Drop PDF to Index': 'upload.choose',
  'Drop PDF to Inspect': 'upload.choose',
  'Drop PDF to Load': 'upload.choose',
  'Drop PDF to Prune': 'upload.choose',
  'Drop PDF to Reframe': 'upload.choose',
  'Drop PDF to Rotate': 'upload.choose',
  'Drop PDF to Scrape': 'upload.choose',
  'Drop PDF to Sign': 'upload.choose',
  'Drop .heic Files': 'upload.chooseMany',
  'Drop Archive to Extract': 'upload.choose',
  'Drop Data File': 'upload.choose',
  'Drop JSON File': 'upload.choose',
  'Drop Transcript File': 'upload.choose',
  'Drop TXT File': 'upload.choose',
  'Multi-File Ingestion Enabled': 'upload.chooseMany',
  'Manual Content Ingestion': 'upload.choose',
  'Native iOS Ingestion': 'upload.chooseMany',
  'Local Character Mapping': 'processing.browser',
  'Local Metadata Buffer': 'processing.browser',
  'Local Schema Rendering': 'processing.browser',
  'Local Session': 'processing.browser',
  'Safe session active': 'processing.browser',
  'Private browser processing': 'processing.browser',
  'Browser processing': 'processing.browser',
  'Browser processing ready': 'processing.browser',
  'Verified Buffer': 'common.fileReady',
  'Ready to Correct': 'common.ready',
  'Ready to Purge': 'common.ready',
  'Engine Standby': 'common.ready',
  'Unit Active': 'common.ready',
  ' workspace ready': 'common.ready',
  'Extraction Ready': 'result.ready',
  'Extraction Success': 'result.ready',
  'Conversion complete': 'result.ready',
  'Final Result': 'result.ready',
  'Finalized': 'result.ready',
  'FINALIZED': 'result.ready',
  'PDF READY': 'result.ready',
  'IMAGE READY': 'result.ready',
  'Result Buffer': 'result.ready',
  'Document correctly branded': 'result.ready',
  'Document correctly flattened': 'result.ready',
  'Document correctly modified': 'result.ready',
  'Document correctly oriented': 'result.ready',
  'Document correctly paginated': 'result.ready',
  'Document correctly re-engineered': 'result.ready',
  'Document correctly reframed': 'result.ready',
  'Document correctly signed and synthesized': 'result.ready',
  'Document correctly synthesized': 'result.ready',
  'Image correctly retouched and optimized': 'result.ready',
  'Image correctly synthesized and compressed': 'result.ready',
  'iOS assets correctly synthesized': 'result.ready',
  'Pixel layer correctly embedded into PDF': 'result.ready',
  'Report correctly generated': 'result.ready',
  'Subtitle file created successfully': 'result.ready',
  'Unwanted segments removed': 'result.ready',
  'Executing Inject': 'processing.applying',
  'Executing Render': 'processing.processing',
  'Creating document…': 'processing.creatingPdf',
  'Starting': 'processing.preparing',
  'Preparing': 'processing.preparing',
  'Processing': 'processing.processing',
  'Finishing': 'processing.finishing',
  'Processing image': 'processing.processing',
  'Calibrating...': 'processing.preparing',
  'Converting file': 'processing.converting',
  'Attempt Repair': 'common.start',
  'Finalize and Compile PDF': 'common.apply',
  'Re-Apply Split Rules': 'common.apply',
  'Initialize Scan': 'common.start',
  'Capture Page': 'common.apply',
  'Start Viewfinder': 'common.start',
  'Download result': 'common.download',
  'Download .txt': 'common.download',
  'Save as .txt': 'common.download',
  'Convert another': 'common.processAnother',
  'Strip Metadata': 'common.clear',
  'Select Pages to Delete': 'tool.choosePages',
  'Select PDF files': 'common.chooseFiles',
  'Recommended workflow': 'common.recommended',
  'Related tools for the next step': 'tool.related',
  'Useful tips': 'tool.tips',
  'Important limitations': 'tool.limitations',
  'Important limits': 'tool.limitations',
  'Common uses': 'tool.commonUses',
  'Processing mode': 'tool.processingMode',
  'Report a problem': 'common.tryAgain',
};

export function translateVisibleText(language: LanguageCode, input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return input;
  const key = legacyPhraseToKey[trimmed];
  if (key) {
    const translated = translateKey(language, key);
    return input.replace(trimmed, translated);
  }
  // Common dynamic strings used by tool cards and file summaries.
  let m = trimmed.match(/^(\d+) available$/i);
  if (m) return input.replace(trimmed, `${m[1]} ${translateKey(language, 'common.available')}`);
  m = trimmed.match(/^(\d+) pages?$/i);
  if (m) return input.replace(trimmed, translateKey(language, 'common.pageCount', { count: m[1] }));
  m = trimmed.match(/^(\d+) files?$/i);
  if (m) return input.replace(trimmed, translateKey(language, 'common.fileCount', { count: m[1] }));
  return input;
}
