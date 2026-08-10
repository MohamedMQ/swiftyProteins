import { parseFavoritesJson } from '../favoritesRepository';

describe('parseFavoritesJson', () => {
  it('parses a valid JSON array of codes into a Set', () => {
    expect(parseFavoritesJson('["HEM", "ATP"]')).toEqual(new Set(['HEM', 'ATP']));
  });

  it('returns an empty Set for an empty array', () => {
    expect(parseFavoritesJson('[]')).toEqual(new Set());
  });

  it('deduplicates repeated codes', () => {
    expect(parseFavoritesJson('["HEM", "HEM", "ATP"]')).toEqual(new Set(['HEM', 'ATP']));
  });

  it('returns an empty Set for malformed JSON rather than throwing', () => {
    expect(parseFavoritesJson('not valid json')).toEqual(new Set());
  });

  it('returns an empty Set when the JSON is valid but not an array', () => {
    expect(parseFavoritesJson('{"HEM": true}')).toEqual(new Set());
    expect(parseFavoritesJson('42')).toEqual(new Set());
    expect(parseFavoritesJson('null')).toEqual(new Set());
  });

  it('filters out non-string entries from an otherwise valid array', () => {
    expect(parseFavoritesJson('["HEM", 42, null, "ATP"]')).toEqual(new Set(['HEM', 'ATP']));
  });
});
