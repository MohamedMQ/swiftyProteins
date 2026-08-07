import { buildProteinViewerHtml } from '../proteinViewerHtml';

describe('buildProteinViewerHtml', () => {
  it('embeds the given 3Dmol script verbatim inside a script tag', () => {
    const html = buildProteinViewerHtml('/* fake 3dmol build */ window["3Dmol"] = {};', 'irrelevant');
    expect(html).toContain('<script>/* fake 3dmol build */ window["3Dmol"] = {};</script>');
  });

  it('safely escapes SDF content containing quotes and newlines as a JS string literal', () => {
    const sdf = 'line one\nline "two"\nline\\three';
    const html = buildProteinViewerHtml('/* fake */', sdf);

    // What's embedded must be the JSON-escaped form, not the raw text
    // (which would break out of the JS string or contain literal newlines
    // inside a single-quoted-looking context).
    expect(html).toContain(JSON.stringify(sdf));
    expect(html).not.toContain('line "two"\nline');
  });

  it('wires up addModel with the sdf format, ball-and-stick style, and Jmol colors', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("addModel(");
    expect(html).toContain("'sdf'");
    expect(html).toContain('colorscheme: \'Jmol\'');
    expect(html).toContain('stick:');
    expect(html).toContain('sphere:');
  });

  it('posts a ready message and wraps setup in a try/catch that posts an error message', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("type: 'ready'");
    expect(html).toContain("type: 'error'");
    expect(html).toMatch(/try\s*{[\s\S]*catch/);
  });

  it('registers an atom click handler that posts atom data back to React Native', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('setClickable(');
    expect(html).toContain("type: 'atomClick'");
  });

  it('produces a single self-contained HTML document (no external script/link src)', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
  });
});
