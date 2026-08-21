import { VISUALIZATION_MODES, type VisualizationMode } from '../../core/viewer/visualizationMode';

export { VISUALIZATION_MODES, type VisualizationMode };

export type ImageExportFormat = 'png' | 'jpeg';

export type MeasureMode = 'off' | 'distance' | 'angle';

const DEFAULT_BACKGROUND_COLOR = '#0E1116';
const SPHERE_SCALE = 0.35;
const STICK_RADIUS = 0.08;
const HIGHLIGHT_SCALE_FACTOR = 1.4;
const ATOM_CLICK_DEBOUNCE_MS = 50;
const SPACE_FILLING_SCALE = 1.0;
const HIGHLIGHT_FALLBACK_SPHERE_SCALE = 0.3;
const SAME_ELEMENT_HIGHLIGHT_SCALE_FACTOR = 1.15;
const DOUBLE_TAP_MAX_INTERVAL_MS = 350;
const CENTER_ON_ATOM_ANIMATION_MS = 400;
const MEASUREMENT_LINE_COLOR = 'yellow';
const JPEG_EXPORT_QUALITY = 0.92;
const BOND_PICK_RADIUS = STICK_RADIUS * 4;
const AMBIENT_OCCLUSION_STRENGTH = 1.0;
const AMBIENT_OCCLUSION_RADIUS = 4;
const LARGE_MOLECULE_ATOM_THRESHOLD = 300;
const DEFAULT_SPHERE_QUALITY = 2;
const REDUCED_SPHERE_QUALITY = 1;
const FPS_SAMPLE_WINDOW_MS = 2000;
const FPS_DOWNGRADE_THRESHOLD = 45;
const ZOOM_OUT_LIMIT_FACTOR = 4;

export interface ProteinViewerHtmlOptions {
  initialVisualizationMode?: VisualizationMode;
  initialAtomLabelsVisible?: boolean;
  backgroundColor?: string;
  atomCount?: number;
}

