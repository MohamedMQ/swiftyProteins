import { readFileSync } from 'fs';
import { join } from 'path';

import { parseAtoms } from '../cifAtomParser';
import { extractCifCategory, stripCifTextBlocks } from '../cifTokenizer';

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

function atomsFromFixture(name: string) {
  const lines = stripCifTextBlocks(loadFixture(name));
  const table = extractCifCategory(lines, 'chem_comp_atom');
  if (table === null) {
    throw new Error(`fixture ${name} has no chem_comp_atom category`);
  }
  return parseAtoms(table);
}

describe('parseAtoms', () => {
  it('normalizes element symbols from uppercase source data', () => {
    const atoms = atomsFromFixture('HEM.cif');
    const iron = atoms.find((atom) => atom.id === 'FE');

    expect(iron?.element).toBe('Fe');
    expect(atoms.every((atom) => atom.element === '' || /^[A-Z][a-z]*$/.test(atom.element))).toBe(
      true
    );
  });

  it('uses model_Cartn_x/y/z when present', () => {
    const atoms = atomsFromFixture('HEM.cif');
    const first = atoms.find((atom) => atom.id === 'CHA');

    expect(first?.position).toEqual({ x: 2.748, y: -19.531, z: 39.896 });
  });

  it('falls back to pdbx_model_Cartn_*_ideal when model coordinates are "?" (real UNK fixture)', () => {
    const atoms = atomsFromFixture('UNK.cif');
    const cg = atoms.find((atom) => atom.id === 'CG');
    const oxt = atoms.find((atom) => atom.id === 'OXT');

    expect(cg?.position).toEqual({ x: 0.211, y: -2.855, z: -2.469 });
    expect(oxt?.position).toEqual({ x: 1.959, y: -0.964, z: -4.903 });
  });

  it('still uses model coordinates (not ideal) for atoms in UNK that do have them', () => {
    const atoms = atomsFromFixture('UNK.cif');
    const n = atoms.find((atom) => atom.id === 'N');

    expect(n?.position).toEqual({ x: 52.705, y: 47.668, z: 60.026 });
  });

  it('parses the single atom of a single-atom ligand (ZN)', () => {
    const atoms = atomsFromFixture('ZN.cif');

    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toMatchObject({ id: 'ZN', element: 'Zn', position: { x: 0, y: 0, z: 0 } });
  });

  it('parses the single atom of a single-atom ligand (CA)', () => {
    const atoms = atomsFromFixture('CA.cif');

    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toMatchObject({ id: 'CA', element: 'Ca' });
  });

  it('returns null position when both model and ideal coordinates are missing', () => {
    const table = {
      tags: [],
      rows: [
        {
          atom_id: 'X1',
          type_symbol: 'C',
          model_Cartn_x: '?',
          model_Cartn_y: '?',
          model_Cartn_z: '?',
          pdbx_model_Cartn_x_ideal: '.',
          pdbx_model_Cartn_y_ideal: '?',
          pdbx_model_Cartn_z_ideal: '?',
        },
      ],
    };

    expect(parseAtoms(table)[0].position).toBeNull();
  });

  it('returns null position for a non-numeric (malformed) coordinate string', () => {
    const table = {
      tags: [],
      rows: [
        {
          atom_id: 'X1',
          type_symbol: 'C',
          model_Cartn_x: 'not_a_number',
          model_Cartn_y: '1',
          model_Cartn_z: '1',
        },
      ],
    };

    expect(parseAtoms(table)[0].position).toBeNull();
  });
});
