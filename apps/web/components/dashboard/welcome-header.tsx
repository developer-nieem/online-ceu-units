'use client';

import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardContent } from '@calace/ui/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DASHBOARD_CNA_STUDENT_SRC = '/assets/dashboard-cna-student.jpg';

function getTimeOfDayEmoji(hour: number): string {
  return hour >= 6 && hour < 18 ? '☀️' : '🌙';
}

function computeTenure(memberSince: string | null | undefined): string | null {
  if (!memberSince) return null;

  const created = new Date(memberSince);
  if (Number.isNaN(created.getTime())) return null;

  const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return null;

  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'}`;
}

function TimeOfDayEmoji() {
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    setEmoji(getTimeOfDayEmoji(new Date().getHours()));
  }, []);

  if (!emoji) return null;

  return (
    <span aria-hidden className="ml-1">
      {emoji}
    </span>
  );
}

export function WelcomeHeader({
  firstName,
  name,
  emailVerified,
  memberSince,
}: {
  firstName: string;
  name: string;
  emailVerified: boolean;
  memberSince?: string | null;
}) {
  const tenure = computeTenure(memberSince);

  return (
    <Card className="relative overflow-hidden border-teal-100 bg-gradient-to-br from-teal-50 to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-1/3 lg:block"
      >
        <Image
          alt="CNA student learning online"
          className="h-full w-full object-cover object-top opacity-40"
          height={320}
          priority={false}
          src={DASHBOARD_CNA_STUDENT_SRC}
          width={280}
        />
      </div>
      <CardContent className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-teal-800">
            Welcome back, {firstName}
            <TimeOfDayEmoji />
          </p>
          {tenure ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve been with us {tenure} — thank you for continuing your learning journey
              with us.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Great to have you continuing your learning journey with us.
            </p>
          )}
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{name}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Track your California CNA renewal progress, complete CEU courses, and download
            certificates — all in one place.
          </p>
          {!emailVerified ? (
            <Badge variant="warning" className="w-fit max-w-xl text-left">
              <span>
                Email verification pending — verify to receive certificates and course alerts.{' '}
                <Link href="/verify-email" className="underline">
                  Verify now
                </Link>
              </span>
            </Badge>
          ) : (
            <Badge variant="success" className="w-fit">
              Account active
            </Badge>
          )}
        </div>
        <div className="rounded-lg border bg-white/50 p-4 text-center backdrop-blur-sm sm:min-w-[140px] lg:mr-48">
          <p className="text-3xl font-bold text-teal-800">24</p>
          <p className="text-xs text-muted-foreground">
            of your 48 CE hours can be completed online{' '}
            <span className="whitespace-nowrap">(per 2-year renewal)</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
