import { VISUALIZATION_MODES, type VisualizationMode } from '../../core/viewer/visualizationMode';

export { VISUALIZATION_MODES, type VisualizationMode };

export type ImageExportFormat = 'png' | 'jpeg';

const BACKGROUND_COLOR = '#0E1116';
// Matches the proportions tuned in the earlier native ball-and-stick
// renderer: covalent-radius-scaled spheres, sticks thinner than any atom.
const SPHERE_SCALE = 0.35;
const STICK_RADIUS = 0.08;
const HIGHLIGHT_SCALE_FACTOR = 1.4;
// A click on an atom and the container's own click listener both fire for
// the same tap; if the atom handler ran more recently than this, the
// container-level handler treats it as "hit an atom", not a background
// click — 3Dmol.js has no separate "background click" event of its own.
const ATOM_CLICK_DEBOUNCE_MS = 50;
// Leaving `scale` unset makes 3Dmol size each sphere by its actual van der
// Waals radius, which is what the space-filling/CPK model is supposed to show.
const SPACE_FILLING_SCALE = 1.0;
// Wireframe and stick modes have no sphere of their own to scale up for a
// selection highlight, so the highlight sphere falls back to this size.
const HIGHLIGHT_FALLBACK_SPHERE_SCALE = 0.3;
// Every other atom sharing the selected atom's element gets a smaller bump
// than the selected atom itself, so the selection stays visually distinct
// from the rest of the same-element group it's highlighting.
const SAME_ELEMENT_HIGHLIGHT_SCALE_FACTOR = 1.15;
// Two taps on the same atom within this window count as a double-tap.
const DOUBLE_TAP_MAX_INTERVAL_MS = 350;
const CENTER_ON_ATOM_ANIMATION_MS = 400;
const MEASUREMENT_LINE_COLOR = 'yellow';
const JPEG_EXPORT_QUALITY = 0.92;
// Zoom-in already stops on its own (3Dmol refuses to get closer than 1 unit
// from the camera). Zoom-out has no built-in limit, so it's capped here at
// a multiple of the molecule's own fitted distance (from viewer.zoomTo()),
// which scales with each ligand's size instead of using one fixed distance
// that would be too tight for large ligands or too loose for small ones.
const ZOOM_OUT_LIMIT_FACTOR = 4;

/**
 * Builds a self-contained HTML page: 3Dmol.js inlined directly (no CDN
 * dependency at runtime), fed the given SDF, styled ball-and-stick by
 * default with the Jmol color scheme (the same standard CPK colors the
 * subject asks for), and wired to post messages back to React Native for
 * readiness, atom taps, and background taps (dismiss). Tapping an atom
 * bumps its sphere scale as a selection highlight and also gives every
 * other atom of the same element a smaller highlight bump, both reverted
 * on the next tap elsewhere; double-tapping the same atom re-centers the
 * camera on it, and the atomClick message includes each of the atom's
 * bonds (neighbor element, order, and length) for the info popup to show.
 * `window.__setMeasureModeEnabled` swaps normal atom-tap behavior for a
 * two-point distance measurement: the first tap picks a point, the second
 * draws a dashed line and a distance label between them and posts the
 * result. `window.__setVisualizationMode` lets React Native
 * switch to the bonus space-filling/wireframe/stick models in place,
 * without re-parsing or re-adding the SDF model, and
 * `window.__setAtomLabelsVisible` toggles per-atom element-symbol labels.
 * `options` seeds the initial visualization mode and label visibility
 * (from the user's saved preferences) so the viewer opens directly in the
 * right state instead of flashing the hardcoded defaults first.
 * `window.__captureSnapshot(format)` exports either PNG (via 3Dmol's own
 * pngURI(), the default) or JPEG (via the canvas's own toDataURL, since
 * 3Dmol doesn't expose a JPEG equivalent) for sharing.
 * threeDmolScript is injected as-is (trusted, bundled asset); sdf goes
 * through JSON.stringify so any characters in it are safely escaped as a
 * JS string literal, not interpreted as HTML/script markup.
 */
