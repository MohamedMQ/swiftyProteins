import * as THREE from 'three';

import type { Vec3 } from '../../core/parsing/cifAtomParser';

// Extra margin beyond the tight bounding sphere so the molecule doesn't
// touch the edges of the screen on load.
const FRAME_PADDING = 1.2;

/**
 * Centers the molecule's group on its centroid, then positions the camera
 * along +Z at the distance needed for the whole bounding sphere to fit
 * within the camera's vertical FOV — the standard "frame object in view"
 * formula (radius subtends half the vertical FOV at that distance).
 * Returns the bounding sphere since it's also useful later (e.g. resetting
 * the camera on a double-tap).
 */
export function frameCameraOnMolecule(
  group: THREE.Group,
  camera: THREE.PerspectiveCamera,
  centroid: Vec3
): THREE.Sphere {
  group.position.set(-centroid.x, -centroid.y, -centroid.z);
  group.updateMatrixWorld(true);

  const boundingSphere = new THREE.Box3()
    .setFromObject(group)
    .getBoundingSphere(new THREE.Sphere());

  const verticalFovRadians = THREE.MathUtils.degToRad(camera.fov);
  const distance = (boundingSphere.radius * FRAME_PADDING) / Math.sin(verticalFovRadians / 2);

  camera.position.set(
    boundingSphere.center.x,
    boundingSphere.center.y,
    boundingSphere.center.z + distance
  );
  camera.near = Math.max(0.01, distance - boundingSphere.radius * 2);
  camera.far = distance + boundingSphere.radius * 4;
  camera.updateProjectionMatrix();
  camera.lookAt(boundingSphere.center);

  return boundingSphere;
}
