# Certificate visual assets

Official hosted assets are used by default. Local paths serve as fallbacks when remote loading fails.

## Official hosted assets

| Asset | URL |
| ----- | --- |
| Logo | `https://cna.school/wp-content/uploads/2021/02/cropped-cna-school-near-me-logo.webp` |
| Signature | `https://cna.school/wp-content/uploads/2026/05/Fake-Signature.png` |

These are configured in `packages/ui/src/components/certificate/constants.ts` as `OFFICIAL_CERTIFICATE_LOGO_URL` and `OFFICIAL_CERTIFICATE_SIGNATURE_URL`.

## Fallback chain

Each image walks this order on load failure — no broken-image icons appear on certificates or PDFs:

1. Official hosted URL (default)
2. Local override in `apps/web/public/certificates/` (optional self-hosting)
3. Checked-in SVG placeholder

| Local fallback file | Purpose |
| ------------------- | ------- |
| `apps/web/public/certificates/logo.png` | Self-hosted logo override |
| `apps/web/public/certificates/signature.png` | Self-hosted signature override |
| `apps/web/public/certificates/border.png` | Decorative outer frame |

| SVG placeholder | Purpose |
| --------------- | ------- |
| `logo-placeholder.svg` | Last-resort logo |
| `signature-placeholder.svg` | Last-resort signature line |
| `border-placeholder.svg` | Last-resort border frame |

## Usage

```tsx
import '@calace/ui/certificate.css';
import {
  Certificate,
  CertificateAssetPreload,
} from '@calace/ui/components/certificate';

<>
  <CertificateAssetPreload />
  <Certificate
    institutionName="California Academy of Leadership and Continuing Education (CAL ACE), LLC"
    recipientName="Jane Doe, RN"
    courseTitle="Infection Control & Prevention for Healthcare Settings"
    ceHours={1}
    certificateNo="CAL-2026-000142"
    issuedAt="2026-05-28"
    signature={{
      name: 'Dr. Cliff Roperez, DBA, LVN',
      title: 'School Administrator',
    }}
    border={{ enabled: true, opacity: 0.07 }}
    layout={{ orientation: 'landscape' }}
  />
</>
```

Official logo and signature are applied automatically. Override or add fallbacks via `assets`:

```tsx
assets={{
  logo: 'https://cna.school/wp-content/uploads/2021/02/cropped-cna-school-near-me-logo.webp',
  logoFallback: '/certificates/logo.png',
  signature: 'https://cna.school/wp-content/uploads/2026/05/Fake-Signature.png',
  signatureFallback: '/certificates/signature.png',
}}
```

## CE hours formatting

| Input | Display |
| ----- | ------- |
| `1` | `1 Continuing Education Hour` |
| `2` | `2 Continuing Education Hours` |
| `1.0` | `1.0 CE Hour` |
| `1.5` | `1.5 CE Hours` |

Use `formatCeHours()` from `@calace/ui/components/certificate` when rendering hours outside the component.

## Print checklist

Preview at `/certificates/preview`, then print or export to PDF (landscape, letter):

- [ ] Logo and signature render at correct aspect ratio with transparency preserved
- [ ] Border frame is not clipped at page edges
- [ ] Footer compliance and retention text remain readable
- [ ] CE hours use regulator-friendly formatting
- [ ] All sources remain legible in grayscale

## Related files

| Path | Purpose |
| ---- | ------- |
| `packages/ui/src/components/certificate/` | Shared certificate component |
| `packages/ui/src/styles/certificate.css` | Typography, layout, print rules |

Per-tenant or per-certificate overrides can be stored in `Tenant.settings` or `Certificate.payload`:

```json
{
  "assets": {
    "logo": "https://cna.school/wp-content/uploads/2021/02/cropped-cna-school-near-me-logo.webp",
    "logoFallback": "/certificates/logo.png",
    "signature": "https://cna.school/wp-content/uploads/2026/05/Fake-Signature.png",
    "signatureFallback": "/certificates/signature.png"
  },
  "border": { "enabled": true, "opacity": 0.07 },
  "layout": { "orientation": "landscape" }
}
```