export interface ProteinViewerHtmlOptions {
  initialVisualizationMode?: VisualizationMode;
  initialAtomLabelsVisible?: boolean;
}

export function buildProteinViewerHtml(
  threeDmolScript: string,
  sdf: string,
  options: ProteinViewerHtmlOptions = {}
): string {
  const initialMode = options.initialVisualizationMode ?? 'ballAndStick';
  const initialAtomLabelsVisible = options.initialAtomLabelsVisible ?? false;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #viewer { margin: 0; padding: 0; width: 100%; height: 100%; background: ${BACKGROUND_COLOR}; overflow: hidden; }
</style>
</head>
<body>
<div id="viewer"></div>
<script>${threeDmolScript}</script>
<script>
(function () {
  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  try {
    var $3Dmol = window["3Dmol"];
    var viewer = $3Dmol.createViewer(document.getElementById('viewer'), {
      backgroundColor: '${BACKGROUND_COLOR}',
    });

    var STYLES = {
      ballAndStick: {
        stick: { radius: ${STICK_RADIUS}, colorscheme: 'Jmol' },
        sphere: { scale: ${SPHERE_SCALE}, colorscheme: 'Jmol' },
      },
      spaceFilling: {
        sphere: { scale: ${SPACE_FILLING_SCALE}, colorscheme: 'Jmol' },
      },
      wireframe: {
        line: { colorscheme: 'Jmol' },
      },
      stick: {
        stick: { radius: ${STICK_RADIUS}, colorscheme: 'Jmol' },
      },
    };
    var currentStyle = STYLES[${JSON.stringify(initialMode)}] || STYLES.ballAndStick;
    var selectedSerial = null;
    var selectedElement = null;
    var lastAtomClickAt = 0;
    var lastAtomTapSerial = null;
    var lastAtomTapAt = 0;
    var measureModeEnabled = false;
    var measurePendingSerial = null;
    var measureShape = null;
    var measureLabel = null;

    function clearMeasurementArtifacts() {
      if (measureShape !== null) {
        viewer.removeShape(measureShape);
        measureShape = null;
      }
      if (measureLabel !== null) {
        viewer.removeLabel(measureLabel);
        measureLabel = null;
      }
      measurePendingSerial = null;
    }

    function highlightStyleFor(style, scaleFactor) {
      var baseScale = (style.sphere && style.sphere.scale) || ${HIGHLIGHT_FALLBACK_SPHERE_SCALE};
      var highlighted = JSON.parse(JSON.stringify(style));
      highlighted.sphere = { scale: baseScale * scaleFactor, colorscheme: 'Jmol' };
      return highlighted;
    }

    function clearSelection() {
      if (selectedSerial !== null) {
        if (selectedElement !== null) {
          viewer.setStyle({ elem: selectedElement }, currentStyle);
        } else {
          viewer.setStyle({ serial: selectedSerial }, currentStyle);
        }
        selectedSerial = null;
        selectedElement = null;
      }
    }

    function applyCurrentStyle() {
      var previousSelectedSerial = selectedSerial;
      var previousSelectedElement = selectedElement;
      viewer.setStyle({}, currentStyle);
      if (previousSelectedSerial !== null) {
        if (previousSelectedElement !== null) {
          viewer.setStyle(
            { elem: previousSelectedElement },
            highlightStyleFor(currentStyle, ${SAME_ELEMENT_HIGHLIGHT_SCALE_FACTOR})
          );
        }
        viewer.setStyle({ serial: previousSelectedSerial }, highlightStyleFor(currentStyle, ${HIGHLIGHT_SCALE_FACTOR}));
      }
      viewer.render();
    }

    viewer.addModel(${JSON.stringify(sdf)}, 'sdf');
    applyCurrentStyle();

    viewer.setClickable({}, true, function (atom) {
      if (measureModeEnabled) {
        if (measurePendingSerial === atom.serial) {
          // Tapping the same atom again cancels the pending pick.
          measurePendingSerial = null;
          post({ type: 'measureCleared' });
          return;
        }
        if (measurePendingSerial === null) {
          clearMeasurementArtifacts();
          measurePendingSerial = atom.serial;
          post({ type: 'measurePointSelected', element: atom.elem });
          return;
        }
        var firstAtoms = viewer.selectedAtoms({ serial: measurePendingSerial });
        var first = firstAtoms[0];
        measurePendingSerial = null;
        if (!first) {
          return;
        }
        var mdx = atom.x - first.x;
        var mdy = atom.y - first.y;
        var mdz = atom.z - first.z;
        var distance = Math.sqrt(mdx * mdx + mdy * mdy + mdz * mdz);
        measureShape = viewer.addLine({
          color: '${MEASUREMENT_LINE_COLOR}',
          dashed: true,
          start: { x: first.x, y: first.y, z: first.z },
          end: { x: atom.x, y: atom.y, z: atom.z },
        });
        measureLabel = viewer.addLabel(distance.toFixed(2) + ' \\u00C5', {
          position: { x: (first.x + atom.x) / 2, y: (first.y + atom.y) / 2, z: (first.z + atom.z) / 2 },
          fontColor: '${MEASUREMENT_LINE_COLOR}',
          backgroundColor: 'black',
          backgroundOpacity: 0.6,
          fontSize: 12,
          inFront: true,
          showBackground: true,
        });
        viewer.render();
        post({
          type: 'measurementResult',
          distance: distance,
          fromElement: first.elem,
          toElement: atom.elem,
        });
        return;
      }

      var tapAt = Date.now();
      var isDoubleTap =
        lastAtomTapSerial === atom.serial && tapAt - lastAtomTapAt <= ${DOUBLE_TAP_MAX_INTERVAL_MS};
      lastAtomTapSerial = atom.serial;
      lastAtomTapAt = tapAt;
      lastAtomClickAt = tapAt;

      clearSelection();
      // Highlight every atom of this element first (the bonus "atom
      // highlighting" feature), then re-apply the stronger single-atom
      // highlight on top so the actually-selected atom still stands out
      // from the rest of its element group.
      viewer.setStyle({ elem: atom.elem }, highlightStyleFor(currentStyle, ${SAME_ELEMENT_HIGHLIGHT_SCALE_FACTOR}));
      viewer.setStyle({ serial: atom.serial }, highlightStyleFor(currentStyle, ${HIGHLIGHT_SCALE_FACTOR}));
      selectedSerial = atom.serial;
      selectedElement = atom.elem;
      viewer.render();

      // Double-tapping the same atom re-centers the camera on it (does
      // not change zoom level, unlike zoomTo) with a smooth animation.
      if (isDoubleTap) {
        viewer.center({ serial: atom.serial }, ${CENTER_ON_ATOM_ANIMATION_MS});
      }

      // 'bonds' holds indices into the model's atom array (not serials),
      // so each neighbor is resolved via an index selection; bond length
      // is the plain Euclidean distance in Angstroms between the two
      // atoms' coordinates, which is exactly what the SDF stores them in.
      var bondDetails = [];
      var neighborIndices = atom.bonds || [];
      for (var b = 0; b < neighborIndices.length; b++) {
        var neighbors = viewer.selectedAtoms({ index: neighborIndices[b] });
        var neighbor = neighbors[0];
        if (neighbor) {
          var dx = atom.x - neighbor.x;
          var dy = atom.y - neighbor.y;
          var dz = atom.z - neighbor.z;
          bondDetails.push({
            element: neighbor.elem,
            order: (atom.bondOrder && atom.bondOrder[b]) || 1,
            length: Math.sqrt(dx * dx + dy * dy + dz * dz),
          });
        }
      }

      post({
        type: 'atomClick',
        atom: {
          id: atom.serial,
          element: atom.elem,
          x: atom.x,
          y: atom.y,
          z: atom.z,
          bondOrders: atom.bondOrder || [],
          bonds: bondDetails,
        },
      });
    });

    document.getElementById('viewer').addEventListener('click', function () {
      if (Date.now() - lastAtomClickAt > ${ATOM_CLICK_DEBOUNCE_MS}) {
        if (measureModeEnabled) {
          if (measurePendingSerial !== null) {
            measurePendingSerial = null;
            post({ type: 'measureCleared' });
          }
          return;
        }
        clearSelection();
        viewer.render();
        post({ type: 'backgroundClick' });
      }
    });

    // Invoked from React Native to toggle "measure" mode: while enabled,
    // atom taps pick two points and draw a dashed line + distance label
    // between them instead of the normal select/highlight behavior.
    window.__setMeasureModeEnabled = function (enabled) {
      try {
        measureModeEnabled = !!enabled;
        clearSelection();
        clearMeasurementArtifacts();
        viewer.render();
        post({ type: 'measureModeChanged', enabled: measureModeEnabled });
      } catch (error) {
        post({ type: 'error', message: String(error && error.message ? error.message : error) });
      }
    };

    // Invoked from React Native to switch between the mandatory
    // ball-and-stick model and the bonus space-filling/wireframe/stick
    // models, in place, without re-parsing or re-adding the SDF model.
    window.__setVisualizationMode = function (mode) {
      try {
        if (!STYLES[mode]) {
          return;
        }
        currentStyle = STYLES[mode];
        applyCurrentStyle();
        post({ type: 'visualizationModeChanged', mode: mode });
      } catch (error) {
        post({ type: 'error', message: String(error && error.message ? error.message : error) });
      }
    };

    // Labels are re-derived from the live model's atom positions each time
    // rather than tracked from the original SDF, so they stay correct
    // regardless of which visualization mode is active.
    function setAtomLabelsVisible(visible) {
      viewer.removeAllLabels();
      if (visible) {
        var atoms = viewer.selectedAtoms({});
        for (var i = 0; i < atoms.length; i++) {
          var atom = atoms[i];
          viewer.addLabel(atom.elem, {
            position: { x: atom.x, y: atom.y, z: atom.z },
            fontSize: 10,
            fontColor: 'white',
            backgroundColor: 'black',
            backgroundOpacity: 0.55,
            borderThickness: 0,
            inFront: true,
            showBackground: true,
          });
        }
      }
      viewer.render();
    }

    // Invoked from React Native to toggle per-atom element-symbol labels.
    window.__setAtomLabelsVisible = function (visible) {
      try {
        setAtomLabelsVisible(visible);
        post({ type: 'atomLabelsVisibilityChanged', visible: !!visible });
      } catch (error) {
        post({ type: 'error', message: String(error && error.message ? error.message : error) });
      }
    };

    viewer.zoomTo();
    // Cap how far out the user can zoom relative to this molecule's own
    // fitted framing, so panning out never scrolls the ligand away to a
    // speck. Must run after zoomTo() so the fitted distance reflects this
    // molecule's actual extent.
    var fittedDistance = viewer.CAMERA_Z - viewer.getView()[3];
    viewer.setZoomLimits(0, fittedDistance * ${ZOOM_OUT_LIMIT_FACTOR});
    viewer.render();

    if (${JSON.stringify(initialAtomLabelsVisible)}) {
      setAtomLabelsVisible(true);
    }

    // Invoked from React Native via injectJavaScript to capture the
    // current view for sharing — pngURI() (and, for jpeg, the underlying
    // canvas's own toDataURL) reads directly from the canvas's
    // framebuffer, so it captures exactly what's on screen, including the
    // current rotation/zoom, any selection highlight, and any drawn
    // measurement line.
    window.__captureSnapshot = function (format) {
      try {
        var dataUri =
          format === 'jpeg'
            ? viewer.getCanvas().toDataURL('image/jpeg', ${JPEG_EXPORT_QUALITY})
            : viewer.pngURI();
        post({ type: 'snapshot', dataUri: dataUri, format: format === 'jpeg' ? 'jpeg' : 'png' });
      } catch (error) {
        post({ type: 'error', message: String(error && error.message ? error.message : error) });
      }
    };

    post({ type: 'ready' });
  } catch (error) {
    post({ type: 'error', message: String(error && error.message ? error.message : error) });
  }
})();
</script>
</body>
</html>`;
}
