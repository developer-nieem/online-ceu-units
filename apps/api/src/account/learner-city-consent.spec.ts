import { describe, expect, it } from 'vitest';

import { rankCityAggregates, resolveLearnerCityConsent } from './learner-city-consent';

function storedCity(city: string): string | null | undefined {
  return resolveLearnerCityConsent({ city, cityConsentGiven: true }).city;
}

describe('normalizeCity via resolveLearnerCityConsent', () => {
  it('trims, collapses whitespace, and title-cases uniform tokens', () => {
    expect(storedCity('  san  jose  ')).toBe('San Jose');
    expect(storedCity('SACRAMENTO')).toBe('Sacramento');
    expect(storedCity('McFarland')).toBe('McFarland');
    expect(storedCity("O'Farrell")).toBe("O'Farrell");
    expect(storedCity('San José')).toBe('San José');
  });
});

describe('rankCityAggregates', () => {
  const liveCities = [
    { city: 'Milpitas', count: 1 },
    { city: 'Sacramento', count: 1 },
    { city: 'San Jose', count: 1 },
  ];

  it('suppresses the current cities because each count is under 5', () => {
    expect(rankCityAggregates(liveCities, 10, 5)).toEqual([]);
    expect(rankCityAggregates(liveCities, 5, 5)).toEqual([]);
  });

  it('folds accents, sums, takes, then drops counts under 5', () => {
    const rows = [
      { city: 'San Jose', count: 3 },
      { city: 'San José', count: 2 },
      { city: 'Milpitas', count: 4 },
      { city: 'Sacramento', count: 1 },
    ];

    expect(rankCityAggregates(rows, 5, 5)).toEqual([{ city: 'San Jose', count: 5 }]);
  });
});
