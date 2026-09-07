'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * A single app-wide lightbox for manager photos.
 *
 * Any Avatar that has actually loaded its /mascots/<id>.png can open the full
 * image here. Kept as one shared overlay (rather than one per avatar) so there
 * is a single Escape handler, a single scroll lock and no duplicated markup.
 *
 * The provider is mounted once in the root layout. Avatars call `usePhotoViewer`
 * and, when there is no provider (e.g. an isolated render), simply do nothing —
 * the image still shows, it just is not clickable.
 */

type Photo = { src: string; name: string; caption?: string };

type ViewerContext = {
  open: (photo: Photo) => void;
};

const Context = createContext<ViewerContext | null>(null);

export function usePhotoViewer(): ViewerContext | null {
  return useContext(Context);
}

export function PhotoViewerProvider({ children }: { children: React.ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null);

  const open = useCallback((next: Photo) => setPhoto(next), []);
  const close = useCallback(() => setPhoto(null), []);

  // Escape to close, and lock body scroll while open.
  useEffect(() => {
    if (!photo) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [photo, close]);

  return (
    <Context.Provider value={{ open }}>
      {children}

      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.name} photo`}
          onClick={close}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <Icon name="x" size={18} strokeWidth={2.4} aria-hidden />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element -- local asset, full-resolution view */}
          <img
            src={photo.src}
            alt={photo.name}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[82vh] max-w-full rounded-card border border-white/15 object-contain shadow-2xl"
          />

          <p className="text-center text-sm font-semibold text-white/90">
            {photo.name}
            {photo.caption ? <span className="text-white/55"> · {photo.caption}</span> : null}
          </p>
        </div>
      )}
    </Context.Provider>
  );
}
