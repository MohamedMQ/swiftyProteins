import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import * as THREE from 'three';

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

/**
 * Native GL + three.js bridge, wrapped as a standalone component so the
 * render-loop lifecycle (start on context create, stop on unmount) lives in
 * one place. Content is currently a smoke-test cube proving the bridge
 * itself works — CPK ball-and-stick rendering replaces this scene in the
 * next commits, once the underlying pipeline is confirmed on a real device.
 */
export function SceneView() {
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const renderer = new THREE.WebGLRenderer({ context: gl, canvas: createFakeCanvas(gl) });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x0e1116, 1);

    const camera = new THREE.PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.z = 4;

    const scene = new THREE.Scene();

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x35c7a0, roughness: 0.5 })
    );
    scene.add(cube);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 2, 3);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const render = () => {
      if (!isMountedRef.current) {
        return;
      }
      requestAnimationFrame(render);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  }, []);

  return <GLView style={styles.container} onContextCreate={onContextCreate} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
