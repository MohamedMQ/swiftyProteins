import { readFileSync } from 'fs';
import { join } from 'path';
import * as THREE from 'three';

import { getCpkColor } from '../../../core/chemistry/elementColors';
import { getCovalentRadius } from '../../../core/chemistry/elementRadii';
import { parseMolecule, type Molecule } from '../../../core/parsing/molecule';
import { buildMoleculeGroup, disposeMoleculeGroup } from '../moleculeSceneBuilder';

function loadFixture(name: string): string {
  return readFileSync(
    join(__dirname, '../../../core/parsing/__tests__/fixtures', name),
    'utf8'
  );
}

function sphereMeshes(group: THREE.Group): THREE.Mesh[] {
  return group.children.filter(
    (child): child is THREE.Mesh =>
      child instanceof THREE.Mesh && child.geometry.type === 'SphereGeometry'
  );
}

function cylinderMeshes(group: THREE.Group): THREE.Mesh[] {
  return group.children.filter(
    (child): child is THREE.Mesh =>
      child instanceof THREE.Mesh && child.geometry.type === 'CylinderGeometry'
  );
}

const twoAtomMolecule: Molecule = {
  atoms: [
    { id: 'A1', element: 'C', position: { x: 0, y: 0, z: 0 } },
    { id: 'A2', element: 'O', position: { x: 3, y: 4, z: 0 } },
  ],
  bonds: [{ atomIdA: 'A1', atomIdB: 'A2', order: 'single', isAromatic: false }],
  formula: 'CO',
  centroid: { x: 1.5, y: 2, z: 0 },
};

describe('buildMoleculeGroup — geometry construction', () => {
  const group = buildMoleculeGroup(twoAtomMolecule);
  const spheres = sphereMeshes(group);
  const cylinders = cylinderMeshes(group);

  it('creates one sphere per atom and one cylinder per bond', () => {
    expect(spheres).toHaveLength(2);
    expect(cylinders).toHaveLength(1);
    expect(group.children).toHaveLength(3);
  });

  it('positions each atom sphere exactly at its parsed coordinates', () => {
    const a1 = spheres.find((mesh) => mesh.name === 'A1');
    const a2 = spheres.find((mesh) => mesh.name === 'A2');

    expect(a1?.position.toArray()).toEqual([0, 0, 0]);
    expect(a2?.position.toArray()).toEqual([3, 4, 0]);
  });

  it('colors each atom sphere with its element\'s CPK color', () => {
    const a1 = spheres.find((mesh) => mesh.name === 'A1');
    const a2 = spheres.find((mesh) => mesh.name === 'A2');
    const materialA1 = a1?.material as THREE.MeshStandardMaterial;
    const materialA2 = a2?.material as THREE.MeshStandardMaterial;

    expect(`#${materialA1.color.getHexString()}`).toBe(getCpkColor('C').toLowerCase());
    expect(`#${materialA2.color.getHexString()}`).toBe(getCpkColor('O').toLowerCase());
  });

  it('sizes each atom sphere from its covalent radius', () => {
    const a1 = spheres.find((mesh) => mesh.name === 'A1');
    const geometry = a1?.geometry as THREE.SphereGeometry;

    expect(geometry.parameters.radius).toBeCloseTo(getCovalentRadius('C') * 0.35, 5);
  });

  it('places the bond cylinder at the midpoint between the two atoms', () => {
    const cylinder = cylinders[0];
    expect(cylinder.position.toArray()).toEqual([1.5, 2, 0]);
  });

  it('stretches the shared unit-length cylinder to the real distance between the two atoms', () => {
    const cylinder = cylinders[0];
    const geometry = cylinder.geometry as THREE.CylinderGeometry;
    // 3-4-5 triangle: distance from (0,0,0) to (3,4,0) is exactly 5. Length
    // is encoded via scale now, not baked into the geometry (see the
    // geometry-reuse describe block below) — the geometry's own height
    // parameter should stay the shared unit value.
    expect(geometry.parameters.height).toBe(1);
    expect(cylinder.scale.y).toBeCloseTo(5, 5);
  });

  it('orients the bond cylinder so its local +Y axis points along the bond direction', () => {
    const cylinder = cylinders[0];
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cylinder.quaternion);
    const expectedDirection = new THREE.Vector3(3, 4, 0).normalize();

    expect(up.x).toBeCloseTo(expectedDirection.x, 5);
    expect(up.y).toBeCloseTo(expectedDirection.y, 5);
    expect(up.z).toBeCloseTo(expectedDirection.z, 5);
  });

  it('makes bond cylinders thinner than every atom sphere in the molecule', () => {
    const cylinder = cylinders[0];
    const cylinderGeometry = cylinder.geometry as THREE.CylinderGeometry;

    for (const sphere of spheres) {
      const sphereGeometry = sphere.geometry as THREE.SphereGeometry;
      expect(cylinderGeometry.parameters.radiusTop).toBeLessThan(sphereGeometry.parameters.radius);
    }
  });
});

describe('buildMoleculeGroup — defensive handling', () => {
  it('skips a bond referencing an atom id that is not in the molecule, without throwing', () => {
    const molecule: Molecule = {
      atoms: [{ id: 'A1', element: 'C', position: { x: 0, y: 0, z: 0 } }],
      bonds: [{ atomIdA: 'A1', atomIdB: 'GHOST', order: 'single', isAromatic: false }],
      formula: 'C',
      centroid: { x: 0, y: 0, z: 0 },
    };

    const group = buildMoleculeGroup(molecule);
    expect(sphereMeshes(group)).toHaveLength(1);
    expect(cylinderMeshes(group)).toHaveLength(0);
  });
});

