import type { CifCategoryTable } from './cifTokenizer';
import { normalizeElementSymbol, parseCifCoordinate } from './cifValues';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Intermediate parse result — position can still be null here. Molecule
 * assembly filters these down to the final Atom type (always positioned).
 */
export interface ParsedAtom {
  id: string;
  element: string;
  position: Vec3 | null;
}

export function parseAtoms(atomTable: CifCategoryTable): ParsedAtom[] {
  return atomTable.rows.map((row) => ({
    id: row.atom_id,
    element: normalizeElementSymbol(row.type_symbol),
    position: resolveAtomPosition(row),
  }));
}

/**
 * model_Cartn_* (experimental coordinates) is preferred, but some entries —
 * e.g. UNK, used for unmodeled residues — have `?` there for atoms that
 * were never actually observed in a structure. pdbx_model_Cartn_*_ideal
 * (Corina-computed) is the fallback; if that's missing too, the atom has
 * no usable position at all.
 */
function resolveAtomPosition(row: Record<string, string>): Vec3 | null {
  const model = readVec3(row, 'model_Cartn_x', 'model_Cartn_y', 'model_Cartn_z');
  if (model !== null) {
    return model;
  }
  return readVec3(
    row,
    'pdbx_model_Cartn_x_ideal',
    'pdbx_model_Cartn_y_ideal',
    'pdbx_model_Cartn_z_ideal'
  );
}

function readVec3(row: Record<string, string>, xKey: string, yKey: string, zKey: string): Vec3 | null {
  const x = parseCifCoordinate(row[xKey]);
  const y = parseCifCoordinate(row[yKey]);
  const z = parseCifCoordinate(row[zKey]);
  return x !== null && y !== null && z !== null ? { x, y, z } : null;
}
