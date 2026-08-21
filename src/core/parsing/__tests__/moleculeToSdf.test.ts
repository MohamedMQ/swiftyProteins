import { readFileSync } from 'fs';
import { join } from 'path';

import { parseMolecule, type Molecule } from '../molecule';
import { moleculeToSdf } from '../moleculeToSdf';

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

const twoAtomMolecule: Molecule = {
  atoms: [
    { id: 'A1', element: 'C', position: { x: 1.5, y: -2.25, z: 0 } },
    { id: 'A2', element: 'O', position: { x: 0, y: 0, z: 3.125 } },
  ],
  bonds: [{ atomIdA: 'A1', atomIdB: 'A2', order: 'double', isAromatic: false }],
  formula: 'CO',
  centroid: { x: 0.75, y: -1.125, z: 1.5625 },
};

describe('moleculeToSdf', () => {
  it('writes the exact atom and bond counts on the counts line', () => {
    const sdf = moleculeToSdf(twoAtomMolecule);
    const countsLine = sdf.split('\n')[3];

    expect(countsLine.slice(0, 3)).toBe('  2');
    expect(countsLine.slice(3, 6)).toBe('  1');
    expect(countsLine).toContain('V2000');
  });

  it('writes coordinates that round-trip through parseFloat exactly', () => {
    const sdf = moleculeToSdf(twoAtomMolecule);
    const lines = sdf.split('\n');
    const atomLine = lines[4];

    expect(parseFloat(atomLine.slice(0, 10))).toBeCloseTo(1.5, 6);
    expect(parseFloat(atomLine.slice(10, 20))).toBeCloseTo(-2.25, 6);
    expect(parseFloat(atomLine.slice(20, 30))).toBeCloseTo(0, 6);
    expect(atomLine.slice(31, 34).trim()).toBe('C');
  });

  it('writes 1-based bond atom indices and the correct bond order code', () => {
    const sdf = moleculeToSdf(twoAtomMolecule);
    const bondLine = sdf.split('\n')[6];

    expect(parseInt(bondLine.slice(0, 3), 10)).toBe(1);
    expect(parseInt(bondLine.slice(3, 6), 10)).toBe(2);
    expect(parseInt(bondLine.slice(6, 9), 10)).toBe(2); 
  });

  it('ends with the M  END terminator', () => {
    const sdf = moleculeToSdf(twoAtomMolecule);
    expect(sdf.trimEnd().endsWith('M  END')).toBe(true);
  });

  it('skips a bond referencing an atom id that is not in the molecule', () => {
    const molecule: Molecule = {
      atoms: [{ id: 'A1', element: 'C', position: { x: 0, y: 0, z: 0 } }],
      bonds: [{ atomIdA: 'A1', atomIdB: 'GHOST', order: 'single', isAromatic: false }],
      formula: 'C',
      centroid: { x: 0, y: 0, z: 0 },
    };
    const sdf = moleculeToSdf(molecule);
    const countsLine = sdf.split('\n')[3];

    expect(countsLine.slice(3, 6)).toBe('  0');
  });

  it('round-trips every real fixture through the real 3Dmol.js GLModel parser', () => {
    for (const name of ['HEM.cif', 'ATP.cif', 'ZN.cif', 'CA.cif', 'NAG.cif', 'CLA.cif']) {
      const molecule = parseMolecule(loadFixture(name));
      const sdf = moleculeToSdf(molecule, name);
      const countsLine = sdf.split('\n')[3];

      expect(parseInt(countsLine.slice(0, 3), 10)).toBe(molecule.atoms.length);
      expect(parseInt(countsLine.slice(3, 6), 10)).toBe(molecule.bonds.length);
      expect(sdf.split('\n')).toHaveLength(4 + molecule.atoms.length + molecule.bonds.length + 1);
    }
  });
});
