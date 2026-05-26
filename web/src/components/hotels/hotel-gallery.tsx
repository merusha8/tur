"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shouldUnoptimizeImage } from "@/lib/image-utils";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80";

interface HotelGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

function GalleryImage({
  src,
  alt,
  priority = false,
  className,
  sizes,
  onClick,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("relative block h-full w-full overflow-hidden bg-gray-100", onClick && "cursor-zoom-in")}
      aria-label={onClick ? "Open fullscreen preview" : undefined}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)}
        onLoad={() => setLoaded(true)}
        unoptimized={shouldUnoptimizeImage(src)}
      />
    </Wrapper>
  );
}

export function HotelGallery({ images, alt, className }: HotelGalleryProps) {
  const slides = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const total = slides.length;
  const current = ((index % total) + total) % total;

  const goTo = useCallback(
    (next: number) => setIndex((next + total) % total),
    [total],
  );

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    thumbRefs.current[current]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [current]);

  useEffect(() => {
    if (!fullscreen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, goPrev, goNext]);

  const counter = `${current + 1} / ${total}`;

  const navButtons = (size: "default" | "lg" = "default") => (
    <>
      {total > 1 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 z-10 -translate-y-1/2 border-0 bg-white/90 shadow-md hover:bg-white",
              size === "lg" ? "left-4 h-12 w-12" : "left-3 h-9 w-9",
            )}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous photo"
          >
            <ChevronLeft className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 z-10 -translate-y-1/2 border-0 bg-white/90 shadow-md hover:bg-white",
              size === "lg" ? "right-4 h-12 w-12" : "right-3 h-9 w-9",
            )}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next photo"
          >
            <ChevronRight className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
          </Button>
        </>
      )}
    </>
  );

  const fullscreenOverlay = mounted && fullscreen && createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Hotel photo gallery">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">{counter}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setFullscreen(false)}
          aria-label="Close fullscreen"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {navButtons("lg")}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative h-full w-full max-h-[calc(100vh-180px)] max-w-6xl"
          >
            <GalleryImage
              src={slides[current]}
              alt={`${alt} — photo ${current + 1}`}
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {slides.map((src, i) => (
              <button
                key={`fs-thumb-${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  i === current ? "border-[#8DD3BB] ring-2 ring-[#8DD3BB]/40" : "border-transparent opacity-60 hover:opacity-100",
                )}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === current}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="96px"
                  loading="lazy"
                  className="object-cover"
                  unoptimized={shouldUnoptimizeImage(src)}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
        <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <GalleryImage
                src={slides[current]}
                alt={`${alt} — photo ${current + 1}`}
                priority={current === 0}
                sizes="(max-width: 768px) 100vw, 70vw"
                onClick={() => setFullscreen(true)}
              />
            </motion.div>
          </AnimatePresence>

          {navButtons()}

          <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {counter}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute bottom-3 right-3 h-9 w-9 border-0 bg-white/90 shadow-md hover:bg-white"
            onClick={() => setFullscreen(true)}
            aria-label="Fullscreen preview"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {total > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {slides.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              ref={(el) => { thumbRefs.current[i] = el; }}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Photo ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all md:h-24 md:w-32",
                i === current
                  ? "border-[#8DD3BB] ring-2 ring-[#8DD3BB]/30"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="128px"
                loading="lazy"
                className="object-cover"
                unoptimized={shouldUnoptimizeImage(src)}
              />
            </button>
          ))}
        </div>
      )}

      {fullscreenOverlay}
    </div>
  );
}
