'use client';

import type { ContentBlock } from '@calace/content-blocks';
import { Button } from '@calace/ui/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { mediaUrl } from '@/lib/media-url';

import { LessonVideoPlayer } from './blocks/lesson-video-player';

type VideoBlockPayload = Extract<ContentBlock, { type: 'video' }> & {
  embedUrl?: string | null;
};

type EmbedProvider = 'youtube' | 'vimeo';

function resolveSourceUrl(block: VideoBlockPayload): string | null {
  const candidates = [block.videoUrl, block.embedUrl]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  const mp4 = candidates.find((url) => isDirectMp4(url));
  if (mp4) return mp4;

  return candidates[0] ?? null;
}

function parseYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '');
      return id || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/')[2];
        return id || null;
      }
      const id = parsed.searchParams.get('v');
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

function parseVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('vimeo.com')) return null;
    const segments = parsed.pathname.split('/').filter(Boolean);
    const videoIndex = segments.indexOf('video');
    if (videoIndex >= 0 && segments[videoIndex + 1]) {
      return segments[videoIndex + 1] ?? null;
    }
    const last = segments[segments.length - 1];
    return last && /^\d+$/.test(last) ? last : null;
  } catch {
    return null;
  }
}

function isDirectMp4(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /\.mp4$/i.test(parsed.pathname);
  } catch {
    return /\.mp4(\?|$)/i.test(url);
  }
}

function resolveEmbed(url: string): { provider: EmbedProvider; embedUrl: string } | null {
  const youtubeId = parseYouTubeId(url);
  if (youtubeId) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = parseVimeoId(url);
  if (vimeoId) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
      return { provider: 'youtube', embedUrl: url };
    }
    if (parsed.hostname.includes('player.vimeo.com')) {
      return { provider: 'vimeo', embedUrl: url };
    }
  } catch {
    return null;
  }

  return null;
}

function WatchFallback({
  watched,
  onMarkWatched,
}: {
  watched: boolean;
  onMarkWatched: () => void;
}) {
  if (watched) {
    return (
      <p
        className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-800"
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Watched
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button type="button" size="sm" variant="outline" onClick={onMarkWatched}>
        Mark as Watched
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Video didn&apos;t register? Use this after you&apos;ve finished watching.
      </p>
    </div>
  );
}

function VideoWithFallback({
  watched,
  onComplete,
  onEnded,
  children,
}: {
  watched: boolean;
  onComplete?: (params: { selectedOptionId: 'watched' }) => void;
  onEnded?: () => void;
  children: (handleEnded: () => void) => ReactNode;
}) {
  const [completed, setCompleted] = useState(watched);

  useEffect(() => {
    if (watched) setCompleted(true);
  }, [watched]);

  function markComplete() {
    if (completed) return;
    setCompleted(true);
    onComplete?.({ selectedOptionId: 'watched' });
  }

  function handleEnded() {
    if (completed) return;
    setCompleted(true);
    onEnded?.();
  }

  return (
    <div className="space-y-3">
      {children(handleEnded)}
      <WatchFallback watched={completed} onMarkWatched={markComplete} />
    </div>
  );
}

function EmbeddedPlayer({
  embedUrl,
  title,
  ariaLabel,
  onEnded,
}: {
  embedUrl: string;
  title?: string;
  ariaLabel?: string;
  onEnded?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!onEnded) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://player.vimeo.com') {
        return;
      }
      const data = event.data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data) as { event?: string };
          if (parsed.event === 'finish') onEnded?.();
        } catch {
          // ignore non-JSON messages
        }
        return;
      }
      if (typeof data === 'object' && data !== null && 'event' in data) {
        const evt = (data as { event?: string }).event;
        if (evt === 'finish' || evt === 'ended') onEnded?.();
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  return (
    <figure className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-black shadow-sm">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title ?? ariaLabel ?? 'Embedded lesson video'}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {title ? <figcaption className="text-sm font-medium text-slate-800">{title}</figcaption> : null}
    </figure>
  );
}

export function VideoBlock({
  block,
  watched = false,
  onEnded,
  onComplete,
  onVideoPlayingChange,
}: {
  block: VideoBlockPayload;
  /** When true, the video is already marked watched and the fallback is locked. */
  watched?: boolean;
  onEnded?: () => void;
  onComplete?: (params: { selectedOptionId: 'watched' }) => void;
  onVideoPlayingChange?: (playing: boolean) => void;
}) {
  const a11y = block.accessibility;
  const sourceUrl = resolveSourceUrl(block);

  if (!sourceUrl) {
    return null;
  }

  if (isDirectMp4(sourceUrl)) {
    return (
      <VideoWithFallback watched={watched} onEnded={onEnded} onComplete={onComplete}>
        {(handleEnded) => (
          <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <LessonVideoPlayer
              src={mediaUrl(sourceUrl)}
              poster={block.posterUrl ? mediaUrl(block.posterUrl) : block.posterUrl}
              title={block.title}
              captionsNote={a11y?.captionsPlaceholder}
              onEnded={handleEnded}
              onVideoPlayingChange={onVideoPlayingChange}
            />
          </div>
        )}
      </VideoWithFallback>
    );
  }

  const embed = resolveEmbed(sourceUrl);
  if (embed) {
    return (
      <VideoWithFallback watched={watched} onEnded={onEnded} onComplete={onComplete}>
        {(handleEnded) => (
          <EmbeddedPlayer
            embedUrl={embed.embedUrl}
            title={block.title}
            ariaLabel={a11y?.ariaLabel}
            onEnded={handleEnded}
          />
        )}
      </VideoWithFallback>
    );
  }

  return (
    <VideoWithFallback watched={watched} onEnded={onEnded} onComplete={onComplete}>
      {(handleEnded) => (
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <LessonVideoPlayer
            src={mediaUrl(sourceUrl)}
            poster={block.posterUrl ? mediaUrl(block.posterUrl) : block.posterUrl}
            title={block.title}
            captionsNote={a11y?.captionsPlaceholder}
            onEnded={handleEnded}
            onVideoPlayingChange={onVideoPlayingChange}
          />
        </div>
      )}
    </VideoWithFallback>
  );
}
