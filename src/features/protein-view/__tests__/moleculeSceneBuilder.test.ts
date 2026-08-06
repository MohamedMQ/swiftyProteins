import { readFileSync } from 'fs';
import { join } from 'path';
import * as THREE from 'three';

import { getCpkColor } from '../../../core/chemistry/elementColors';
import { getCovalentRadius } from '../../../core/chemistry/elementRadii';
import { parseMolecule, type Molecule } from '../../../core/parsing/molecule';
import { buildMoleculeGroup } from '../moleculeSceneBuilder';

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

  it('sizes the bond cylinder length to the real distance between the two atoms', () => {
    const cylinder = cylinders[0];
    const geometry = cylinder.geometry as THREE.CylinderGeometry;
    // 3-4-5 triangle: distance from (0,0,0) to (3,4,0) is exactly 5.
    expect(geometry.parameters.height).toBeCloseTo(5, 5);
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
