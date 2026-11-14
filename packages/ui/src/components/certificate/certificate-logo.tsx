import * as React from 'react';

import { cn } from '../../lib/utils';

import { CertificateImage } from './certificate-image';

export interface CertificateLogoProps {
  src: string;
  fallbackSrc?: string | string[];
  alt?: string;
  className?: string;
}

export function CertificateLogo({
  src,
  fallbackSrc,
  alt = 'Institution logo',
  className,
}: CertificateLogoProps) {
  return (
    <div className={cn('certificate__logo-wrap', className)}>
      <CertificateImage
        alt={alt}
        className="certificate__logo"
        fallbackSrc={fallbackSrc}
        fetchPriority="high"
        src={src}
      />
    </div>
  );
}
