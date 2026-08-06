import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import * as THREE from 'three';

import { parseMolecule } from '../../core/parsing/molecule';
import { frameCameraOnMolecule } from './cameraFraming';
import { addLightingRig } from './lightingRig';
import { buildMoleculeGroup, disposeMoleculeGroup } from './moleculeSceneBuilder';

interface SceneViewProps {
  raw: string;
}

/**
 * three.js's WebGLRenderer defaults `canvas` to `document.createElementNS(...)`
 * when it's not supplied — a real browser DOM call that doesn't exist in
 * React Native. Passing this minimal stand-in satisfies that default (and
 * the handful of resize/style/event-listener touches WebGLRenderer makes
 * on `domElement`) without ever needing a real DOM.
 */
function createFakeCanvas(gl: ExpoWebGLRenderingContext) {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
}

/** Native GL + three.js bridge. Render-loop lifecycle (start on context create, stop on unmount) lives here. */
export function SceneView({ raw }: SceneViewProps) {
  const isMountedRef = useRef(true);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (moleculeGroupRef.current !== null) {
        disposeMoleculeGroup(moleculeGroupRef.current);
        moleculeGroupRef.current = null;
      }
    },
    []
  );

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const renderer = new THREE.WebGLRenderer({ context: gl, canvas: createFakeCanvas(gl) });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x0e1116, 1);

      const camera = new THREE.PerspectiveCamera(
        50,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        100
      );

      const scene = new THREE.Scene();
      // Lights are attached to the camera (see lightingRig.ts), so the
      // camera itself needs to be part of the scene graph for three.js to
      // find and apply them.
      scene.add(camera);
      addLightingRig(camera);

      // Parsing was already proven against real RCSB data in Day 6; this
      // guards only against the theoretical case of a genuinely
      // unparseable molecule reaching this screen, so the view stays
      // blank instead of crashing rather than needing full error UI here.
      try {
        const molecule = parseMolecule(raw);
        const moleculeGroup = buildMoleculeGroup(molecule);
        moleculeGroupRef.current = moleculeGroup;
        scene.add(moleculeGroup);
        frameCameraOnMolecule(moleculeGroup, camera, molecule.centroid);
      } catch (error) {
        console.warn('Failed to build molecule scene:', error);
      }

      const render = () => {
        if (!isMountedRef.current) {
          return;
        }
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    },
    [raw]
  );

  return <GLView style={styles.container} onContextCreate={onContextCreate} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
