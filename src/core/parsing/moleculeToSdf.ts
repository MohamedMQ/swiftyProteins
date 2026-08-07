import type { Molecule } from './molecule';

const BOND_ORDER_CODE: Record<Molecule['bonds'][number]['order'], number> = {
  single: 1,
  double: 2,
  triple: 3,
};

function padLeft(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function formatCoordinate(value: number): string {
  return padLeft(value.toFixed(4), 10);
}

/**
 * Serializes a parsed Molecule into an MDL Molfile (SDF V2000) — a format
 * 3Dmol.js natively supports and understands, unlike its CIF parser (which
 * only reads full crystallographic _atom_site.* structures, not the
 * _chem_comp_atom/_chem_comp_bond ligand-definition format RCSB actually
 * serves). We keep parsing our own .cif per the subject's requirement and
 * only convert to SDF at the last step, purely to hand the already-parsed
 * geometry to the renderer in a format it understands.
 */
export function moleculeToSdf(molecule: Molecule, name = ''): string {
  const atomIndexById = new Map<string, number>();
  molecule.atoms.forEach((atom, index) => atomIndexById.set(atom.id, index + 1));

  // Resolve bond lines before writing the counts line — the count declared
  // there must match the number of bond lines actually written, or any
  // strict V2000 reader (3Dmol.js included) will misparse the rest of the
  // file. A bond referencing a missing atom can't be written, so it must
  // be excluded from the count too, not just skipped later.
  const bondLines: string[] = [];
  for (const bond of molecule.bonds) {
    const indexA = atomIndexById.get(bond.atomIdA);
    const indexB = atomIndexById.get(bond.atomIdB);
    if (indexA === undefined || indexB === undefined) {
      continue;
    }
    bondLines.push(
      `${padLeft(String(indexA), 3)}${padLeft(String(indexB), 3)}${padLeft(String(BOND_ORDER_CODE[bond.order]), 3)}  0`
    );
  }

  const lines: string[] = [];
  lines.push(name);
  lines.push('  SwiftyProtein');
  lines.push('');
  lines.push(
    `${padLeft(String(molecule.atoms.length), 3)}${padLeft(String(bondLines.length), 3)}  0  0  0  0  0  0  0  0999 V2000`
  );

  for (const atom of molecule.atoms) {
    const element = atom.element.length > 0 ? atom.element : 'C';
    lines.push(
      `${formatCoordinate(atom.position.x)}${formatCoordinate(atom.position.y)}${formatCoordinate(atom.position.z)} ${element.padEnd(3)}0  0  0  0  0  0  0  0  0  0  0  0`
    );
  }

  lines.push(...bondLines);
  lines.push('M  END');

  return lines.join('\n');
}
