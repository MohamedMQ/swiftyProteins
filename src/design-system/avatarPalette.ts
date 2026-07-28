interface AvatarColor {
  background: string;
  foreground: string;
}

const AVATAR_PALETTE: AvatarColor[] = [
  { background: '#173F35', foreground: '#9FE1CB' },
  { background: '#1D3450', foreground: '#B5D4F4' },
  { background: '#3E2A18', foreground: '#FAC775' },
  { background: '#2E2352', foreground: '#CECBF6' },
];

/** Deterministic per-code color so a row's avatar stays stable across renders/scrolls. */
export function getAvatarColor(seed: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
