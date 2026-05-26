import type { StaticImageData } from "next/image";

export function isRemoteImageSrc(src: string | StaticImageData): src is string {
  return typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"));
}

export function shouldUnoptimizeImage(src: string | StaticImageData): boolean {
  return isRemoteImageSrc(src);
}

export const FALLBACK_TRAVEL_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";
