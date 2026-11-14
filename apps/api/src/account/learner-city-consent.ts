/**
 * Profile-save gate for LearnerProfile.city.
 * A city is stored only when consent is active and the value is non-empty.
 * Consent true stamps cityConsentGivenAt. Consent false clears city, the flag, and the timestamp.
 */
export type LearnerCityConsentWrite = {
  city?: string | null;
  cityConsentGiven?: boolean;
  cityConsentGivenAt?: Date | null;
};

export function resolveLearnerCityConsent(input: {
  city?: string | null;
  cityConsentGiven?: boolean | null;
  /** Stored flag on an existing profile. Signup has none. */
  existingConsent?: boolean | null;
  now?: Date;
}): LearnerCityConsentWrite {
  const write: LearnerCityConsentWrite = {};

  if (input.cityConsentGiven === true) {
    write.cityConsentGiven = true;
    write.cityConsentGivenAt = input.now ?? new Date();
  } else if (input.cityConsentGiven === false) {
    write.city = null;
    write.cityConsentGiven = false;
    write.cityConsentGivenAt = null;
  }

  if (input.city !== undefined) {
    write.city = normalizeCity(input.city);
  }

  const consentActive =
    input.cityConsentGiven === true ||
    (input.cityConsentGiven !== false && input.existingConsent === true);
  if (write.city && !consentActive) {
    write.city = null;
  }

  return write;
}

const CITY_LOCALE = 'en-US';

/**
 * Write-time display form. Trim, collapse whitespace, then title-case only
 * tokens that are uniformly all-lower or all-upper. Mixed-case tokens
 * (McFarland, O'Farrell) stay as typed. Accents are kept.
 */
function normalizeCity(value: string | null): string | null {
  if (value === null) return null;
  const collapsed = value.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) return null;
  return collapsed.split(' ').map(titleCaseUniformToken).join(' ');
}

function titleCaseUniformToken(token: string): string {
  if (!isUniformCase(token)) return token;
  const chars = [...token];
  const first = chars[0] ?? '';
  const rest = chars.slice(1).join('');
  return first.toLocaleUpperCase(CITY_LOCALE) + rest.toLocaleLowerCase(CITY_LOCALE);
}

/** True when every cased character is lower, or every cased character is upper. */
function isUniformCase(token: string): boolean {
  return (
    token === token.toLocaleLowerCase(CITY_LOCALE) || token === token.toLocaleUpperCase(CITY_LOCALE)
  );
}

export type CityCountRow = {
  city: string | null;
  count: number;
};

/**
 * Read-time grouping for regional insights. Does not write the folded key.
 * Order: accent-fold key → sum counts → take → drop counts under minCount.
 * Display is the most common stored spelling; the first seen wins a tie.
 */
export function rankCityAggregates(
  rows: readonly CityCountRow[],
  take: number,
  minCount: number,
): Array<{ city: string; count: number }> {
  const groups = new Map<
    string,
    { count: number; variants: Map<string, { count: number; order: number }> }
  >();
  let seen = 0;

  for (const row of rows) {
    if (!row.city) continue;
    const key = cityAggregateKey(row.city);
    let group = groups.get(key);
    if (!group) {
      group = { count: 0, variants: new Map() };
      groups.set(key, group);
    }
    group.count += row.count;
    const variant = group.variants.get(row.city);
    if (variant) {
      variant.count += row.count;
    } else {
      group.variants.set(row.city, { count: row.count, order: seen });
      seen += 1;
    }
  }

  const ranked = [...groups.values()].map((group) => {
    let label = '';
    let bestCount = -1;
    let bestOrder = Number.POSITIVE_INFINITY;
    for (const [city, variant] of group.variants) {
      if (variant.count > bestCount || (variant.count === bestCount && variant.order < bestOrder)) {
        label = city;
        bestCount = variant.count;
        bestOrder = variant.order;
      }
    }
    return { city: label, count: group.count };
  });

  ranked.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, CITY_LOCALE));

  return ranked.slice(0, take).filter((row) => row.count >= minCount);
}

/** NFD, strip combining marks, lower. Grouping key only — never stored. */
function cityAggregateKey(city: string): string {
  return city.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(CITY_LOCALE);
}
