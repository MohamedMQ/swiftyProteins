const BACKGROUND_COLOR = '#0E1116';
// Matches the proportions tuned in the earlier native ball-and-stick
// renderer: covalent-radius-scaled spheres, sticks thinner than any atom.
const SPHERE_SCALE = 0.35;
const STICK_RADIUS = 0.08;

/**
 * Builds a self-contained HTML page: 3Dmol.js inlined directly (no CDN
 * dependency at runtime), fed the given SDF, styled ball-and-stick with
 * the Jmol color scheme (the same standard CPK colors the subject asks
 * for), and wired to post messages back to React Native for readiness and
 * atom taps. threeDmolScript is injected as-is (trusted, bundled asset);
 * sdf goes through JSON.stringify so any characters in it are safely
 * escaped as a JS string literal, not interpreted as HTML/script markup.
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

    viewer.addModel(${JSON.stringify(sdf)}, 'sdf');
    viewer.setStyle({}, {
      stick: { radius: ${STICK_RADIUS}, colorscheme: 'Jmol' },
      sphere: { scale: ${SPHERE_SCALE}, colorscheme: 'Jmol' },
    });
    viewer.setClickable({}, true, function (atom) {
      post({
        type: 'atomClick',
        atom: { id: atom.serial, element: atom.elem, x: atom.x, y: atom.y, z: atom.z },
      });
    });
    viewer.zoomTo();
    viewer.render();

    post({ type: 'ready' });
  } catch (error) {
    post({ type: 'error', message: String(error && error.message ? error.message : error) });
  }
})();
</script>
</body>
</html>`;
}
