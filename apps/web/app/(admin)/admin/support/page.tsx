import { AdminSupportBoard } from '@/components/admin/admin-support-board';
import { getAdminSupport } from '@/lib/admin-server';

export default async function AdminSupportPage() {
  const data = await getAdminSupport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Support</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review student tickets, update their status, and send a reply students can read on the
          Support page.
        </p>
      </div>

      {!data ? (
        <p className="text-sm text-slate-500">Unable to load support tickets.</p>
      ) : (
        <AdminSupportBoard initial={data} />
      )}
    </div>
  );
}
