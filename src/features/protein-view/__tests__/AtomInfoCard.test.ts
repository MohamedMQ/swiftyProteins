import { summarizeBonds } from '../AtomInfoCard';

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
