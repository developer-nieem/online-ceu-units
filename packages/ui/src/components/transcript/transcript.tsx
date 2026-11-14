'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

import {
  DEFAULT_TRANSCRIPT_BRAND_NAME,
  DEFAULT_TRANSCRIPT_COMPLIANCE_DISCLAIMER,
} from './constants';
import { DEFAULT_INSTITUTION_LEGAL_NAME } from '../certificate/constants';
import { TranscriptCourseList } from './transcript-course-list';
import { TranscriptHeader } from './transcript-header';
import { TranscriptTotals } from './transcript-totals';
import { sortTranscriptCoursesByCompletionDate } from './sort-transcript-courses';
import type { TranscriptProps } from './types';

export function Transcript({
  learner,
  generatedAt,
  courses,
  totals,
  institutionLegalName = DEFAULT_INSTITUTION_LEGAL_NAME,
  institutionBrandName = DEFAULT_TRANSCRIPT_BRAND_NAME,
  logoSrc,
  logoFallbackSrc,
  className,
}: TranscriptProps) {
  const sortedCourses = React.useMemo(
    () => sortTranscriptCoursesByCompletionDate(courses),
    [courses],
  );

  return (
    <article className={cn('transcript', className)} data-transcript-printable="true">
      <div aria-hidden="true" className="transcript__frame" />

      <div className="transcript__content">
        <TranscriptHeader
          generatedAt={generatedAt}
          institutionBrandName={institutionBrandName}
          institutionLegalName={institutionLegalName}
          learner={learner}
          logoFallbackSrc={logoFallbackSrc}
          logoSrc={logoSrc}
        />

        <TranscriptCourseList courses={courses} />

        <TranscriptTotals
          courseCount={sortedCourses.length}
          totalOnlineCeUnits={totals?.totalOnlineCeUnits}
        />

        <footer className="transcript__footer">
          <p className="transcript__disclaimer">{DEFAULT_TRANSCRIPT_COMPLIANCE_DISCLAIMER}</p>
        </footer>
      </div>
    </article>
  );
}
