import { RiverSegment } from './set';

interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const doOverlap = (horse: BoundingBox, river: RiverSegment) => {
  // Add a small buffer around the river to make collision detection feel more natural
  const buffer = 5;
  return !(
    horse.left >= river.left + river.width + buffer || 
    horse.top >= river.top + river.height + buffer || 
    horse.right <= river.left - buffer || 
    horse.bottom <= river.top - buffer
  );
};

// Check if horse overlaps with any river segment
export const isInRiver = (horse: BoundingBox, rivers: RiverSegment[]) => 
  rivers.some(river => doOverlap(horse, river));

// Add safe zone to river segments (used for minimap visualization)
export const getSafeZone = (river: RiverSegment) => ({
  left: river.left,
  right: river.left + river.width,
  top: river.top,
  bottom: river.top + river.height
});
