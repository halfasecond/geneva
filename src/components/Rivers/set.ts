import { PathSegment } from '../Bridleway/set';

export const rivers: PathSegment[] = [
  { left: 540, top: 2740, width: 1000, height: 80, backgroundColor: "#37d7ff" },
  { left: 1540, top: 2320, width: 100, height: 500, backgroundColor: "#37d7ff" },
  { left: 1620, top: 2320, width: 1500, height: 80, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1900, width: 100, height: 500, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1900, width: 400, height: 80, backgroundColor: "#37d7ff" },
  { left: 3520, top: 1580, width: 100, height: 400, backgroundColor: "#37d7ff" },
  { left: 3520, top: 1580, width: 1800, height: 80, backgroundColor: "#37d7ff" }
];

// Reuse the same interface as Bridleway paths for consistency
export interface RiverSegment extends PathSegment {
  safeZone?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}
