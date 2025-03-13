export const Z_LAYERS = {
  BACKGROUND: 0,
  TERRAIN_BASE: 100,    // Basic terrain elements
  SAND: 200,           // Beach sand
  TERRAIN_FEATURES: 300, // Flowers, paths
  CHARACTERS: 500,     // Horse should be here - above sand but below water
  WATER: 1000,         // Sea/water features
  EFFECTS: 1500,       // Visual effects
  UI: 2000            // UI elements
} as const;