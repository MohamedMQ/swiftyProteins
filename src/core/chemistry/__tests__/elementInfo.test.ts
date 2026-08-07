import { getElementInfo } from '../elementInfo';

describe('getElementInfo', () => {
  it('returns the correct name and atomic number for the subject\'s explicitly named elements', () => {
    expect(getElementInfo('C')).toMatchObject({ name: 'Carbon', atomicNumber: 6 });
    expect(getElementInfo('H')).toMatchObject({ name: 'Hydrogen', atomicNumber: 1 });
    expect(getElementInfo('O')).toMatchObject({ name: 'Oxygen', atomicNumber: 8 });
    expect(getElementInfo('N')).toMatchObject({ name: 'Nitrogen', atomicNumber: 7 });
    expect(getElementInfo('S')).toMatchObject({ name: 'Sulfur', atomicNumber: 16 });
    expect(getElementInfo('P')).toMatchObject({ name: 'Phosphorus', atomicNumber: 15 });
  });

  it('covers the metals found in real ligands used elsewhere in this project (Fe, Zn, Ca, Mg, Co)', () => {
    expect(getElementInfo('Fe').name).toBe('Iron');
    expect(getElementInfo('Zn').name).toBe('Zinc');
    expect(getElementInfo('Ca').name).toBe('Calcium');
    expect(getElementInfo('Mg').name).toBe('Magnesium');
    expect(getElementInfo('Co').name).toBe('Cobalt');
  });

  it('falls back gracefully for an unrecognized symbol instead of throwing', () => {
    const info = getElementInfo('Xx');
    expect(info.name).toBe('Unknown');
    expect(typeof info.color).toBe('string');
  });

  it('gives every entry a distinct, non-empty color', () => {
    const symbols = ['C', 'H', 'O', 'N', 'S', 'P', 'Fe', 'Zn'];
    const colors = symbols.map((s) => getElementInfo(s).color);
    expect(new Set(colors).size).toBe(symbols.length);
  });
});
