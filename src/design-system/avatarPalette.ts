import { hashString } from './seededRandom';

interface AvatarColor {
  background: string;
  foreground: string;
}

export const AVATAR_PALETTE: AvatarColor[] = [
  { background: '#173F35', foreground: '#9FE1CB' },
  { background: '#1D3450', foreground: '#B5D4F4' },
  { background: '#3E2A18', foreground: '#FAC775' },
  { background: '#2E2352', foreground: '#CECBF6' },
];

export function getAvatarColor(seed: string): AvatarColor {
  return AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];
}
