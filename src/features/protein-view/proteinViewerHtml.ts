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

export const VISUALIZATION_MODES = ['ballAndStick', 'spaceFilling', 'wireframe', 'stick'] as const;
export type VisualizationMode = (typeof VISUALIZATION_MODES)[number];

/**
 * Builds a self-contained HTML page: 3Dmol.js inlined directly (no CDN
 * dependency at runtime), fed the given SDF, styled ball-and-stick by
 * default with the Jmol color scheme (the same standard CPK colors the
 * subject asks for), and wired to post messages back to React Native for
 * readiness, atom taps, and background taps (dismiss). Tapping an atom
 * also bumps its sphere scale as a selection highlight, reverted on the
 * next tap elsewhere. `window.__setVisualizationMode` lets React Native
 * switch to the bonus space-filling/wireframe/stick models in place,
 * without re-parsing or re-adding the SDF model. threeDmolScript is
 * injected as-is (trusted, bundled asset); sdf goes through
 * JSON.stringify so any characters in it are safely escaped as a JS
 * string literal, not interpreted as HTML/script markup.
 */
export function buildProteinViewerHtml(threeDmolScript: string, sdf: string): string {
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
    var currentStyle = STYLES.ballAndStick;
    var selectedSerial = null;
    var lastAtomClickAt = 0;

    function highlightStyleFor(style) {
      var baseScale = (style.sphere && style.sphere.scale) || ${HIGHLIGHT_FALLBACK_SPHERE_SCALE};
      var highlighted = JSON.parse(JSON.stringify(style));
      highlighted.sphere = { scale: baseScale * ${HIGHLIGHT_SCALE_FACTOR}, colorscheme: 'Jmol' };
      return highlighted;
    }

    function clearSelection() {
      if (selectedSerial !== null) {
        viewer.setStyle({ serial: selectedSerial }, currentStyle);
        selectedSerial = null;
      }
    }

    function applyCurrentStyle() {
      var previousSelected = selectedSerial;
      viewer.setStyle({}, currentStyle);
      if (previousSelected !== null) {
        viewer.setStyle({ serial: previousSelected }, highlightStyleFor(currentStyle));
      }
      viewer.render();
    }

    viewer.addModel(${JSON.stringify(sdf)}, 'sdf');
    applyCurrentStyle();

    viewer.setClickable({}, true, function (atom) {
      lastAtomClickAt = Date.now();
      clearSelection();
      viewer.setStyle({ serial: atom.serial }, highlightStyleFor(currentStyle));
      selectedSerial = atom.serial;
      viewer.render();

      post({
        type: 'atomClick',
        atom: {
          id: atom.serial,
          element: atom.elem,
          x: atom.x,
          y: atom.y,
          z: atom.z,
          bondOrders: atom.bondOrder || [],
        },
      });
    });

    document.getElementById('viewer').addEventListener('click', function () {
      if (Date.now() - lastAtomClickAt > ${ATOM_CLICK_DEBOUNCE_MS}) {
        clearSelection();
        viewer.render();
        post({ type: 'backgroundClick' });
      }
    });

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

    viewer.zoomTo();
    viewer.render();

    // Invoked from React Native via injectJavaScript to capture the
    // current view for sharing — pngURI() reads directly from the
    // canvas's framebuffer, so it captures exactly what's on screen,
    // including the current rotation/zoom and any selection highlight.
    window.__captureSnapshot = function () {
      try {
        post({ type: 'snapshot', dataUri: viewer.pngURI() });
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
