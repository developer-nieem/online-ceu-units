import type { BlueprintPacingReport, CourseBlueprintDef } from './course-blueprint.types';

/** Tolerance above/below target active minutes before warning */
const PACING_TOLERANCE_MINUTES = 3;

export function computeBlueprintPacing(blueprint: CourseBlueprintDef): BlueprintPacingReport {
  const lessons = blueprint.modules.flatMap((m) => m.lessons);
  let estimatedActiveMinutes = 0;
  let weightedParticipationMinutes = 0;
  let interactionLessonCount = 0;

  for (const lesson of lessons) {
    estimatedActiveMinutes += lesson.estimatedActiveMinutes;
    weightedParticipationMinutes +=
      lesson.estimatedActiveMinutes * lesson.interactionWeight;
    if (lesson.interactionWeight > 1) interactionLessonCount += 1;
  }

  const target = blueprint.targetActiveParticipationMinutes;
  const minimumActiveMinutes = target;
  const warnings: string[] = [];
  const delta = estimatedActiveMinutes - target;

  const meetsMinimumParticipation = estimatedActiveMinutes >= minimumActiveMinutes;

  if (!meetsMinimumParticipation) {
    warnings.push(
      `Estimated active minutes (${estimatedActiveMinutes}) are below the ${minimumActiveMinutes}-minute CDPH minimum for 1 Online CE hour.`,
    );
  }

  if (estimatedActiveMinutes > target + PACING_TOLERANCE_MINUTES) {
    warnings.push(
      `Course may run long: ${estimatedActiveMinutes} estimated active minutes exceeds target by ${estimatedActiveMinutes - target} min.`,
    );
  } else if (delta < -PACING_TOLERANCE_MINUTES && meetsMinimumParticipation) {
    warnings.push(
      `Estimated active minutes (${estimatedActiveMinutes}) are more than ${PACING_TOLERANCE_MINUTES} min below target (${target}) — consider adding interaction time.`,
    );
  }

  if (weightedParticipationMinutes < target * 0.95) {
    warnings.push(
      'Weighted participation minutes may under-count interaction-heavy sections for seat-time validation.',
    );
  }

  if (interactionLessonCount < 3) {
    warnings.push('Fewer than three high-interaction lessons — add scenarios or knowledge checks.');
  }

  return {
    blueprintId: blueprint.id,
    targetActiveMinutes: target,
    minimumActiveMinutes,
    estimatedActiveMinutes,
    weightedParticipationMinutes: Math.round(weightedParticipationMinutes * 10) / 10,
    lessonCount: lessons.length,
    interactionLessonCount,
    meetsMinimumParticipation,
    valid: warnings.length === 0,
    warnings,
  };
}

/** Validate persisted lesson durations against blueprint targets. */
export function validateLessonDurations(
  blueprint: CourseBlueprintDef,
  lessonDurations: { slug: string; durationMinutes: number | null }[],
): { valid: boolean; warnings: string[]; totalActiveMinutes: number; meetsMinimum: boolean } {
  const warnings: string[] = [];
  const bySlug = new Map(lessonDurations.map((l) => [l.slug, l.durationMinutes]));
  let totalActiveMinutes = 0;

  for (const mod of blueprint.modules) {
    for (const def of mod.lessons) {
      const actual = bySlug.get(def.slug);
      if (actual == null) {
        warnings.push(`Missing lesson "${def.slug}" in course structure.`);
        continue;
      }
      totalActiveMinutes += actual ?? 0;
      if (actual !== def.estimatedActiveMinutes) {
        warnings.push(
          `Lesson "${def.slug}": ${actual} min (blueprint default ${def.estimatedActiveMinutes} min).`,
        );
      }
    }
  }

  const minimum = blueprint.targetActiveParticipationMinutes;
  const meetsMinimum = totalActiveMinutes >= minimum;
  if (!meetsMinimum) {
    warnings.push(
      `Total lesson durations (${totalActiveMinutes} min) are below the ${minimum}-minute active participation minimum.`,
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    totalActiveMinutes,
    meetsMinimum,
  };
}

/** Sum lesson durations for CMS catalog display. */
export function sumLessonActiveMinutes(
  lessons: { durationMinutes: number | null }[],
): number {
  return lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
}
