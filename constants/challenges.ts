export type ChallengeType = 'starts' | 'ends' | 'contains';

export interface Challenge {
  combo: string;
  type: ChallengeType;
  length: number; // exact word length required
  stars: 1 | 2 | 3 | 4 | 5;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validated against 66k-word dictionary (all have ≥ 5 matching words)
// ─────────────────────────────────────────────────────────────────────────────
export const CHALLENGE_POOL: Challenge[] = [
  // ── ⭐  1 STAR ─ short words, very common combos ────────────────────────────
  { combo: 'SH', type: 'starts', length: 3, stars: 1 },
  { combo: 'TR', type: 'starts', length: 4, stars: 1 },
  { combo: 'BR', type: 'starts', length: 4, stars: 1 },
  { combo: 'FL', type: 'starts', length: 4, stars: 1 },
  { combo: 'GR', type: 'starts', length: 4, stars: 1 },
  { combo: 'PL', type: 'starts', length: 4, stars: 1 },
  { combo: 'CL', type: 'starts', length: 4, stars: 1 },
  { combo: 'DR', type: 'starts', length: 4, stars: 1 },
  { combo: 'SP', type: 'starts', length: 4, stars: 1 },
  { combo: 'CR', type: 'starts', length: 4, stars: 1 },
  { combo: 'BL', type: 'starts', length: 4, stars: 1 },
  { combo: 'NG', type: 'ends', length: 4, stars: 1 },
  { combo: 'ST', type: 'ends', length: 4, stars: 1 },
  { combo: 'ND', type: 'ends', length: 4, stars: 1 },
  { combo: 'NT', type: 'ends', length: 4, stars: 1 },
  { combo: 'LT', type: 'ends', length: 4, stars: 1 },
  { combo: 'FT', type: 'ends', length: 4, stars: 1 },
  { combo: 'RD', type: 'ends', length: 4, stars: 1 },

  // ── ⭐⭐  2 STAR ─ 5-letter words, more variety ─────────────────────────────
  { combo: 'FR', type: 'starts', length: 5, stars: 2 },
  { combo: 'TR', type: 'starts', length: 5, stars: 2 },
  { combo: 'BR', type: 'starts', length: 5, stars: 2 },
  { combo: 'FL', type: 'starts', length: 5, stars: 2 },
  { combo: 'GR', type: 'starts', length: 5, stars: 2 },
  { combo: 'PR', type: 'starts', length: 5, stars: 2 },
  { combo: 'CR', type: 'starts', length: 5, stars: 2 },
  { combo: 'DR', type: 'starts', length: 5, stars: 2 },
  { combo: 'BL', type: 'starts', length: 5, stars: 2 },
  { combo: 'SL', type: 'starts', length: 5, stars: 2 },
  { combo: 'SW', type: 'starts', length: 5, stars: 2 },
  { combo: 'SC', type: 'starts', length: 5, stars: 2 },
  { combo: 'ING', type: 'ends', length: 5, stars: 2 },
  { combo: 'EST', type: 'ends', length: 5, stars: 2 },
  { combo: 'ENT', type: 'ends', length: 5, stars: 2 },
  { combo: 'ND', type: 'ends', length: 5, stars: 2 },
  { combo: 'NG', type: 'ends', length: 5, stars: 2 },
  { combo: 'TH', type: 'ends', length: 5, stars: 2 },
  { combo: 'TH', type: 'contains', length: 5, stars: 2 },
  { combo: 'ST', type: 'contains', length: 5, stars: 2 },
  { combo: 'NG', type: 'contains', length: 5, stars: 2 },

  // ── ⭐⭐⭐  3 STAR ─ 6-letter words, intro to 3-letter combos ────────────────
  { combo: 'STR', type: 'starts', length: 6, stars: 3 },
  { combo: 'PRE', type: 'starts', length: 6, stars: 3 },
  { combo: 'CON', type: 'starts', length: 6, stars: 3 },
  { combo: 'GR', type: 'starts', length: 6, stars: 3 },
  { combo: 'BL', type: 'starts', length: 6, stars: 3 },
  { combo: 'CL', type: 'starts', length: 6, stars: 3 },
  { combo: 'ING', type: 'ends', length: 6, stars: 3 },
  { combo: 'TION', type: 'ends', length: 6, stars: 3 },
  { combo: 'ISH', type: 'ends', length: 6, stars: 3 },
  { combo: 'MENT', type: 'ends', length: 6, stars: 3 },
  { combo: 'NESS', type: 'ends', length: 7, stars: 3 },
  { combo: 'STR', type: 'contains', length: 6, stars: 3 },
  { combo: 'OUN', type: 'contains', length: 6, stars: 3 },
  { combo: 'IGH', type: 'contains', length: 6, stars: 3 },
  { combo: 'TH', type: 'contains', length: 6, stars: 3 },

  // ── ⭐⭐⭐⭐  4 STAR ─ 7-letter words, harder combos ──────────────────────────
  { combo: 'STR', type: 'starts', length: 7, stars: 4 },
  { combo: 'PRE', type: 'starts', length: 7, stars: 4 },
  { combo: 'CON', type: 'starts', length: 7, stars: 4 },
  { combo: 'COM', type: 'starts', length: 7, stars: 4 },
  { combo: 'DIS', type: 'starts', length: 7, stars: 4 },
  { combo: 'TION', type: 'ends', length: 7, stars: 4 },
  { combo: 'ING', type: 'ends', length: 7, stars: 4 },
  { combo: 'MENT', type: 'ends', length: 7, stars: 4 },
  { combo: 'NESS', type: 'ends', length: 7, stars: 4 },
  { combo: 'IGHT', type: 'contains', length: 7, stars: 4 },
  { combo: 'STR', type: 'contains', length: 7, stars: 4 },

  // ── ⭐⭐⭐⭐⭐  5 STAR ─ 8–9 letter words ───────────────────────────────────
  { combo: 'STR', type: 'starts', length: 8, stars: 5 },
  { combo: 'PRE', type: 'starts', length: 8, stars: 5 },
  { combo: 'CON', type: 'starts', length: 8, stars: 5 },
  { combo: 'DIS', type: 'starts', length: 8, stars: 5 },
  { combo: 'TION', type: 'ends', length: 8, stars: 5 },
  { combo: 'MENT', type: 'ends', length: 8, stars: 5 },
  { combo: 'NESS', type: 'ends', length: 8, stars: 5 },
  { combo: 'IGHT', type: 'contains', length: 8, stars: 5 },
  { combo: 'STR', type: 'starts', length: 9, stars: 5 },
  { combo: 'CON', type: 'starts', length: 9, stars: 5 },
  { combo: 'TION', type: 'ends', length: 9, stars: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Which star tiers are eligible at a given score */
export function eligibleStars(score: number): readonly number[] {
  if (score < 5) return [1];
  if (score < 10) return [1, 2];
  if (score < 16) return [2, 3];
  if (score < 24) return [3, 4];
  return [4, 5];
}

/** Time bonus (seconds) awarded for a correct word at a given star level */
export function starTimeBonus(stars: 1 | 2 | 3 | 4 | 5): number {
  // 1★ → +2s … 5★ → +6s
  return 2 + (stars - 1) * 1;
}

/** Pick a random valid challenge, excluding the current one */
export function pickChallenge(score: number, exclude?: Challenge): Challenge {
  const tiers = eligibleStars(score);
  const pool = CHALLENGE_POOL.filter((c) => tiers.includes(c.stars));

  let pick: Challenge;
  let tries = 0;
  do {
    pick = pool[Math.floor(Math.random() * pool.length)];
    tries++;
  } while (
    tries < 25 &&
    exclude &&
    pick.combo === exclude.combo &&
    pick.type === exclude.type &&
    pick.length === exclude.length
  );
  return pick;
}

/** Build the slot array for rendering inside the bomb */
export function buildSlots(
  challenge: Challenge,
): { char: string; filled: boolean }[] {
  const { combo, type, length } = challenge;

  if (type === 'contains') {
    // show: ·  C  O  M  B  O  ·
    return [
      { char: '·', filled: false },
      ...combo.split('').map((c) => ({ char: c, filled: true })),
      { char: '·', filled: false },
    ];
  }

  const slots: { char: string; filled: boolean }[] = [];
  for (let i = 0; i < length; i++) {
    if (type === 'starts' && i < combo.length) {
      slots.push({ char: combo[i], filled: true });
    } else if (type === 'ends' && i >= length - combo.length) {
      slots.push({ char: combo[i - (length - combo.length)], filled: true });
    } else {
      slots.push({ char: '·', filled: false });
    }
  }
  return slots;
}

/** Validate a player's answer against a challenge */
export function validateAnswer(
  word: string,
  challenge: Challenge,
  wordSet: Set<string>,
): boolean {
  const up = word.toUpperCase().trim();
  if (!wordSet.has(up)) return false;
  if (up.length !== challenge.length) return false;
  const combo = challenge.combo.toUpperCase();
  switch (challenge.type) {
    case 'starts':
      return up.startsWith(combo);
    case 'ends':
      return up.endsWith(combo);
    case 'contains':
      return up.includes(combo);
  }
}

/** Human-readable hint for the TextInput placeholder */
export function challengeHint(challenge: Challenge): string {
  const label =
    challenge.type === 'starts'
      ? `starting with "${challenge.combo}"`
      : challenge.type === 'ends'
        ? `ending with "${challenge.combo}"`
        : `containing "${challenge.combo}"`;
  return `${challenge.length}-letter word ${label}…`;
}
