export type Rng = () => number;

/** Uniform random digit 0-9, matching a physical pick from the Random Number Table. */
export function rollRandomNumber(rng: Rng = Math.random): number {
  return Math.floor(rng() * 10);
}
