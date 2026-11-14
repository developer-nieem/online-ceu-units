import { AdminComplianceSettingsForm } from '@/components/admin/admin-compliance-settings-form';
import type { ProviderComplianceSettings } from '@/lib/admin';
import { getAdminComplianceSettings } from '@/lib/admin-server';

const DEFAULT_SETTINGS: ProviderComplianceSettings = {
  providerName: 'CAL ACE Nursing Academy',
  nacProviderReference: '',
  providerContactEmail: 'support@onlineceunits.com',
  providerContactPhone: '',
  providerContactAddress: '',
  supportContactEmail: 'support@onlineceunits.com',
  supportContactUrl: '/support',
  recordRetentionPolicyText: '',
  certificateWordingTemplate: '{{hours}} Online CE hour(s)',
  attestationText:
    'I attest that I personally completed this online continuing education course, participated actively as required, and that the name on this certificate is correct.',
  showApprovalStatusToLearners: false,
  cdphOnlineApproved: false,
  courseApprovalStatusLabel: 'Approved for online delivery (placeholder)',
  defaultInstructorName: 'CAL ACE Instructional Team',
  defaultCeHoursPerCourse: 1,
  minutesPerOnlineCeuHour: 50,
  internalAuditExportNote: '',
};

export default async function AdminComplianceSettingsPage() {
  const data = await getAdminComplianceSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Provider compliance settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin-only configuration for online CE provider behavior. Per-course approval and
          instructor assignment remain in the Content CMS compliance tab.
        </p>
      </div>

      {!data ? (
        <p className="text-sm text-amber-800">Could not load settings. Ensure you are signed in as admin.</p>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <AdminComplianceSettingsForm
            initial={{ ...DEFAULT_SETTINGS, ...data.settings }}
            internalNote={
              data.internalOnly?.internalAuditExportNote ??
              DEFAULT_SETTINGS.internalAuditExportNote
            }
          />
        </div>
      )}
    </div>
  );
}
