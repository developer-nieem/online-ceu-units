import { PortalPage, PortalPanel } from '@/components/learner/portal-page';

export const metadata = {
  title: 'Blog & Updates | CAL ACE Nursing Academy',
};

export default function BlogPage() {
  return (
    <PortalPage
      description="News, regulatory updates, and educational announcements from CAL ACE Nursing Academy."
      title="Blog & updates"
    >
      <PortalPanel>
        <p className="text-sm font-medium text-slate-900">Coming soon</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This section will share CDPH regulatory updates, new course announcements, and CNA renewal
          reminders. Check back for institutional news and learner updates.
        </p>
      </PortalPanel>
    </PortalPage>
  );
}
