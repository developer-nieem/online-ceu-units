import { PortalPage, PortalPanel } from '@/components/learner/portal-page';
import { getCatalogCourses } from '@/lib/catalog-server';

export const metadata = {
  title: 'Pricing & Promotions | CAL ACE Nursing Academy',
};

export default async function PricingPage() {
  const catalog = await getCatalogCourses();

  return (
    <PortalPage
      description="Course pricing and promotional offers for CAL ACE continuing education."
      title="Pricing & promotions"
    >
      <PortalPanel>
        <p className="text-sm font-medium text-slate-900">Standard course pricing</p>
        <p className="mt-2 text-sm text-slate-600">
          Each online CE course awards 1 CE Unit. Pricing details and promotional bundles will be
          published here when enrollment checkout is connected.
        </p>
      </PortalPanel>

      <ul className="space-y-3">
        {catalog.slice(0, 3).map((course) => (
          <li key={course.slug}>
            <PortalPanel>
              <p className="font-semibold text-slate-900">{course.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {course.ceHours} CE Unit · Pricing TBD
              </p>
            </PortalPanel>
          </li>
        ))}
      </ul>
    </PortalPage>
  );
}
