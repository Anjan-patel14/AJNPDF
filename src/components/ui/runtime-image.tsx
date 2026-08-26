import type { ImgHTMLAttributes } from 'react';

type RuntimeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> & {
  alt: string;
};

/**
 * RuntimeImage is intentionally used for Blob URLs, data URLs and runtime media.
 * These sources cannot safely use the Next.js image optimizer without preconfigured hosts
 * and, for local previews, must never be uploaded to an optimizer endpoint.
 */
/* eslint-disable @next/next/no-img-element -- Runtime-only preview/media URLs intentionally bypass Next image optimization. */
export function RuntimeImage({ alt, ...props }: RuntimeImageProps) {
  return <img alt={alt} {...props} />;
}
