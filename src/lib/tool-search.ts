import type { ServiceTool } from './tools-data';

const TOKEN_EXPANSIONS: Record<string, string[]> = {
  combine: ['merge', 'join'], join: ['merge', 'combine'], bundle: ['merge'],
  separate: ['split', 'extract'], divide: ['split'], cut: ['split', 'crop'],
  smaller: ['compress', 'reduce', 'size'], reduce: ['compress', 'smaller', 'optimize'], shrink: ['compress', 'reduce'],
  photo: ['image', 'jpg', 'jpeg'], picture: ['image', 'jpg', 'png'], photos: ['image', 'jpg', 'jpeg'],
  scan: ['', 'scanner', 'searchable'], scanned: ['', 'scanner'], read: ['', 'text'],
  word: ['doc', 'docx'], document: ['doc', 'docx', 'pdf'], spreadsheet: ['excel', 'xls', 'xlsx'],
  slides: ['powerpoint', 'ppt', 'pptx'], presentation: ['powerpoint', 'ppt', 'pptx'],
  password: ['protect', 'unlock', 'encrypt'], secure: ['protect', 'encrypt'], decrypt: ['unlock'],
  reorder: ['organize', 'pages'], arrange: ['organize', 'pages'], remove: ['delete', 'extract'],
  text: ['txt', '', 'word'], web: ['html', 'url'], email: ['eml', 'msg'],
};

const STOP_WORDS = new Set(['a', 'an', 'the', 'my', 'please', 'tool', 'online', 'free', 'file', 'files', 'make']);

export function normalizeToolSearch(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function scoreToolSearch(
  query: string,
  tool: ServiceTool,
  localized: { name: string; desc: string; aliases: string[] },
): number {
  const q = normalizeToolSearch(query);
  if (!q) return 1;
  const name = normalizeToolSearch(localized.name);
  const haystack = normalizeToolSearch([tool.id, localized.name, localized.desc, ...localized.aliases, ...tool.keywords].join(' '));
  let score = 0;
  if (name === q) score += 220;
  else if (name.startsWith(q)) score += 160;
  else if (name.includes(q)) score += 120;
  if (haystack.includes(q)) score += 90;

  const rawTokens = q.split(' ').filter((token) => token && !STOP_WORDS.has(token));
  const expanded = rawTokens.map((token) => [token, ...(TOKEN_EXPANSIONS[token] || [])]);
  for (const candidates of expanded) {
    let best = 0;
    for (const candidate of candidates) {
      if (name.split(' ').includes(candidate)) best = Math.max(best, 34);
      else if (name.includes(candidate)) best = Math.max(best, 28);
      else if (haystack.includes(candidate)) best = Math.max(best, 18);
    }
    score += best;
  }

  if (rawTokens.length > 1 && rawTokens.every((token) => haystack.includes(token) || (TOKEN_EXPANSIONS[token] || []).some((alt) => haystack.includes(alt)))) score += 45;
  if (score > 0 && tool.badge === 'Popular') score += 3;
  return score;
}
