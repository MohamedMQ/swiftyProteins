import { readFileSync } from 'fs';
import { join } from 'path';

import { extractCifCategory, stripCifTextBlocks, tokenizeCifLine } from '../cifTokenizer';

function loadFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

describe('tokenizeCifLine', () => {
  it('splits plain whitespace-separated tokens', () => {
    expect(tokenizeCifLine('HEM CHA C1A SING N N 1')).toEqual([
      'HEM',
      'CHA',
      'C1A',
      'SING',
      'N',
      'N',
      '1',
    ]);
  });

  it('keeps a double-quoted value with spaces as one token', () => {
    expect(tokenizeCifLine('_chem_comp.type "D-saccharide, beta linking"')).toEqual([
      '_chem_comp.type',
      'D-saccharide, beta linking',
    ]);
  });

  it('keeps an apostrophe inside a double-quoted value intact (real ATP atom name)', () => {
    const tokens = tokenizeCifLine(
      'ATP "O5\'" O5* O  0  1  N  N  N  46.172  41.568  53.302  -0.844  -0.587  -0.604  "O5\'"  ATP  13'
    );
    expect(tokens[1]).toBe("O5'");
    expect(tokens[15]).toBe("O5'");
    expect(tokens).toHaveLength(18);
  });

  it('handles single-quoted values', () => {
    expect(tokenizeCifLine("A 'quoted value' B")).toEqual(['A', 'quoted value', 'B']);
  });

  it('returns an empty array for a blank line', () => {
    expect(tokenizeCifLine('   ')).toEqual([]);
  });
});

describe('stripCifTextBlocks', () => {
  it('removes a multi-line semicolon block without corrupting surrounding lines', () => {
    const text = [
      '_chem_comp.pdbx_synonyms',
      ';first synonym; second synonym',
      'third synonym',
      ';',
      '_chem_comp.pdbx_formal_charge  0',
    ].join('\n');

    expect(stripCifTextBlocks(text)).toEqual([
      '_chem_comp.pdbx_synonyms',
      '_chem_comp.pdbx_formal_charge  0',
    ]);
  });

  it('does not affect a file with no semicolon blocks', () => {
    const text = 'data_ZN\n_chem_comp.id ZN\n';
    expect(stripCifTextBlocks(text)).toEqual(['data_ZN', '_chem_comp.id ZN', '']);
  });
});

describe('extractCifCategory', () => {
  it('parses a loop_ category, indexing rows by tag name regardless of column order', () => {
    const lines = stripCifTextBlocks(loadFixture('HEM.cif'));
    const table = extractCifCategory(lines, 'chem_comp_atom');

    expect(table).not.toBeNull();
    expect(table?.rows).toHaveLength(75);
    expect(table?.rows[0]).toMatchObject({
      atom_id: 'CHA',
      type_symbol: 'C',
      model_Cartn_x: '2.748',
    });
  });

  it('finds atom_id by tag name even though ATP is a different real file with a different column order', () => {
    const lines = stripCifTextBlocks(loadFixture('ATP.cif'));
    const table = extractCifCategory(lines, 'chem_comp_atom');
    const primeAtom = table?.rows.find((row) => row.atom_id === "O5'");

    expect(primeAtom).toBeDefined();
    expect(primeAtom?.type_symbol).toBe('O');
  });

  it('parses the flat (non-loop_) single-row form used for single-atom ligands', () => {
    const lines = stripCifTextBlocks(loadFixture('ZN.cif'));
    const table = extractCifCategory(lines, 'chem_comp_atom');

    expect(table?.rows).toHaveLength(1);
    expect(table?.rows[0]).toMatchObject({ atom_id: 'ZN', type_symbol: 'ZN' });
  });

  it('returns null when a category is entirely absent (single-atom ligands have no bond category)', () => {
    const lines = stripCifTextBlocks(loadFixture('ZN.cif'));
    expect(extractCifCategory(lines, 'chem_comp_bond')).toBeNull();
  });

  it('does not let the NAG semicolon block corrupt the atom loop that follows it', () => {
    const lines = stripCifTextBlocks(loadFixture('NAG.cif'));
    const table = extractCifCategory(lines, 'chem_comp_atom');

    expect(table?.rows).toHaveLength(30);
    expect(table?.rows[0]).toMatchObject({ atom_id: 'C1' });
  });
});
