export const AJN_BRAND = {
  developerName: 'Anjan Kumar',
  developerDisplayName: 'ANJAN',
  developerRole: 'Developer of AJN PDF',
  developerBio:
    'Anjan Kumar is the developer behind AJN PDF and AJN Studio. He builds practical PDF, image and document workflows with Next.js, React, TypeScript and Python, with an emphasis on clear interfaces, transparent file handling and useful results.',
  developerImage: '/images/anjan-kumar-developer.webp',
  developerImageJpeg: '/images/anjan-kumar-developer.jpg',
  developerImageThumb: '/images/anjan-kumar-developer-thumb.webp',
  developerOgImage: '/images/anjan-developer-og.jpg',
  studioName: 'AJN Studio',
  productName: 'AJN PDF',
  contactEmail: 'anjandev325@gmail.com',
  country: 'India',
  social: {
    instagram: 'https://www.instagram.com/anjan__patel',
    youtube: 'https://www.youtube.com/@anjan-patel-324',
  },
} as const;

export const AJN_PRODUCT_ALTERNATE_NAMES = ['AJN PDF', 'AJN PDF Tools'] as const;
export const AJN_STUDIO_ALTERNATE_NAMES = ['AJN Studio', 'AJN'] as const;
export const AJN_ALTERNATE_NAMES = AJN_PRODUCT_ALTERNATE_NAMES;
export const AJN_CONFIRMED_SOCIAL_LINKS = Object.values(AJN_BRAND.social);
