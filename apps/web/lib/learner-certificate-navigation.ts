export function certificateViewerAnchorId(certificateId: string): string {
  return `certificate-viewer-${certificateId}`;
}

export function learnerCertificateHref(certificateId: string): string {
  return `/certificates#${certificateViewerAnchorId(certificateId)}`;
}
