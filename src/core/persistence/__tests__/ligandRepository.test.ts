import { applyFavoritesFilter } from '../ligandRepository';

describe('applyFavoritesFilter', () => {
  const codes = ['HEM', 'ATP', 'ZN', 'NAG'];

  it('returns the codes unchanged when onlyFavorites is false, regardless of the favorites set', () => {
    expect(applyFavoritesFilter(codes, new Set(['HEM']), false)).toEqual(codes);
    expect(applyFavoritesFilter(codes, new Set(), false)).toEqual(codes);
  });

  it('keeps only codes present in the favorites set when onlyFavorites is true', () => {
    expect(applyFavoritesFilter(codes, new Set(['ATP', 'ZN']), true)).toEqual(['ATP', 'ZN']);
  });

  it('preserves the original ordering of codes rather than the favorites set order', () => {
    expect(applyFavoritesFilter(codes, new Set(['NAG', 'HEM']), true)).toEqual(['HEM', 'NAG']);
  });

  it('returns an empty array when onlyFavorites is true but nothing is favorited', () => {
    expect(applyFavoritesFilter(codes, new Set(), true)).toEqual([]);
  });

  it('ignores favorites entries that are not present in the codes list', () => {
    expect(applyFavoritesFilter(codes, new Set(['UNKNOWN_CODE']), true)).toEqual([]);
  });
});
