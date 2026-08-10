import { bondOrderLabel, formatBondLength, summarizeBonds } from '../AtomInfoCard';

describe('summarizeBonds', () => {
  it('returns "None" for an atom with no bonds', () => {
    expect(summarizeBonds([])).toBe('None');
  });

  it('summarizes a single bond order', () => {
    expect(summarizeBonds([1])).toBe('1 single');
    expect(summarizeBonds([2])).toBe('1 double');
    expect(summarizeBonds([3])).toBe('1 triple');
  });

  it('counts multiple bonds of the same order', () => {
    expect(summarizeBonds([1, 1, 1])).toBe('3 single');
  });

  it('lists mixed bond orders in single/double/triple order, omitting zero counts', () => {
    expect(summarizeBonds([1, 1, 2])).toBe('2 single, 1 double');
    expect(summarizeBonds([3, 1])).toBe('1 single, 1 triple');
    expect(summarizeBonds([2, 2, 3])).toBe('2 double, 1 triple');
  });

  it('ignores an unrecognized bond order rather than mislabeling it', () => {
    expect(summarizeBonds([1, 99])).toBe('1 single');
  });
});

describe('bondOrderLabel', () => {
  it('labels the three recognized bond orders', () => {
    expect(bondOrderLabel(1)).toBe('single');
    expect(bondOrderLabel(2)).toBe('double');
    expect(bondOrderLabel(3)).toBe('triple');
  });

  it('falls back to "unknown" for an unrecognized bond order rather than throwing', () => {
    expect(bondOrderLabel(99)).toBe('unknown');
  });
});

describe('formatBondLength', () => {
  it('formats a bond length to two decimal places with an angstrom unit', () => {
    expect(formatBondLength(1.5)).toBe('1.50 Å');
    expect(formatBondLength(1.2345)).toBe('1.23 Å');
  });

  it('rounds rather than truncates', () => {
    expect(formatBondLength(1.999)).toBe('2.00 Å');
  });
});
