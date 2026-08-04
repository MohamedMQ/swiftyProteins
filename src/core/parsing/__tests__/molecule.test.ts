import { readFileSync } from 'fs';
import { join } from 'path';

import { CifParseError, parseMolecule } from '../molecule';

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

describe('parseMolecule — normal molecule (HEM)', () => {
  const molecule = parseMolecule(loadFixture('HEM.cif'));

  it('parses all atoms and bonds', () => {
    expect(molecule.atoms).toHaveLength(75);
    expect(molecule.bonds).toHaveLength(82);
  });

  it('computes the molecular formula matching RCSB\'s own formula field exactly', () => {
    expect(molecule.formula).toBe('C34H32FeN4O4');
  });

  it('computes a centroid within the atom cloud', () => {
    expect(molecule.centroid.x).toBeCloseTo(2.333, 2);
    expect(molecule.centroid.y).toBeCloseTo(-20.4425, 2);
    expect(molecule.centroid.z).toBeCloseTo(37.589, 2);
  });

  it('every bond references two atoms that actually exist in the molecule', () => {
    const atomIds = new Set(molecule.atoms.map((atom) => atom.id));
    for (const bond of molecule.bonds) {
      expect(atomIds.has(bond.atomIdA)).toBe(true);
      expect(atomIds.has(bond.atomIdB)).toBe(true);
    }
  });
});

describe('parseMolecule — ? coordinates with ideal-coordinate fallback (UNK)', () => {
  const molecule = parseMolecule(loadFixture('UNK.cif'));

  it('still places every atom via the ideal-coordinate fallback', () => {
    expect(molecule.atoms).toHaveLength(16);
  });

  it('computes the correct formula despite two atoms needing the fallback', () => {
    expect(molecule.formula).toBe('C4H9NO2');
  });
});

describe('parseMolecule — single-atom ligands (ZN, CA)', () => {
  it('parses ZN as one atom with no bonds', () => {
    const molecule = parseMolecule(loadFixture('ZN.cif'));

    expect(molecule.atoms).toHaveLength(1);
    expect(molecule.bonds).toHaveLength(0);
    expect(molecule.formula).toBe('Zn');
    expect(molecule.centroid).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('parses CA as one atom with no bonds', () => {
    const molecule = parseMolecule(loadFixture('CA.cif'));

    expect(molecule.atoms).toHaveLength(1);
    expect(molecule.bonds).toHaveLength(0);
    expect(molecule.formula).toBe('Ca');
  });
});

describe('parseMolecule — large molecule (CLA, chlorophyll a)', () => {
  const molecule = parseMolecule(loadFixture('CLA.cif'));

  it('parses all 137 atoms and their bonds without error', () => {
    expect(molecule.atoms).toHaveLength(137);
    expect(molecule.bonds.length).toBeGreaterThan(0);
  });

  it('computes the correct formula for a large, magnesium-containing molecule', () => {
    expect(molecule.formula).toBe('C55H72MgN4O5');
  });
});

describe('parseMolecule — malformed input', () => {
  it('throws CifParseError for text with no chem_comp_atom category at all', () => {
    expect(() => parseMolecule('this is not a cif file\njust some random text\n')).toThrow(
      CifParseError
    );
  });

  it('throws CifParseError for an empty string', () => {
    expect(() => parseMolecule('')).toThrow(CifParseError);
  });

  it('drops an atom with no resolvable position, and any bond referencing it', () => {
    const cif = `
data_TST
loop_
_chem_comp_atom.atom_id
_chem_comp_atom.type_symbol
_chem_comp_atom.model_Cartn_x
_chem_comp_atom.model_Cartn_y
_chem_comp_atom.model_Cartn_z
_chem_comp_atom.pdbx_model_Cartn_x_ideal
_chem_comp_atom.pdbx_model_Cartn_y_ideal
_chem_comp_atom.pdbx_model_Cartn_z_ideal
A1 C 0.0 0.0 0.0 0.0 0.0 0.0
A2 C ? ? ? ? ? ?
#
loop_
_chem_comp_bond.atom_id_1
_chem_comp_bond.atom_id_2
_chem_comp_bond.value_order
_chem_comp_bond.pdbx_aromatic_flag
A1 A2 SING N
`;
    const molecule = parseMolecule(cif);

    expect(molecule.atoms).toHaveLength(1);
    expect(molecule.atoms[0].id).toBe('A1');
    expect(molecule.bonds).toHaveLength(0);
  });

  it('throws CifParseError when every atom lacks a resolvable position', () => {
    const cif = `
data_TST
loop_
_chem_comp_atom.atom_id
_chem_comp_atom.type_symbol
_chem_comp_atom.model_Cartn_x
_chem_comp_atom.model_Cartn_y
_chem_comp_atom.model_Cartn_z
A1 C ? ? ?
`;
    expect(() => parseMolecule(cif)).toThrow(CifParseError);
  });
});
