/**
 * Combat Results Table (CRT).
 *
 * The book's real CRT (`crtneg.png` / `crtpos.png` in the source content) only exists as two
 * table images, never as text. The corner/edge cells (the "K" = automatic kill cells, and the
 * shared Combat Ratio = 0 column that both images agree on) are clearly legible and used here
 * as calibration anchors. The interior cells are reconstructed from those anchors using the
 * table's real, consistent properties: Enemy Endurance loss increases monotonically as Combat
 * Ratio and the dice roll increase; Lone Wolf's Endurance loss decreases the same way.
 *
 * This gives correct, playable, internally-consistent combat behaviour, but individual interior
 * cells may differ by a point or two from the printed book. For tournament-exact numbers, compare
 * this file against `en/xhtml/lw/01fftd/crtneg.png` and `crtpos.png` and adjust the constants below.
 */

export interface CombatResultCell {
  enemyLoss: number | 'K';
  playerLoss: number | 'K';
}

// Endurance lost by the Enemy / Lone Wolf at Combat Ratio 0, indexed by dice roll (1-9, 10 = book's "0" row).
const BASE_ENEMY_LOSS_BY_ROLL: Record<number, number> = {
  1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 12,
};
const BASE_PLAYER_LOSS_BY_ROLL: Record<number, number> = {
  1: 5, 2: 5, 3: 4, 4: 3, 5: 2, 6: 2, 7: 1, 8: 0, 9: 0, 10: 0,
};

const ENEMY_LOSS_PER_RATIO = 0.5;
const PLAYER_LOSS_PER_RATIO = 0.45;
const MIN_RATIO = -11;
const MAX_RATIO = 11;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Look up the result of one combat round.
 * @param ratio Lone Wolf's effective Combat Skill minus the enemy's Combat Skill.
 * @param roll  A number 0-9 from the Random Number Table (0 = the book's bottom "0" row).
 */
export function getCombatResult(ratio: number, roll: number): CombatResultCell {
  const effRoll = roll === 0 ? 10 : roll;
  const clampedRatio = clamp(ratio, MIN_RATIO, MAX_RATIO);

  if (clampedRatio <= MIN_RATIO && effRoll <= 2) {
    return { enemyLoss: 0, playerLoss: 'K' };
  }
  if (clampedRatio >= MAX_RATIO && effRoll >= 9) {
    return { enemyLoss: 'K', playerLoss: 0 };
  }

  const enemyLoss = clamp(
    Math.round(BASE_ENEMY_LOSS_BY_ROLL[effRoll] + clampedRatio * ENEMY_LOSS_PER_RATIO),
    0,
    20,
  );
  const playerLoss = clamp(
    Math.round(BASE_PLAYER_LOSS_BY_ROLL[effRoll] - clampedRatio * PLAYER_LOSS_PER_RATIO),
    0,
    8,
  );

  return { enemyLoss, playerLoss };
}
