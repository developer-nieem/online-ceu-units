import { describe, expect, it } from 'vitest';

import { enrollmentPlanLabels, mergePlanLabels, nonTestStudentWhere } from './enrolled-students';

describe('verified test account filter', () => {
  it('omits development fixtures and keeps an ordinary student address', () => {
    const where = nonTestStudentWhere();
    expect(JSON.stringify(where)).toContain('@example.com');
    expect(JSON.stringify(where)).toContain('.test');
    expect(JSON.stringify(where)).toContain('@gmail.acom');
    expect(JSON.stringify(where)).toContain('deniese@calacenursingacademy.com');
    expect(JSON.stringify(where)).toContain('onlineceunit50@gmail.com');
    expect(JSON.stringify(where)).toContain('korynroasa@gmail.com');
    expect(JSON.stringify(where)).toContain('korynroasa3@gmail.com');
    expect(JSON.stringify(where)).toContain('seeded');
    expect(JSON.stringify(where)).not.toContain('unlimited-2y');
  });
});

describe('enrollment plan labels', () => {
  it('keeps every known plan and an unrecognized plan code', () => {
    expect(enrollmentPlanLabels({ purchasePlan: 'unlimited-1y' })).toEqual(['1-Year Unlimited']);
    expect(enrollmentPlanLabels({ purchasePlan: 'unlimited-2y' })).toEqual(['2-Year Unlimited']);
    expect(enrollmentPlanLabels({ purchasePlan: 'single' })).toEqual(['Single course']);
    expect(enrollmentPlanLabels({ purchasePlan: 'free' })).toEqual(['Free']);
    expect(enrollmentPlanLabels({ purchasePlan: 'cohort-2026' })).toEqual(['cohort-2026']);
    expect(enrollmentPlanLabels({ freeEnrollment: true })).toEqual(['Free']);
    expect(enrollmentPlanLabels({ viaSubscription: true })).toEqual(['Unlimited membership']);
    expect(enrollmentPlanLabels({})).toEqual([]);
    expect(enrollmentPlanLabels(null)).toEqual([]);
  });

  it('lists each plan once when a student has several enrollments', () => {
    expect(
      mergePlanLabels([
        ['2-Year Unlimited'],
        ['1-Year Unlimited', 'Free'],
        ['2-Year Unlimited'],
        ['cohort-2026'],
      ]),
    ).toEqual(['1-Year Unlimited', '2-Year Unlimited', 'Free', 'cohort-2026']);
  });
});
