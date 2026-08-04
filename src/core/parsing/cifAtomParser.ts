import type { CifCategoryTable } from './cifTokenizer';
import { normalizeElementSymbol, parseCifCoordinate } from './cifValues';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Atom {
  id: string;
  element: string;
  /** Null when model_Cartn_x/y/z is missing for this atom — resolved by the ideal-coordinate fallback. */
  position: Vec3 | null;
}

export function parseAtoms(atomTable: CifCategoryTable): Atom[] {
  return atomTable.rows.map((row) => {
    const x = parseCifCoordinate(row.model_Cartn_x);
    const y = parseCifCoordinate(row.model_Cartn_y);
    const z = parseCifCoordinate(row.model_Cartn_z);
    const position = x !== null && y !== null && z !== null ? { x, y, z } : null;

    return {
      id: row.atom_id,
      element: normalizeElementSymbol(row.type_symbol),
      position,
    };
  });
}
