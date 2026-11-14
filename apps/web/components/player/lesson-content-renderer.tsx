import { Badge } from '@calace/ui/components/ui/badge';
import {
  FileText,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  MousePointerClick,
  Video,
} from 'lucide-react';

import { isBlockDocument } from '@calace/content-blocks';

import { mediaUrl } from '@/lib/media-url';
import type { LessonContentType, PlayerLesson } from '@/lib/player';
import { LessonBlocksPlayer } from './lesson-blocks-player';

const TYPE_LABELS: Record<LessonContentType, string> = {
  text: 'Text lesson',
  image: 'Image',
  infographic: 'Infographic',
  video: 'Video',
  interactive: 'Interactive',
  quiz: 'Quiz',
};

const TYPE_ICONS: Record<LessonContentType, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  infographic: LayoutGrid,
  video: Video,
  interactive: MousePointerClick,
  quiz: HelpCircle,
};

export function LessonContentRenderer({
  lesson,
  courseSlug,
  lessonSlug,
  enrollmentId,
  onLessonProgress,
  onInteraction,
  onVideoPlayingChange,
  onAudioPlayingChange,
}: {
  lesson: PlayerLesson;
  courseSlug: string;
  lessonSlug: string;
  enrollmentId: string;
  onLessonProgress?: (pct: number, canComplete: boolean) => void;
  onInteraction?: () => void;
  onVideoPlayingChange?: (playing: boolean) => void;
  onAudioPlayingChange?: (playing: boolean) => void;
}) {
  if (isBlockDocument(lesson.content)) {
    return (
      <LessonBlocksPlayer
        lesson={lesson}
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
        enrollmentId={enrollmentId}
        onProgressUpdate={onLessonProgress}
        onInteraction={onInteraction}
        onVideoPlayingChange={onVideoPlayingChange}
        onAudioPlayingChange={onAudioPlayingChange}
      />
    );
  }

  const legacy = lesson.content as { type?: LessonContentType; body?: string; caption?: string; placeholderNote?: string };
  const type = legacy.type ?? 'text';
  const Icon = TYPE_ICONS[type];
  return (
    <div className="space-y-4">
      <Badge variant="secondary" className="gap-1">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {TYPE_LABELS[type]}
      </Badge>

      {type === 'text' && legacy.body ? (
        <div className="prose prose-sm max-w-none text-slate-700">
          {legacy.body.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return (
                <h2 key={i} className="mt-4 text-lg font-semibold">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <li key={i} className="ml-4">
                  {line.replace('- ', '')}
                </li>
              );
            }
            if (!line.trim()) return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      ) : null}

      {(type === 'image' || type === 'infographic') && (
        <div
          className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-slate-50 text-center text-muted-foreground"
          role="img"
          aria-label={legacy.caption ?? 'Visual content placeholder'}
        >
          <Icon className="h-10 w-10 opacity-40" aria-hidden />
          <p className="text-sm font-medium">{legacy.caption}</p>
          <p className="max-w-md px-4 text-xs">{legacy.body}</p>
        </div>
      )}

      {type === 'video' && lesson.videoUrl ? (
        <video
          className="aspect-video w-full rounded-lg bg-black"
          controls
          playsInline
          preload="metadata"
          aria-label={legacy.caption ?? 'Lesson video'}
          onPlay={() => onVideoPlayingChange?.(true)}
          onPause={() => onVideoPlayingChange?.(false)}
          onEnded={() => onVideoPlayingChange?.(false)}
        >
          <source src={mediaUrl(lesson.videoUrl)} type="video/mp4" />
        </video>
      ) : null}

      {type === 'interactive' && (
        <div className="rounded-lg border bg-teal-50/50 p-6 text-sm text-teal-900">
          <p className="font-medium">Interactive scenario placeholder</p>
          <p className="mt-2 text-teal-800">{legacy.body}</p>
        </div>
      )}

      {type === 'quiz' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-900">Knowledge check placeholder</p>
          <p className="mt-2 text-sm text-amber-800">{legacy.body}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Future: Question model + AssessmentAttempt grading
          </p>
        </div>
      )}

      {legacy.placeholderNote && type !== 'video' ? (
        <p className="text-xs text-muted-foreground">{legacy.placeholderNote}</p>
      ) : null}
    </div>
  );
}
