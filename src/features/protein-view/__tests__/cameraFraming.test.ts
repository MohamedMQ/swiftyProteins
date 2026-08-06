import { readFileSync } from 'fs';
import { join } from 'path';
import * as THREE from 'three';

import { parseMolecule, type Molecule } from '../../../core/parsing/molecule';
import { frameCameraOnMolecule } from '../cameraFraming';
import { buildMoleculeGroup } from '../moleculeSceneBuilder';

function loadFixture(name: string): string {
  return readFileSync(
    join(__dirname, '../../../core/parsing/__tests__/fixtures', name),
    'utf8'
  );
}

function makeCamera(): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(50, 1, 0.1, 100);
}

const offCenterMolecule: Molecule = {
  atoms: [
    { id: 'A1', element: 'C', position: { x: 5, y: 0, z: 0 } },
    { id: 'A2', element: 'C', position: { x: 15, y: 0, z: 0 } },
  ],
  bonds: [],
  formula: 'C2',
  centroid: { x: 10, y: 0, z: 0 },
};

describe('frameCameraOnMolecule — centering', () => {
  it('translates the group by exactly -centroid', () => {
    const group = buildMoleculeGroup(offCenterMolecule);
    const camera = makeCamera();

    frameCameraOnMolecule(group, camera, offCenterMolecule.centroid);

    expect(group.position.x).toBeCloseTo(-10, 10);
    expect(group.position.y).toBeCloseTo(0, 10);
    expect(group.position.z).toBeCloseTo(0, 10);
  });

  it('leaves an already-centered molecule (centroid at origin) in place', () => {
    const molecule: Molecule = {
      atoms: [
        { id: 'A1', element: 'C', position: { x: -5, y: 0, z: 0 } },
        { id: 'A2', element: 'C', position: { x: 5, y: 0, z: 0 } },
      ],
      bonds: [],
      formula: 'C2',
      centroid: { x: 0, y: 0, z: 0 },
    };
    const group = buildMoleculeGroup(molecule);
    const camera = makeCamera();

    frameCameraOnMolecule(group, camera, molecule.centroid);

    expect(group.position.x).toBeCloseTo(0, 10);
    expect(group.position.y).toBeCloseTo(0, 10);
    expect(group.position.z).toBeCloseTo(0, 10);
  });
});

describe('frameCameraOnMolecule — bounding sphere', () => {
  it('returns a sphere that actually contains every centered atom', () => {
    const group = buildMoleculeGroup(offCenterMolecule);
    const camera = makeCamera();

    const sphere = frameCameraOnMolecule(group, camera, offCenterMolecule.centroid);

    for (const atom of offCenterMolecule.atoms) {
      const worldPosition = new THREE.Vector3(
        atom.position.x - offCenterMolecule.centroid.x,
        atom.position.y - offCenterMolecule.centroid.y,
        atom.position.z - offCenterMolecule.centroid.z
      );
      const distanceFromSphereCenter = worldPosition.distanceTo(sphere.center);
      expect(distanceFromSphereCenter).toBeLessThanOrEqual(sphere.radius);
    }
  });

  it('produces a larger bounding sphere for a real large molecule (CLA) than a small one (HEM)', () => {
    const hem = parseMolecule(loadFixture('HEM.cif'));
    const cla = parseMolecule(loadFixture('CLA.cif'));

    const hemSphere = frameCameraOnMolecule(buildMoleculeGroup(hem), makeCamera(), hem.centroid);
    const claSphere = frameCameraOnMolecule(buildMoleculeGroup(cla), makeCamera(), cla.centroid);

    expect(claSphere.radius).toBeGreaterThan(hemSphere.radius);
  });
});

describe('frameCameraOnMolecule — camera placement', () => {
  it('positions the camera so the whole bounding sphere fits within the vertical FOV', () => {
    const group = buildMoleculeGroup(offCenterMolecule);
    const camera = makeCamera();

    const sphere = frameCameraOnMolecule(group, camera, offCenterMolecule.centroid);
    const distance = camera.position.distanceTo(sphere.center);

    // The angle the sphere's radius subtends from the camera must not
    // exceed half the vertical FOV, or part of the molecule would be
    // outside the view frustum.
    const halfFovRadians = THREE.MathUtils.degToRad(camera.fov) / 2;
    const subtendedAngle = Math.asin(sphere.radius / distance);

    expect(subtendedAngle).toBeLessThanOrEqual(halfFovRadians + 1e-9);
  });

  it('aims the camera at the bounding sphere center', () => {
    const group = buildMoleculeGroup(offCenterMolecule);
    const camera = makeCamera();

    const sphere = frameCameraOnMolecule(group, camera, offCenterMolecule.centroid);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const toTarget = new THREE.Vector3().subVectors(sphere.center, camera.position).normalize();

    expect(forward.dot(toTarget)).toBeCloseTo(1, 5);
  });

  it('keeps the bounding sphere between the near and far clipping planes', () => {
    const group = buildMoleculeGroup(offCenterMolecule);
    const camera = makeCamera();

    const sphere = frameCameraOnMolecule(group, camera, offCenterMolecule.centroid);
    const distance = camera.position.distanceTo(sphere.center);

    expect(camera.near).toBeGreaterThan(0);
    expect(camera.near).toBeLessThan(distance - sphere.radius + 1e-6);
    expect(camera.far).toBeGreaterThan(distance + sphere.radius);
  });
});
