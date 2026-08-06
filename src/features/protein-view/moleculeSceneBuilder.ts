import * as THREE from 'three';

import { getCpkColor } from '../../core/chemistry/elementColors';
import { getCovalentRadius } from '../../core/chemistry/elementRadii';
import type { Molecule } from '../../core/parsing/molecule';

// Ball-and-stick uses covalent radii scaled down (not full van der Waals,
// which is reserved for the space-filling bonus mode) — a common
// convention that keeps the sticks visible instead of buried in the balls.
const ATOM_SPHERE_SCALE = 0.35;
const BOND_CYLINDER_RADIUS = 0.08;
const SPHERE_SEGMENTS = 16;
const CYLINDER_SEGMENTS = 12;
const BOND_COLOR = 0xd8dce2;

/**
 * One THREE.Mesh per atom/bond for now — a straightforward, correct
 * translation of a Molecule into a scene graph. Geometry/material reuse
 * across atoms of the same element (avoiding one allocation per atom) is a
 * deliberately separate, later optimization pass.
 */
export function buildMoleculeGroup(molecule: Molecule): THREE.Group {
  const group = new THREE.Group();
  const atomPositionById = new Map<string, THREE.Vector3>();

  for (const atom of molecule.atoms) {
    const radius = getCovalentRadius(atom.element) * ATOM_SPHERE_SCALE;
    const geometry = new THREE.SphereGeometry(radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    const material = new THREE.MeshStandardMaterial({
      color: getCpkColor(atom.element),
      roughness: 0.4,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    mesh.name = atom.id;

    group.add(mesh);
    atomPositionById.set(atom.id, mesh.position.clone());
  }

  for (const bond of molecule.bonds) {
    const positionA = atomPositionById.get(bond.atomIdA);
    const positionB = atomPositionById.get(bond.atomIdB);
    if (positionA === undefined || positionB === undefined) {
      continue;
    }
    group.add(buildBondCylinder(positionA, positionB));
  }

  return group;
}

/** Cylinder geometry defaults to running along +Y; rotate it to align with the bond vector. */
function buildBondCylinder(a: THREE.Vector3, b: THREE.Vector3): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

  const geometry = new THREE.CylinderGeometry(
    BOND_CYLINDER_RADIUS,
    BOND_CYLINDER_RADIUS,
    length,
    CYLINDER_SEGMENTS
  );
  const material = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.6 });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  return mesh;
}
