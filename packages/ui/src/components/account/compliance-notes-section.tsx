import { PROFILE_COMPLIANCE_DISCLAIMER } from './constants';
import { ProfileSection } from './profile-section';

export interface ComplianceNotesSectionProps {
  className?: string;
}

export function ComplianceNotesSection({ className }: ComplianceNotesSectionProps) {
  return (
    <ProfileSection
      className={className}
      headingId="compliance-notes-heading"
      title="Compliance Notes"
    >
      <div
        className="space-y-3 rounded-md border border-border bg-muted/30 px-4 py-4 text-sm leading-relaxed text-muted-foreground"
        role="note"
      >
        {PROFILE_COMPLIANCE_DISCLAIMER.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </ProfileSection>
  );
}
