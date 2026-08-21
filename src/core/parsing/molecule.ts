import { parseAtoms, type Vec3 } from './cifAtomParser';
import { parseBonds, type Bond } from './cifBondParser';
import { extractCifCategory, stripCifTextBlocks } from './cifTokenizer';

export interface Atom {
  id: string;
  element: string;
  position: Vec3;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
  formula: string;
  centroid: Vec3;
}

export class CifParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CifParseError';
  }
}

export function parseMolecule(rawCif: string): Molecule {
  const lines = stripCifTextBlocks(rawCif);
  const atomTable = extractCifCategory(lines, 'chem_comp_atom');
  if (atomTable === null) {
    throw new CifParseError('No chem_comp_atom category found in this file');
  }

  const atoms: Atom[] = parseAtoms(atomTable).flatMap((atom) =>
    atom.position === null ? [] : [{ id: atom.id, element: atom.element, position: atom.position }]
  );
  if (atoms.length === 0) {
    throw new CifParseError('No atoms with a resolvable position');
  }

  const atomIds = new Set(atoms.map((atom) => atom.id));
  const bondTable = extractCifCategory(lines, 'chem_comp_bond');
  const bonds = parseBonds(bondTable).filter(
    (bond) => atomIds.has(bond.atomIdA) && atomIds.has(bond.atomIdB)
  );

  return {
    atoms,
    bonds,
    formula: computeMolecularFormula(atoms),
    centroid: computeCentroid(atoms),
  };
}

export function computeMolecularFormula(atoms: Atom[]): string {
  const counts = new Map<string, number>();
  for (const atom of atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  }

  const elements = [...counts.keys()];
  const rest = elements.filter((element) => element !== 'C' && element !== 'H').sort();
  const ordered = counts.has('C') ? ['C', ...(counts.has('H') ? ['H'] : []), ...rest] : elements.sort();

  return ordered
    .map((element) => {
      const count = counts.get(element) ?? 0;
      return count > 1 ? `${element}${count}` : element;
    })
    .join('');
}

export function computeCentroid(atoms: Atom[]): Vec3 {
  const sum = atoms.reduce(
    (acc, atom) => ({
      x: acc.x + atom.position.x,
      y: acc.y + atom.position.y,
      z: acc.z + atom.position.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return { x: sum.x / atoms.length, y: sum.y / atoms.length, z: sum.z / atoms.length };
}
