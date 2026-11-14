'use client';

import { Input } from '@calace/ui/components/ui/input';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { TranscriptEntryRecord } from '@/lib/credentials-types';

export function TranscriptTable({
  entries,
  showSearch = true,
}: {
  entries: TranscriptEntryRecord[];
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.certificateNo?.toLowerCase().includes(q) ?? false) ||
        (e.sourceRef?.toLowerCase().includes(q) ?? false),
    );
  }, [entries, query]);

  return (
    <div className="space-y-3">
      {showSearch ? (
        <Input
          type="search"
          placeholder="Search courses, certificate numbers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search transcript"
          className="max-w-md"
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <div
          className="grid min-w-[640px] grid-cols-[6rem_1fr_5rem_8rem_5rem] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          role="row"
        >
          <span role="columnheader">Date</span>
          <span role="columnheader">Activity</span>
          <span role="columnheader" className="text-right">
            CEU
          </span>
          <span role="columnheader">Certificate</span>
          <span role="columnheader">Type</span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No transcript entries match your search.
          </p>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className="grid min-w-[640px] grid-cols-[6rem_1fr_5rem_8rem_5rem] gap-2 border-b px-3 py-3 text-sm last:border-0"
              role="row"
            >
              <span className="whitespace-nowrap text-muted-foreground">{entry.completedOn}</span>
              <span>
                <span className="font-medium">{entry.title}</span>
                {entry.categorySlug ? (
                  <span className="block text-xs text-muted-foreground">{entry.categorySlug}</span>
                ) : null}
              </span>
              <span className="text-right font-medium">
                {entry.onlineCeuHoursLabel ?? `${entry.ceHours} hr`}
              </span>
              <span className="font-mono text-xs">
                {entry.verificationAvailable && entry.verificationUrl ? (
                  <Link
                    href={entry.verificationUrl}
                    className="text-teal-800 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.certificateNo ?? 'Verify'}
                  </Link>
                ) : (
                  (entry.certificateNo ?? '—')
                )}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {entry.entryType.toLowerCase()}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Transcript entries are immutable. Admin corrections will appear as separate adjustment
        entries (future).
      </p>
    </div>
  );
}
