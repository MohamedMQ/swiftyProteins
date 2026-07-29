import { AVATAR_PALETTE } from './avatarPalette';
import { createSeededRandom, hashString } from './seededRandom';

export interface MoleculeGlyphNode {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface MoleculeGlyphBond {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MoleculeGlyph {
  size: number;
  bonds: MoleculeGlyphBond[];
  hub: MoleculeGlyphNode;
  satellites: MoleculeGlyphNode[];
}

const SIZE = 36;
const CENTER = SIZE / 2;
export const MOLECULE_GLYPH_HUB_COLOR = '#35C7A0';
export const MOLECULE_GLYPH_BOND_COLOR = '#39414D';

/**
 * A tiny procedural ball-and-stick glyph per ligand code — deterministic
 * (same code always renders the same shape) but varied in node count,
 * angle, size, and color, so a scrolling list of 1000+ rows doesn't read as
 * one icon copy-pasted over and over. Echoes the same visual language as
 * the app icon and splash screen instead of a generic initials chip.
 */
export function getMoleculeGlyph(seed: string): MoleculeGlyph {
  const random = createSeededRandom(hashString(seed));
  const nodeCount = random() < 0.5 ? 2 : 3;
  const baseAngle = random() * Math.PI * 2;

  const hub: MoleculeGlyphNode = {
    x: CENTER,
    y: CENTER,
    radius: 5,
    color: MOLECULE_GLYPH_HUB_COLOR,
  };

  const satellites: MoleculeGlyphNode[] = [];
  const bonds: MoleculeGlyphBond[] = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const angle = baseAngle + (i * (Math.PI * 2)) / nodeCount + (random() - 0.5) * 0.7;
    const distance = 10 + random() * 4;
    const radius = 3 + random() * 2;
    const color = AVATAR_PALETTE[Math.floor(random() * AVATAR_PALETTE.length)].foreground;
    const x = CENTER + Math.cos(angle) * distance;
    const y = CENTER + Math.sin(angle) * distance;

    satellites.push({ x, y, radius, color });
    bonds.push({ x1: hub.x, y1: hub.y, x2: x, y2: y });
  }

  return { size: SIZE, hub, satellites, bonds };
}