describe('buildMoleculeGroup — real molecule (HEM)', () => {
  it('produces exactly one sphere per atom and one cylinder per bond', () => {
    const molecule = parseMolecule(loadFixture('HEM.cif'));
    const group = buildMoleculeGroup(molecule);

    expect(sphereMeshes(group)).toHaveLength(molecule.atoms.length);
    expect(cylinderMeshes(group)).toHaveLength(molecule.bonds.length);
  });

  it('positions the iron atom sphere at its parsed coordinates', () => {
    const molecule = parseMolecule(loadFixture('HEM.cif'));
    const group = buildMoleculeGroup(molecule);
    const iron = molecule.atoms.find((atom) => atom.id === 'FE');
    const ironMesh = sphereMeshes(group).find((mesh) => mesh.name === 'FE');

    expect(iron).toBeDefined();
    expect(ironMesh?.position.toArray()).toEqual([iron?.position.x, iron?.position.y, iron?.position.z]);
  });
});

const repeatedElementMolecule: Molecule = {
  atoms: [
    { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 } },
    { id: 'C2', element: 'C', position: { x: 1, y: 0, z: 0 } },
    { id: 'C3', element: 'C', position: { x: 2, y: 0, z: 0 } },
    { id: 'O1', element: 'O', position: { x: 3, y: 0, z: 0 } },
  ],
  bonds: [
    { atomIdA: 'C1', atomIdB: 'C2', order: 'single', isAromatic: false },
    { atomIdA: 'C2', atomIdB: 'C3', order: 'single', isAromatic: false },
    { atomIdA: 'C3', atomIdB: 'O1', order: 'double', isAromatic: false },
  ],
  formula: 'C3O',
  centroid: { x: 1.5, y: 0, z: 0 },
};

describe('buildMoleculeGroup — geometry/material reuse', () => {
  it('shares the exact same sphere geometry and material across every atom of the same element', () => {
    const group = buildMoleculeGroup(repeatedElementMolecule);
    const spheres = sphereMeshes(group);
    const carbons = spheres.filter((mesh) => mesh.name.startsWith('C'));

    expect(carbons).toHaveLength(3);
    expect(carbons[1].geometry).toBe(carbons[0].geometry);
    expect(carbons[2].geometry).toBe(carbons[0].geometry);
    expect(carbons[1].material).toBe(carbons[0].material);
    expect(carbons[2].material).toBe(carbons[0].material);
  });

  it('gives different elements different geometry and material instances', () => {
    const group = buildMoleculeGroup(repeatedElementMolecule);
    const spheres = sphereMeshes(group);
    const carbon = spheres.find((mesh) => mesh.name === 'C1');
    const oxygen = spheres.find((mesh) => mesh.name === 'O1');

    expect(carbon?.geometry).not.toBe(oxygen?.geometry);
    expect(carbon?.material).not.toBe(oxygen?.material);
  });

  it('creates exactly one sphere geometry per distinct element for a real molecule (HEM)', () => {
    const molecule = parseMolecule(loadFixture('HEM.cif'));
    const group = buildMoleculeGroup(molecule);
    const distinctElements = new Set(molecule.atoms.map((atom) => atom.element));
    const distinctGeometries = new Set(sphereMeshes(group).map((mesh) => mesh.geometry));

    expect(distinctGeometries.size).toBe(distinctElements.size);
  });

  it('shares one unit-length cylinder geometry and one material across every bond, regardless of length', () => {
    const group = buildMoleculeGroup(repeatedElementMolecule);
    const cylinders = cylinderMeshes(group);

    expect(cylinders).toHaveLength(3);
    // The three bonds span different real distances (1, 1, and sqrt(2)
    // since C3-O1 also isn't axis-aligned would differ — here all are
    // axis-aligned at length 1, so assert on geometry/material identity,
    // which is what this commit actually changed.
    expect(cylinders[1].geometry).toBe(cylinders[0].geometry);
    expect(cylinders[2].geometry).toBe(cylinders[0].geometry);
    expect(cylinders[1].material).toBe(cylinders[0].material);
    expect(cylinders[2].material).toBe(cylinders[0].material);
  });
});

describe('disposeMoleculeGroup', () => {
  it('disposes every unique geometry and material exactly once, even when shared by many meshes', () => {
    const group = buildMoleculeGroup(repeatedElementMolecule);
    const spheres = sphereMeshes(group);
    const cylinders = cylinderMeshes(group);

    const carbonGeometryDispose = jest.spyOn(spheres[0].geometry, 'dispose');
    const carbonMaterialDispose = jest.spyOn(spheres[0].material as THREE.Material, 'dispose');
    const bondGeometryDispose = jest.spyOn(cylinders[0].geometry, 'dispose');
    const bondMaterialDispose = jest.spyOn(cylinders[0].material as THREE.Material, 'dispose');

    disposeMoleculeGroup(group);

    expect(carbonGeometryDispose).toHaveBeenCalledTimes(1);
    expect(carbonMaterialDispose).toHaveBeenCalledTimes(1);
    expect(bondGeometryDispose).toHaveBeenCalledTimes(1);
    expect(bondMaterialDispose).toHaveBeenCalledTimes(1);
  });
});
