/**
 * Standard published radii in Angstroms, for the same element set as
 * elementColors.ts. Covalent radii (single-bond, ~Cordero et al.) drive
 * ball-and-stick sphere sizing; van der Waals radii (~Bondi/Alvarez) are
 * for the space-filling visualization mode (bonus, not yet built).
 * Precision here only needs to be good enough for relative sphere sizing
 * in a 3D view, not scientific computation.
 */
const COVALENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  Na: 1.66,
  Mg: 1.41,
  Al: 1.21,
  Si: 1.11,
  P: 1.07,
  S: 1.05,
  Cl: 1.02,
  K: 2.03,
  Ca: 1.76,
  Mn: 1.39,
  Fe: 1.32,
  Co: 1.26,
  Ni: 1.24,
  Cu: 1.32,
  Zn: 1.22,
  As: 1.19,
  Se: 1.2,
  Br: 1.2,
  Mo: 1.54,
  Ag: 1.45,
  Cd: 1.44,
  Sn: 1.39,
  Sb: 1.39,
  I: 1.39,
  Ba: 1.96,
  Pt: 1.36,
  Au: 1.36,
  Hg: 1.32,
  Pb: 1.46,
  B: 0.84,
  Li: 1.28,
};

const VAN_DER_WAALS_RADII: Record<string, number> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  F: 1.47,
  Na: 2.27,
  Mg: 1.73,
  Al: 1.84,
  Si: 2.1,
  P: 1.8,
  S: 1.8,
  Cl: 1.75,
  K: 2.75,
  Ca: 2.31,
  Mn: 2.05,
  Fe: 2.04,
  Co: 2.0,
  Ni: 1.97,
  Cu: 1.96,
  Zn: 2.01,
  As: 1.85,
  Se: 1.9,
  Br: 1.85,
  Mo: 2.1,
  Ag: 2.11,
  Cd: 2.18,
  Sn: 2.17,
  Sb: 2.06,
  I: 1.98,
  Ba: 2.68,
  Pt: 2.13,
  Au: 2.14,
  Hg: 2.23,
  Pb: 2.02,
  B: 1.92,
  Li: 1.82,
};

// Roughly mid-table, so an element missing from the tables above still
// renders a plausible sphere instead of one that's obviously huge or gone.
const FALLBACK_COVALENT_RADIUS = 1.0;
const FALLBACK_VAN_DER_WAALS_RADIUS = 1.8;

export function getCovalentRadius(element: string): number {
  return COVALENT_RADII[element] ?? FALLBACK_COVALENT_RADIUS;
}

export function getVanDerWaalsRadius(element: string): number {
  return VAN_DER_WAALS_RADII[element] ?? FALLBACK_VAN_DER_WAALS_RADIUS;
}
