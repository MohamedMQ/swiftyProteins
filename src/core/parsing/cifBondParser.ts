import type { CifCategoryTable } from './cifTokenizer';

export type BondOrder = 'single' | 'double' | 'triple';

export interface Bond {
  atomIdA: string;
  atomIdB: string;
  order: BondOrder;
  isAromatic: boolean;
}

const BOND_ORDER_BY_CODE: Record<string, BondOrder> = {
  SING: 'single',
  DOUB: 'double',
  TRIP: 'triple',
};

/**
 * bondTable is null for ligands with no bond category at all — single-atom
 * ligands like ZN or CA have nothing to bond, which is a valid, expected
 * result, not an error. An unrecognized value_order falls back to 'single'
 * rather than throwing, since a bond of unknown order is still worth
 * rendering as a connection.
 */
export function parseBonds(bondTable: CifCategoryTable | null): Bond[] {
  if (bondTable === null) {
    return [];
  }

  return bondTable.rows.map((row) => ({
    atomIdA: row.atom_id_1,
    atomIdB: row.atom_id_2,
    order: BOND_ORDER_BY_CODE[row.value_order] ?? 'single',
    isAromatic: row.pdbx_aromatic_flag === 'Y',
  }));
}
