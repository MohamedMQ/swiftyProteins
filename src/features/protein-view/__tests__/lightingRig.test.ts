import * as THREE from 'three';

import { addLightingRig } from '../lightingRig';

describe('addLightingRig', () => {
  it('attaches exactly the key, fill, and ambient lights to the camera', () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = addLightingRig(camera);

    expect(camera.children).toHaveLength(3);
    expect(camera.children).toContain(rig.keyLight);
    expect(camera.children).toContain(rig.fillLight);
    expect(camera.children).toContain(rig.ambientLight);
  });

  it('makes the fill light weaker than the key light', () => {
    const rig = addLightingRig(new THREE.PerspectiveCamera());
    expect(rig.fillLight.intensity).toBeLessThan(rig.keyLight.intensity);
  });

  it('keeps ambient intensity low relative to both the key and fill lights', () => {
    const rig = addLightingRig(new THREE.PerspectiveCamera());
    expect(rig.ambientLight.intensity).toBeLessThan(rig.fillLight.intensity);
    expect(rig.ambientLight.intensity).toBeLessThan(rig.keyLight.intensity);
  });

  it('places the fill light roughly opposite the key light', () => {
    const rig = addLightingRig(new THREE.PerspectiveCamera());
    const keyDirection = rig.keyLight.position.clone().normalize();
    const fillDirection = rig.fillLight.position.clone().normalize();

    // Opposite-ish sides means pointing more away from each other than
    // toward each other.
    expect(keyDirection.dot(fillDirection)).toBeLessThan(0);
  });

  it('only affects the camera it is given, not a shared/global light state', () => {
    const cameraA = new THREE.PerspectiveCamera();
    const cameraB = new THREE.PerspectiveCamera();

    addLightingRig(cameraA);
    expect(cameraB.children).toHaveLength(0);
  });
});
