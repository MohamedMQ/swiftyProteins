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
 * One SphereGeometry/MeshStandardMaterial per distinct element (not per
 * atom) — a molecule with 137 carbon atoms shares a single sphere geometry
 * and material across all of them, cloning only the lightweight Mesh
 * (position/name) per atom. Bonds share a single unit-length cylinder
 * geometry across the whole molecule regardless of how many different
 * lengths they actually need, each stretched to its real length via
 * `mesh.scale.y` rather than baking a unique length into its own geometry.
 */
export function buildMoleculeGroup(molecule: Molecule): THREE.Group {
  const group = new THREE.Group();
  const atomPositionById = new Map<string, THREE.Vector3>();
  const sphereGeometryByElement = new Map<string, THREE.SphereGeometry>();
  const sphereMaterialByElement = new Map<string, THREE.MeshStandardMaterial>();

  function getSphereGeometry(element: string): THREE.SphereGeometry {
    const cached = sphereGeometryByElement.get(element);
    if (cached !== undefined) {
      return cached;
    }
    const radius = getCovalentRadius(element) * ATOM_SPHERE_SCALE;
    const geometry = new THREE.SphereGeometry(radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    sphereGeometryByElement.set(element, geometry);
    return geometry;
  }

  function getSphereMaterial(element: string): THREE.MeshStandardMaterial {
    const cached = sphereMaterialByElement.get(element);
    if (cached !== undefined) {
      return cached;
    }
    const material = new THREE.MeshStandardMaterial({
      color: getCpkColor(element),
      roughness: 0.4,
      metalness: 0.1,
    });
    sphereMaterialByElement.set(element, material);
    return material;
  }

  for (const atom of molecule.atoms) {
    const mesh = new THREE.Mesh(getSphereGeometry(atom.element), getSphereMaterial(atom.element));
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    mesh.name = atom.id;

    group.add(mesh);
    atomPositionById.set(atom.id, mesh.position.clone());
  }

  const bondGeometry = new THREE.CylinderGeometry(
    BOND_CYLINDER_RADIUS,
    BOND_CYLINDER_RADIUS,
    1,
    CYLINDER_SEGMENTS
  );
  const bondMaterial = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.6 });

  for (const bond of molecule.bonds) {
    const positionA = atomPositionById.get(bond.atomIdA);
    const positionB = atomPositionById.get(bond.atomIdB);
    if (positionA === undefined || positionB === undefined) {
      continue;
    }
    group.add(buildBondCylinder(positionA, positionB, bondGeometry, bondMaterial));
  }

  return group;
}

/** Cylinder geometry defaults to running along +Y; rotate it to align with the bond vector. */
function buildBondCylinder(
  a: THREE.Vector3,
  b: THREE.Vector3,
  geometry: THREE.CylinderGeometry,
  material: THREE.MeshStandardMaterial
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(1, length, 1);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  return mesh;
}

/**
 * Disposes every unique geometry/material in the group exactly once, safe
 * for the shared-by-reference setup above — naively disposing per-mesh
 * would dispose a shared sphere geometry after the first atom of that
 * element and break every other atom still referencing it.
 */
export function disposeMoleculeGroup(group: THREE.Group): void {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    if (!disposedGeometries.has(child.geometry)) {
      child.geometry.dispose();
      disposedGeometries.add(child.geometry);
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!disposedMaterials.has(material)) {
        material.dispose();
        disposedMaterials.add(material);
      }
    }
  });
}
