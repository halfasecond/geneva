export const paths = [
  { left: 0, top: 160, width: 500, height: 80, backgroundColor: "#EEE" },
  { left: 400, top: 160, width: 100, height: 600, backgroundColor: "#EEE" },
  { left: 400, top: 680, width: 600, height: 80, backgroundColor: "#EEE" },
  { left: 900, top: 390, width: 100, height: 370, backgroundColor: "#EEE" },
  // Combined and extended segments 5 & 6
  { left: 900, top: 390, width: 1920, height: 80, backgroundColor: "#EEE" },
  // Vertical segment
  { left: 2720, top: 400, width: 100, height: 1200, backgroundColor: "#EEE" },
  // Intersection segment at vertical and horizontal crossing
  { left: 2720, top: 1520, width: 100, height: 80, backgroundColor: "#EEE" },
  // All segments from 7 onwards moved down 20px total
  { left: 900, top: 1520, width: 1920, height: 80, backgroundColor: "#EEE" },
  { left: 900, top: 1290, width: 100, height: 300, backgroundColor: "#EEE" },
  { left: 200, top: 1290, width: 800, height: 80, backgroundColor: "#EEE" },
  { left: 200, top: 1290, width: 100, height: 860, backgroundColor: "#EEE" },
  { left: 200, top: 2070, width: 500, height: 80, backgroundColor: "#EEE" }
];

export interface PathSegment {
  left: number;
  top: number;
  width: number;
  height: number;
  backgroundColor: string;
  safeZone?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

// Reuse the same interface for rivers
export interface RiverSegment extends PathSegment {
  safeZone?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export const rivers: RiverSegment[] = [
  { left: 540, top: 2820, width: 1000, height: 80, backgroundColor: "#37d7ff" },
  { left: 1540, top: 2400, width: 100, height: 500, backgroundColor: "#37d7ff" },
  { left: 1620, top: 2400, width: 1500, height: 80, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1980, width: 100, height: 500, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1980, width: 400, height: 80, backgroundColor: "#37d7ff" },
  { left: 3520, top: 1660, width: 100, height: 400, backgroundColor: "#37d7ff" },
  { left: 3520, top: 1660, width: 1800, height: 80, backgroundColor: "#37d7ff" }
];