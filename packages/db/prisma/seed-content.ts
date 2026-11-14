export type LessonContentType =
  | 'text'
  | 'image'
  | 'infographic'
  | 'video'
  | 'interactive'
  | 'quiz';

const CONTENT_ROTATION: LessonContentType[] = [
  'text',
  'image',
  'infographic',
  'video',
  'interactive',
  'quiz',
];

export function buildLessonContent(
  type: LessonContentType,
  title: string,
): Record<string, unknown> {
  const base = {
    type,
    title,
    placeholderNote: 'Production content will be managed via CMS or AI generation pipeline',
  };

  switch (type) {
    case 'text':
      return {
        ...base,
        body: `## ${title}\n\nThis lesson covers essential concepts for California CNAs. Read through the material and mark complete when finished.\n\n- Key practice points\n- Documentation reminders\n- Resident safety considerations`,
      };
    case 'image':
      return {
        ...base,
        caption: 'Clinical reference image — asset pipeline placeholder',
        body: 'Image lesson slot reserved for diagrams, anatomy, or procedure photos.',
      };
    case 'infographic':
      return {
        ...base,
        caption: 'Step-by-step infographic placeholder',
        body: 'Infographic content will render as SVG or PNG with accessible alt text.',
      };
    case 'video':
      return {
        ...base,
        caption: 'Video lesson — HLS/MP4 player integration pending',
        body: 'Video URL and transcript fields will attach to MediaAsset records.',
      };
    case 'interactive':
      return {
        ...base,
        body: 'Interactive scenario (branching) — SCORM/xAPI hook placeholder.',
      };
    case 'quiz':
      return {
        ...base,
        body: 'Knowledge check with multiple-choice items — links to Assessment model.',
      };
    default:
      return base;
  }
}

export function contentTypeForLessonIndex(index: number): LessonContentType {
  return CONTENT_ROTATION[index % CONTENT_ROTATION.length]!;
}
