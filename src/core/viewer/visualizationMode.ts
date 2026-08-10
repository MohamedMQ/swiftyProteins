export const VISUALIZATION_MODES = ['ballAndStick', 'spaceFilling', 'wireframe', 'stick'] as const;
export type VisualizationMode = (typeof VISUALIZATION_MODES)[number];