export function buildProteinViewerHtml(
  threeDmolScript: string,
  sdf: string,
  options: ProteinViewerHtmlOptions = {}
): string {
  const initialMode = options.initialVisualizationMode ?? 'ballAndStick';
  const initialAtomLabelsVisible = options.initialAtomLabelsVisible ?? false;
  const backgroundColor = options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
  const sphereQuality =
    options.atomCount !== undefined && options.atomCount > LARGE_MOLECULE_ATOM_THRESHOLD
      ? REDUCED_SPHERE_QUALITY
      : DEFAULT_SPHERE_QUALITY;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #viewer { margin: 0; padding: 0; width: 100%; height: 100%; background: ${backgroundColor}; overflow: hidden; }
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
      backgroundColor: '${backgroundColor}',
      ambientOcclusion: { strength: ${AMBIENT_OCCLUSION_STRENGTH}, radius: ${AMBIENT_OCCLUSION_RADIUS} },
    });

    var STYLES = {
      ballAndStick: {
        stick: { radius: ${STICK_RADIUS}, colorscheme: 'Jmol' },
        sphere: { scale: ${SPHERE_SCALE}, colorscheme: 'Jmol', sphereQuality: ${sphereQuality} },
      },
      spaceFilling: {
        sphere: { scale: ${SPACE_FILLING_SCALE}, colorscheme: 'Jmol', sphereQuality: ${sphereQuality} },
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
    // 'off' | 'distance' | 'angle'. Distance needs 2 picked atoms, angle
    // needs 3 (the second pick is the angle's vertex).
    var measureMode = 'off';
    var measurePoints = [];
    var measureShapes = [];
    var measureLabels = [];

    function clearMeasurementArtifacts() {
      for (var i = 0; i < measureShapes.length; i++) {
        viewer.removeShape(measureShapes[i]);
      }
      for (var j = 0; j < measureLabels.length; j++) {
        viewer.removeLabel(measureLabels[j]);
      }
      measureShapes = [];
      measureLabels = [];
      measurePoints = [];
    }

    function requiredPointsFor(mode) {
      return mode === 'angle' ? 3 : 2;
    }

    function hintFor(mode, pickedCount) {
      if (mode === 'angle') {
        if (pickedCount === 1) {
          return 'tap the vertex atom';
        }
        return 'tap the third atom';
      }
      return 'tap a second atom';
    }

    function addMeasureLine(a, b) {
      measureShapes.push(
        viewer.addLine({
          color: '${MEASUREMENT_LINE_COLOR}',
          dashed: true,
          start: { x: a.x, y: a.y, z: a.z },
          end: { x: b.x, y: b.y, z: b.z },
        })
      );
    }

    function addMeasureLabel(text, position) {
      measureLabels.push(
        viewer.addLabel(text, {
          position: position,
          fontColor: '${MEASUREMENT_LINE_COLOR}',
          backgroundColor: 'black',
          backgroundOpacity: 0.6,
          fontSize: 12,
          inFront: true,
          showBackground: true,
        })
      );
    }

    function distanceBetween(a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      var dz = a.z - b.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function angleBetween(a, vertex, c) {
      var v1 = { x: a.x - vertex.x, y: a.y - vertex.y, z: a.z - vertex.z };
      var v2 = { x: c.x - vertex.x, y: c.y - vertex.y, z: c.z - vertex.z };
      var dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
      var mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
      var mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
      if (mag1 === 0 || mag2 === 0) {
        return 0;
      }
      var cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      return (Math.acos(cosAngle) * 180) / Math.PI;
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

    // Bonds aren't independently clickable atoms in 3Dmol's model — only
    // atoms are — so each bond gets its own invisible pickable cylinder
    // layered over the visible stick, wider than the stick itself for a
    // forgiving touch target. Built once, independent of visualization
    // mode, from the model's own connectivity (each bond appears from both
    // its atoms' 'bonds' lists, so pairs are deduped via index < index).
    function addBondClickTargets() {
      var atoms = viewer.selectedAtoms({});
      var atomsByIndex = {};
      for (var i = 0; i < atoms.length; i++) {
        atomsByIndex[atoms[i].index] = atoms[i];
      }
      for (var i2 = 0; i2 < atoms.length; i2++) {
        var atom = atoms[i2];
        var neighborIndices = atom.bonds || [];
        for (var b = 0; b < neighborIndices.length; b++) {
          var neighborIndex = neighborIndices[b];
          if (neighborIndex <= atom.index) {
            continue;
          }
          var neighbor = atomsByIndex[neighborIndex];
          if (!neighbor) {
            continue;
          }
          (function (a, n, order) {
            viewer.addCylinder({
              start: { x: a.x, y: a.y, z: a.z },
              end: { x: n.x, y: n.y, z: n.z },
              radius: ${BOND_PICK_RADIUS},
              color: '0x000000',
              opacity: 0.0,
              clickable: true,
              callback: function () {
                lastAtomClickAt = Date.now();
                if (measureMode !== 'off') {
                  // Bonds aren't measurement targets — only atoms are.
                  return;
                }
                clearSelection();
                viewer.render();
                var dx = a.x - n.x;
                var dy = a.y - n.y;
                var dz = a.z - n.z;
                post({
                  type: 'bondClick',
                  bond: {
                    elementA: a.elem,
                    elementB: n.elem,
                    order: order,
                    length: Math.sqrt(dx * dx + dy * dy + dz * dz),
                  },
                });
              },
            });
          })(atom, neighbor, (atom.bondOrder && atom.bondOrder[b]) || 1);
        }
      }
    }

    viewer.addModel(${JSON.stringify(sdf)}, 'sdf');
    applyCurrentStyle();
    addBondClickTargets();

    viewer.setClickable({}, true, function (atom) {
      if (measureMode !== 'off') {
        var lastPoint = measurePoints[measurePoints.length - 1];
        if (lastPoint && lastPoint.serial === atom.serial) {
          // Tapping the most recently picked atom again cancels the whole
          // in-progress measurement, not just that one point.
          clearMeasurementArtifacts();
          post({ type: 'measureCleared' });
          return;
        }

        measurePoints.push(atom);
        var needed = requiredPointsFor(measureMode);

        if (measurePoints.length < needed) {
          if (measurePoints.length >= 2) {
            addMeasureLine(measurePoints[measurePoints.length - 2], atom);
            viewer.render();
          }
          post({
            type: 'measurePointSelected',
            element: atom.elem,
            hint: hintFor(measureMode, measurePoints.length),
          });
          return;
        }

        if (measureMode === 'angle') {
          var a = measurePoints[0];
          var vertex = measurePoints[1];
          var c = measurePoints[2];
          addMeasureLine(vertex, c);
          var angle = angleBetween(a, vertex, c);
          addMeasureLabel(angle.toFixed(1) + '\\u00B0', { x: vertex.x, y: vertex.y, z: vertex.z });
          viewer.render();
          post({
            type: 'measurementResult',
            kind: 'angle',
            angle: angle,
            elementA: a.elem,
            elementB: vertex.elem,
            elementC: c.elem,
          });
        } else {
          var first = measurePoints[0];
          var distance = distanceBetween(first, atom);
          addMeasureLine(first, atom);
          addMeasureLabel(distance.toFixed(2) + ' \\u00C5', {
            x: (first.x + atom.x) / 2,
            y: (first.y + atom.y) / 2,
            z: (first.z + atom.z) / 2,
          });
          viewer.render();
          post({
            type: 'measurementResult',
            kind: 'distance',
            distance: distance,
            fromElement: first.elem,
            toElement: atom.elem,
          });
        }
        measurePoints = [];
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
        if (measureMode !== 'off') {
          if (measurePoints.length > 0) {
            clearMeasurementArtifacts();
            viewer.render();
            post({ type: 'measureCleared' });
          }
          return;
        }
        clearSelection();
        viewer.render();
        post({ type: 'backgroundClick' });
      }
    });

    // Invoked from React Native to switch measurement mode: while 'distance'
    // or 'angle', atom taps pick 2 or 3 points respectively and draw dashed
    // lines + a result label between them instead of the normal
    // select/highlight behavior.
    window.__setMeasureMode = function (mode) {
      try {
        measureMode = mode === 'angle' || mode === 'distance' ? mode : 'off';
        clearSelection();
        clearMeasurementArtifacts();
        viewer.render();
        post({ type: 'measureModeChanged', mode: measureMode });
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

    // Invoked from React Native when the atom info card's own close button
    // is tapped — dismissing the card that way doesn't go through the
    // viewer's click handling at all, so the selected atom's highlight
    // sphere needs to be reverted here explicitly, the same as a
    // background tap would.
    window.__clearSelection = function () {
      try {
        clearSelection();
        viewer.render();
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

    // Adaptive frame-rate safeguard: measures real rendered frame timing
    // via requestAnimationFrame (not assumed), and if the rolling average
    // sustains below FPS_DOWNGRADE_THRESHOLD, drops ambient occlusion once
    // — the priciest per-frame cost this viewer adds — to recover headroom
    // instead of leaving the view stuttering for the rest of the session.
    var frameTimestamps = [];
    var qualityDowngraded = false;

    function sampleFrame(timestamp) {
      frameTimestamps.push(timestamp);
      while (frameTimestamps.length > 0 && timestamp - frameTimestamps[0] > ${FPS_SAMPLE_WINDOW_MS}) {
        frameTimestamps.shift();
      }
      if (!qualityDowngraded && frameTimestamps.length >= 2) {
        var windowSeconds = (timestamp - frameTimestamps[0]) / 1000;
        if (windowSeconds >= 1) {
          var fps = (frameTimestamps.length - 1) / windowSeconds;
          if (fps < ${FPS_DOWNGRADE_THRESHOLD}) {
            qualityDowngraded = true;
            viewer.setViewStyle({ style: '' });
            viewer.render();
            post({ type: 'performanceDowngraded', fps: fps });
          }
        }
      }
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);

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
