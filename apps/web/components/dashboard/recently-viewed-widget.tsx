import { Card, CardContent, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { History } from 'lucide-react';
import Link from 'next/link';

import type { RecentlyViewedItem } from '@/lib/enrollment';

export function RecentlyViewedWidget({ items }: { items: RecentlyViewedItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-teal-700" aria-hidden />
          Recently viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Courses you view will appear here.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/courses/${item.slug}`}
                  className="text-sm font-medium text-teal-800 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.viewedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
