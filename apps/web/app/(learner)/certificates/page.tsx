import { Award } from 'lucide-react';

import { CertificateViewer } from '@/components/certificates/certificate-viewer';
import { SampleCertificatePreview } from '@/components/certificates/sample-certificate-preview';
import { PageHeader } from '@/components/learner/page-header';
import { PlaceholderPanel } from '@/components/learner/placeholder-panel';
import { getMyCertificates } from '@/lib/certificates-server';

export default async function CertificatesPage() {
  const certificates = await getMyCertificates();

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title="Certificates"
        description="Official CEU certificates with QR verification and printable PDF downloads."
      />

      {certificates.length === 0 ? (
        <div className="space-y-6">
          <PlaceholderPanel
            title="No certificates yet"
            description="Complete a course to receive an issued certificate automatically."
            icon={Award}
          />
          <SampleCertificatePreview />
        </div>
      ) : (
        <div className="space-y-8">
          {certificates.map((certificate) => (
            <CertificateViewer key={certificate.id} certificate={certificate} />
          ))}
          <SampleCertificatePreview compact />
        </div>
      )}
    </div>
  );
}
