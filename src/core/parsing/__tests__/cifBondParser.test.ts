import { readFileSync } from 'fs';
import { join } from 'path';

import { parseBonds } from '../cifBondParser';
import { extractCifCategory, stripCifTextBlocks } from '../cifTokenizer';

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

function bondsFromFixture(name: string) {
  const lines = stripCifTextBlocks(loadFixture(name));
  return parseBonds(extractCifCategory(lines, 'chem_comp_bond'));
}

describe('parseBonds', () => {
  it('parses single and double bonds with aromatic flags from a real ring system (HEM)', () => {
    const bonds = bondsFromFixture('HEM.cif');

    expect(bonds).toHaveLength(82);
    expect(bonds.some((bond) => bond.order === 'double' && bond.isAromatic)).toBe(true);
    expect(bonds.some((bond) => bond.order === 'single' && !bond.isAromatic)).toBe(true);
  });

  it('returns an empty array when the bond category is entirely absent (single-atom ligand)', () => {
    expect(parseBonds(null)).toEqual([]);
  });

  it('falls back to "single" for an unrecognized value_order instead of throwing', () => {
    const bonds = parseBonds({
      tags: [],
      rows: [{ atom_id_1: 'A', atom_id_2: 'B', value_order: 'QUAD', pdbx_aromatic_flag: 'N' }],
    });

    expect(bonds[0].order).toBe('single');
  });

  it('parses a real flat-form (non-loop_) triple bond, e.g. carbon monoxide-like ligands', () => {
    const bonds = parseBonds({
      tags: [],
      rows: [{ atom_id_1: 'C', atom_id_2: 'O', value_order: 'TRIP', pdbx_aromatic_flag: 'N' }],
    });

    expect(bonds[0]).toMatchObject({ atomIdA: 'C', atomIdB: 'O', order: 'triple' });
  });
});
