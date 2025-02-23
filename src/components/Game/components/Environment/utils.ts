import { RiverSegment } from './set';

interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const doOverlap = (horse: BoundingBox, river: RiverSegment) => {
  // Add a small buffer around the river to make collision detection feel more natural
  // Use a large buffer to make collision area significantly smaller than visual river
  const buffer = 30;
  const riverBox = {
    left: river.left + buffer,
    right: river.left + river.width - buffer,
    top: river.top + buffer,
    bottom: river.top + river.height - buffer
  };
  
  return !(
    horse.left >= riverBox.right || 
    horse.right <= riverBox.left || 
    horse.top >= riverBox.bottom || 
    horse.bottom <= riverBox.top
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