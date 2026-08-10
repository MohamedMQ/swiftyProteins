import { buildProteinViewerHtml, VISUALIZATION_MODES } from '../proteinViewerHtml';

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

  it('computes each bond neighbor by index selection and includes element, order, and Euclidean length', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('viewer.selectedAtoms({ index: neighborIndices[b] })');
    expect(html).toContain('Math.sqrt(dx * dx + dy * dy + dz * dz)');
    expect(html).toContain('bonds: bondDetails');
    expect(html).toContain('element: neighbor.elem');
    expect(html).toContain('order: (atom.bondOrder && atom.bondOrder[b]) || 1');
  });

  it('produces a single self-contained HTML document (no external script/link src)', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
  });

  it('the glue script (excluding the embedded 3Dmol library) is syntactically valid JS', () => {
    const html = buildProteinViewerHtml('/* fake 3dmol build */', 'DUMMY_SDF');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const glueScript = scripts[scripts.length - 1];

    expect(glueScript).toContain('setClickable');
    expect(() => new Function(glueScript)).not.toThrow();
  });

  it('scales up the highlighted atom sphere beyond the current mode sphere scale', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const ballAndStickScaleMatch = html.match(/ballAndStick:\s*\{[\s\S]*?sphere:\s*\{\s*scale:\s*([\d.]+)/);
    const selectedHighlightCall = html.match(/setStyle\(\{ serial: atom\.serial \}, highlightStyleFor\(currentStyle, ([\d.]+)\)\)/);

    expect(ballAndStickScaleMatch).not.toBeNull();
    expect(selectedHighlightCall).not.toBeNull();
    expect(Number(selectedHighlightCall?.[1])).toBeGreaterThan(1);
  });

  it('reports a background click distinctly from an atom click, and clears the selection', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("type: 'backgroundClick'");
    expect(html).toContain('clearSelection');
  });

  it('exposes a window.__captureSnapshot function that posts the current viewer image as PNG by default', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('window.__captureSnapshot = function (format)');
    expect(html).toContain("type: 'snapshot'");
    expect(html).toContain('viewer.pngURI()');
  });

  it('exports JPEG via the canvas\'s own toDataURL, since 3Dmol has no JPEG-specific method', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("format === 'jpeg'");
    expect(html).toContain("viewer.getCanvas().toDataURL('image/jpeg',");
    expect(html).toContain("format: format === 'jpeg' ? 'jpeg' : 'png'");
  });

  it('catches errors thrown while capturing a snapshot and posts them back', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const captureFnMatch = html.match(/window\.__captureSnapshot = function \(format\) \{[\s\S]*?\n {4}\};/);
    expect(captureFnMatch).not.toBeNull();
    expect(captureFnMatch?.[0]).toMatch(/try\s*{[\s\S]*catch/);
  });

  it('defines a style for every VisualizationMode and exposes a mode switcher', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    for (const mode of VISUALIZATION_MODES) {
      expect(html).toContain(`${mode}:`);
    }
    expect(html).toContain('window.__setVisualizationMode = function (mode)');
    expect(html).toContain("post({ type: 'visualizationModeChanged', mode: mode })");
  });

  it('gives the space-filling model no fixed sphere radius, so 3Dmol sizes atoms by their real van der Waals radius', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const spaceFillingMatch = html.match(/spaceFilling:\s*\{[\s\S]*?\},/);
    expect(spaceFillingMatch).not.toBeNull();
    expect(spaceFillingMatch?.[0]).toContain('sphere:');
    expect(spaceFillingMatch?.[0]).not.toContain('stick:');
  });

  it('gives the wireframe model bonds-only styling with no sphere', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const wireframeMatch = html.match(/wireframe:\s*\{[\s\S]*?\},/);
    expect(wireframeMatch).not.toBeNull();
    expect(wireframeMatch?.[0]).toContain('line:');
    expect(wireframeMatch?.[0]).not.toContain('sphere:');
    expect(wireframeMatch?.[0]).not.toContain('stick:');
  });

  it('re-applies the current mode style to a re-selected atom after switching modes, rather than reverting to ball-and-stick', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('function applyCurrentStyle');
    expect(html).toContain('highlightStyleFor(currentStyle,');
    expect(html).not.toContain('var defaultStyle');
    expect(html).not.toContain('var highlightStyle');
  });

  it('highlights every atom of the same element as the selected atom, distinctly from the selected atom itself', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("setStyle({ elem: atom.elem }, highlightStyleFor(currentStyle,");
    expect(html).toContain('selectedElement = atom.elem');
    const sameElementFactorMatch = html.match(/elem: atom\.elem \}, highlightStyleFor\(currentStyle, ([\d.]+)\)/);
    const selectedFactorMatch = html.match(/serial: atom\.serial \}, highlightStyleFor\(currentStyle, ([\d.]+)\)/);
    expect(sameElementFactorMatch).not.toBeNull();
    expect(selectedFactorMatch).not.toBeNull();
    expect(Number(selectedFactorMatch?.[1])).toBeGreaterThan(Number(sameElementFactorMatch?.[1]));
    expect(Number(sameElementFactorMatch?.[1])).toBeGreaterThan(1);
  });

  it('clears both the selected atom and its same-element group back to the current style on deselect', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const clearSelectionFnMatch = html.match(/function clearSelection\(\) \{[\s\S]*?\n {4}\}/);
    expect(clearSelectionFnMatch).not.toBeNull();
    expect(clearSelectionFnMatch?.[0]).toContain('setStyle({ elem: selectedElement }, currentStyle)');
    expect(clearSelectionFnMatch?.[0]).toContain('setStyle({ serial: selectedSerial }, currentStyle)');
  });

  it('the glue script remains syntactically valid JS after adding mode switching', () => {
    const html = buildProteinViewerHtml('/* fake 3dmol build */', 'DUMMY_SDF');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const glueScript = scripts[scripts.length - 1];
    expect(() => new Function(glueScript)).not.toThrow();
  });

  it('re-centers the camera on an atom only when the same atom is tapped twice within the double-tap window', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('lastAtomTapSerial === atom.serial && tapAt - lastAtomTapAt <=');
    expect(html).toContain('if (isDoubleTap)');
    expect(html).toContain('viewer.center({ serial: atom.serial },');
  });

  it('exposes a measure-mode toggle that resets pending picks and clears drawn artifacts', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('window.__setMeasureModeEnabled = function (enabled)');
    expect(html).toContain('measureModeEnabled = !!enabled');
    expect(html).toContain('clearMeasurementArtifacts()');
    expect(html).toContain("post({ type: 'measureModeChanged', enabled: measureModeEnabled })");
  });

  it('in measure mode, the first atom tap picks a point and the second draws a line and posts the distance', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain("post({ type: 'measurePointSelected', element: atom.elem })");
    expect(html).toContain('viewer.addLine({');
    expect(html).toContain("type: 'measurementResult'");
    expect(html).toContain('fromElement: first.elem');
    expect(html).toContain('toElement: atom.elem');
  });

  it('tapping the same pending atom again in measure mode cancels the pick instead of measuring against itself', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('if (measurePendingSerial === atom.serial)');
    const cancelBranchMatch = html.match(/if \(measurePendingSerial === atom\.serial\) \{[\s\S]*?\n {8}\}/);
    expect(cancelBranchMatch).not.toBeNull();
    expect(cancelBranchMatch?.[0]).toContain("post({ type: 'measureCleared' })");
  });

  it('defaults to ball-and-stick with labels hidden when no options are given', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('STYLES["ballAndStick"] || STYLES.ballAndStick');
    expect(html).toContain('if (false) {\n      setAtomLabelsVisible(true);\n    }');
  });

  it('seeds the initial visualization mode from options instead of always starting ball-and-stick', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF', { initialVisualizationMode: 'spaceFilling' });
    expect(html).toContain('STYLES["spaceFilling"] || STYLES.ballAndStick');
  });

  it('shows atom labels immediately on load when initialAtomLabelsVisible is true', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF', { initialAtomLabelsVisible: true });
    expect(html).toContain('if (true) {\n      setAtomLabelsVisible(true);\n    }');
  });

  it('exposes an atom label toggle that adds a label per selected atom and clears them all when hidden', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    expect(html).toContain('window.__setAtomLabelsVisible = function (visible)');
    expect(html).toContain('viewer.removeAllLabels()');
    expect(html).toContain('viewer.selectedAtoms({})');
    expect(html).toContain('viewer.addLabel(atom.elem');
    expect(html).toContain("type: 'atomLabelsVisibilityChanged'");
  });

  it('catches errors thrown while toggling atom labels and posts them back', () => {
    const html = buildProteinViewerHtml('/* fake */', 'DUMMY_SDF');
    const toggleFnMatch = html.match(/window\.__setAtomLabelsVisible = function \(visible\) \{[\s\S]*?\n {4}\};/);
    expect(toggleFnMatch).not.toBeNull();
    expect(toggleFnMatch?.[0]).toMatch(/try\s*{[\s\S]*catch/);
  });
});
