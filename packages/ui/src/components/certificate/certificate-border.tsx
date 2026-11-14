import * as React from 'react';

import { cn } from '../../lib/utils';

import { CertificateImage } from './certificate-image';
import {
  CERTIFICATE_BORDER_PLACEHOLDER_SRC,
  DEFAULT_CERTIFICATE_BORDER_OPACITY,
} from './constants';
import type { CertificateBorderOptions } from './types';

export interface CertificateBorderProps {
  options?: CertificateBorderOptions;
  src?: string;
  fallbackSrc?: string | string[];
  className?: string;
}

function resolveBorder(options?: CertificateBorderOptions, srcOverride?: string) {
  if (options?.enabled !== true) {
    return null;
  }

  const src = srcOverride ?? options?.src ?? CERTIFICATE_BORDER_PLACEHOLDER_SRC;
  const opacity = options?.opacity ?? DEFAULT_CERTIFICATE_BORDER_OPACITY;

  return { src, opacity: Math.min(Math.max(opacity, 0), 1) };
}

export function CertificateBorder({
  options,
  src,
  fallbackSrc,
  className,
}: CertificateBorderProps) {
  const resolved = resolveBorder(options, src);

  if (!resolved) {
    return null;
  }

  const { src: imageSrc, opacity } = resolved;

  return (
    <div
      aria-hidden="true"
      className={cn('certificate__border pointer-events-none select-none', className)}
      style={
        {
          '--certificate-border-opacity': opacity,
        } as React.CSSProperties
      }
    >
      <CertificateImage
        alt=""
        className="certificate__border-image"
        fallbackSrc={fallbackSrc}
        src={imageSrc}
      />
    </div>
  );
}

/** @deprecated Use `CertificateBorder` */
export const CertificateBackground = CertificateBorder;
