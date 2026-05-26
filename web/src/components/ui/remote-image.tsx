"use client";

import Image, { type ImageProps } from "next/image";
import { shouldUnoptimizeImage } from "@/lib/image-utils";

/** Image wrapper that loads remote URLs directly (no server-side fetch). */
export function RemoteImage({ src, unoptimized, alt = "", ...props }: ImageProps) {
  const remote = typeof src === "string" && shouldUnoptimizeImage(src);
  return <Image src={src} alt={alt} unoptimized={unoptimized ?? remote} {...props} />;
}
