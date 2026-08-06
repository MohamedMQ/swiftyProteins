import * as THREE from 'three';

export interface LightingRig {
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
}

const KEY_LIGHT_INTENSITY = 1.1;
const FILL_LIGHT_INTENSITY = 0.35;
const AMBIENT_LIGHT_INTENSITY = 0.28;

/**
 * Lights are attached to the camera rather than fixed in world space, so
 * the molecule always reads as lit from the viewer's perspective and the
 * lighting stays stable as it's rotated later (Day 8), instead of hotspots
 * sweeping across it as it turns. For this to actually illuminate
 * anything, `camera` must already be part of the scene graph
 * (`scene.add(camera)`) — three.js collects lights by traversing the
 * scene, not by walking the camera's own subtree independently.
 */
export function addLightingRig(camera: THREE.Camera): LightingRig {
  const keyLight = new THREE.DirectionalLight(0xffffff, KEY_LIGHT_INTENSITY);
  keyLight.position.set(1, 1, 1);
  camera.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, FILL_LIGHT_INTENSITY);
  fillLight.position.set(-1, -0.5, -1);
  camera.add(fillLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_LIGHT_INTENSITY);
  camera.add(ambientLight);

  return { keyLight, fillLight, ambientLight };
}
