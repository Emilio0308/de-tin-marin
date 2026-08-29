const CDN_BASE =
  process.env.NEXT_PUBLIC_MEDIA_CDN_BASE_URL?.replace(/\/$/, "") ?? "";

/** URLs servidas por CloudFront — ya optimizadas; evitar proxy `/_next/image`. */
export function isMediaCdnImageUrl(url: string): boolean {
  return CDN_BASE.length > 0 && url.startsWith(CDN_BASE);
}
