import * as React from 'react';

import { cn } from '../../lib/utils';

import { TRANSCRIPT_CE_UNIT_DISPLAY, TRANSCRIPT_DELIVERY_DISPLAY } from './format-transcript-ce-unit';
import { formatTranscriptDate } from './format-transcript-date';
import { sortTranscriptCoursesByCompletionDate } from './sort-transcript-courses';
import type { TranscriptCourseEntry } from './types';

export interface TranscriptCourseListProps {
  courses: TranscriptCourseEntry[];
  className?: string;
}

export function TranscriptCourseList({ courses, className }: TranscriptCourseListProps) {
  const sortedCourses = React.useMemo(
    () => sortTranscriptCoursesByCompletionDate(courses),
    [courses],
  );

  if (sortedCourses.length === 0) {
    return (
      <section className={cn('transcript__courses', className)}>
        <h2 className="transcript__section-title">Completed courses</h2>
        <p className="transcript__empty">No completed courses on record.</p>
      </section>
    );
  }

  return (
    <section className={cn('transcript__courses', className)}>
      <h2 className="transcript__section-title">Completed courses</h2>

      <div className="transcript__table-wrap">
        <table className="transcript__table">
          <thead>
            <tr>
              <th className="transcript__col-number" scope="col">
                #
              </th>
              <th scope="col">Course Title</th>
              <th scope="col">Completion Date</th>
              <th scope="col">CE Units</th>
              <th scope="col">Delivery</th>
              <th scope="col">CE Certificate No.</th>
              <th scope="col">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course, index) => (
              <tr key={`${course.certificateNo ?? course.courseTitle}-${index}`}>
                <td className="transcript__col-number" data-label="#">
                  {index + 1}
                </td>
                <td data-label="Course Title">{course.courseTitle}</td>
                <td data-label="Completion Date">{formatTranscriptDate(course.completedOn)}</td>
                <td data-label="CE Units">{TRANSCRIPT_CE_UNIT_DISPLAY}</td>
                <td data-label="Delivery">{TRANSCRIPT_DELIVERY_DISPLAY}</td>
                <td data-label="CE Certificate No.">{course.certificateNo ?? '—'}</td>
                <td data-label="Certificate">
                  {course.certificateHref ? (
                    <a className="transcript__cert-link" href={course.certificateHref}>
                      View certificate
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="transcript__cards">
        {sortedCourses.map((course, index) => (
          <li
            key={`card-${course.certificateNo ?? course.courseTitle}-${index}`}
            className="transcript__card"
          >
            <p className="transcript__card-number">#{index + 1}</p>
            <p className="transcript__card-title">{course.courseTitle}</p>
            <dl className="transcript__card-details">
              <div>
                <dt>Completion Date</dt>
                <dd>{formatTranscriptDate(course.completedOn)}</dd>
              </div>
              <div>
                <dt>CE Units</dt>
                <dd>{TRANSCRIPT_CE_UNIT_DISPLAY}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{TRANSCRIPT_DELIVERY_DISPLAY}</dd>
              </div>
              <div>
                <dt>CE Certificate No.</dt>
                <dd>{course.certificateNo ?? '—'}</dd>
              </div>
            </dl>
            {course.certificateHref ? (
              <a className="transcript__cert-link" href={course.certificateHref}>
                View certificate
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
