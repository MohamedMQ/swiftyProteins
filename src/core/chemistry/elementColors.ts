/**
 * Standard CPK (Corey-Pauling-Koltun) atom colors, extended to the full set
 * of elements realistically found in RCSB ligands (organics, halogens, and
 * the metal ions common in metalloenzyme cofactors — Fe, Zn, Mg, Mn, Cu...).
 * Matches the de facto standard used by Jmol/PyMOL/RasMol, not just the
 * subject's six called-out elements.
 */
const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Na: '#AB5CF2',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Si: '#F0C8A0',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Mn: '#9C7AC7',
  Fe: '#E06633',
  Co: '#F090A0',
  Ni: '#50D050',
  Cu: '#C88033',
  Zn: '#7D80B0',
  As: '#BD80E3',
  Se: '#FFA100',
  Br: '#A62929',
  Mo: '#54B5B5',
  Ag: '#C0C0C0',
  Cd: '#FFD98F',
  Sn: '#668080',
  Sb: '#9E63B5',
  I: '#940094',
  Ba: '#00C900',
  Pt: '#D0D0E0',
  Au: '#FFD123',
  Hg: '#B8B8D0',
  Pb: '#575961',
  B: '#FFB5B5',
  Li: '#CC80FF',
};

/** Deliberately conspicuous (not a plausible real element color) so a missing table entry is obvious rather than silently wrong. */
const FALLBACK_COLOR = '#FF00FF';

export function getCpkColor(element: string): string {
  return CPK_COLORS[element] ?? FALLBACK_COLOR;
}
