export const ADSENSE_PUBLISHER =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-4495802176396975';

export const ADSENSE_SLOTS = {
  homePrimary: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_PRIMARY || '3648223351',
  homeSecondary: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_SECONDARY || '4849624383',
  toolContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_CONTENT || '1601180258',
  blogContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_CONTENT || '',
} as const;

export type AdPlacement = keyof typeof ADSENSE_SLOTS;
