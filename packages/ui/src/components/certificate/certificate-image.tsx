'use client';

import * as React from 'react';

function normalizeSources(src: string, fallbackSrc?: string | string[]): string[] {
  const fallbacks = fallbackSrc
    ? Array.isArray(fallbackSrc)
      ? fallbackSrc
      : [fallbackSrc]
    : [];

  return [src, ...fallbacks];
}

export interface CertificateImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src: string;
  /** Single fallback or ordered chain (e.g. local PNG, then SVG placeholder). */
  fallbackSrc?: string | string[];
}

/**
 * Certificate image with graceful degradation — walks an ordered source chain on
 * load failure and hides entirely (no broken-image icon) if all sources fail.
 */
export function CertificateImage({
  src,
  fallbackSrc,
  alt = '',
  ...props
}: CertificateImageProps) {
  const sources = React.useMemo(() => normalizeSources(src, fallbackSrc), [src, fallbackSrc]);
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    setSourceIndex(0);
    setHidden(false);
  }, [sources]);

  const handleError = React.useCallback(() => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((index) => index + 1);
      return;
    }

    setHidden(true);
  }, [sourceIndex, sources.length]);

  if (hidden) {
    return null;
  }

  return (
    <img
      {...props}
      alt={alt}
      decoding="async"
      draggable={false}
      src={sources[sourceIndex]}
      onError={handleError}
    />
  );
}
