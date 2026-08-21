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
