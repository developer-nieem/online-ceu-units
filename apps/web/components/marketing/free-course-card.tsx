import { Badge } from '@calace/ui/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTitle } from '@calace/ui/components/ui/card';
import { Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { mediaUrl } from '@/lib/media-url';

export type FreeCourseCardProps = {
  slug: string;
  title: string;
  summary: string;
  heroImage: string | null;
  /** Destination for the whole card (course detail or register funnel). */
  href: string;
};

export function FreeCourseCard({ title, summary, heroImage, href }: FreeCourseCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
    >
      <Card className="flex h-full w-full flex-col overflow-hidden border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-white shadow-amber-100/50">
        <div className="relative aspect-[16/10] overflow-hidden bg-teal-800/10">
          {heroImage ? (
            <Image
              alt={title}
              className="object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02]"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={mediaUrl(heroImage)}
              unoptimized
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-800"
            />
          )}
        </div>

        <CardHeader className="flex-1 space-y-2 pb-2">
          <Badge className="w-fit gap-1 border-amber-400 bg-amber-500 text-white hover:bg-amber-500">
            <Gift className="h-3 w-3" aria-hidden />
            FREE
          </Badge>
          <CardTitle className="line-clamp-2 text-lg leading-snug text-teal-950 group-hover:text-teal-800">
            {title}
          </CardTitle>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </CardHeader>

        <CardFooter className="border-t border-amber-200/80 bg-amber-50/40 pt-4">
          <span className="inline-flex h-9 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white group-hover:bg-teal-800">
            Start for Free
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
