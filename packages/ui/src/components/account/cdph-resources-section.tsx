import { CDPH_RESOURCES } from './constants';
import { ProfileSection } from './profile-section';

export interface CdphResourcesSectionProps {
  className?: string;
}

export function CdphResourcesSection({ className }: CdphResourcesSectionProps) {
  return (
    <ProfileSection
      className={className}
      description="Official California Department of Public Health (CDPH) forms and submission resources."
      headingId="cdph-resources-heading"
      title="CDPH Resources"
    >
      <ul className="space-y-3">
        {CDPH_RESOURCES.map((resource) => (
          <li key={resource.href}>
            <a
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              href={resource.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {resource.label}
            </a>
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
