import * as React from 'react';

import { cn } from '../../lib/utils';

import { CertificateImage } from './certificate-image';
import type { CertificateSignatureInfo } from './types';

export interface CertificateSignatureProps extends CertificateSignatureInfo {
  imageSrc: string;
  fallbackSrc?: string | string[];
  className?: string;
}

export function CertificateSignature({
  imageSrc,
  fallbackSrc,
  name,
  title,
  additionalLines,
  className,
}: CertificateSignatureProps) {
  return (
    <div className={cn('certificate__signature', className)}>
      <CertificateImage
        alt=""
        aria-hidden="true"
        className="certificate__signature-image"
        fallbackSrc={fallbackSrc}
        src={imageSrc}
      />
      <p className="certificate__signature-name">{name}</p>
      <p className="certificate__signature-title">{title}</p>
      {additionalLines?.map((line) => (
        <p key={line} className="certificate__signature-title">
          {line}
        </p>
      ))}
    </div>
  );
}
