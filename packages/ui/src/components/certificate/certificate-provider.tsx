import type { CertificateProviderInfo } from './types';

export interface CertificateProviderProps {
  provider?: CertificateProviderInfo;
  /** @deprecated Use `provider` */
  providerInfo?: string;
  /** When true, the institution line is not rendered here (it is shown in the header instead). */
  hideInstitution?: boolean;
}

export function CertificateProvider({ provider, providerInfo, hideInstitution }: CertificateProviderProps) {
  if (provider) {
    return (
      <div className="certificate__provider">
        {!hideInstitution && provider.institutionLine ? (
          <p className="certificate__provider-line">{provider.institutionLine}</p>
        ) : null}
        <p className="certificate__provider-line">{provider.accreditationLine}</p>
      </div>
    );
  }

  if (providerInfo) {
    return <p className="certificate__provider certificate__provider--legacy">{providerInfo}</p>;
  }

  return null;
}
