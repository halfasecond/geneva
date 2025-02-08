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

export const raceElements = [
  { left: 700, top: 1739, width: 1300, height: 40, backgroundColor: "#888" },  // Top fence
  { left: 700, top: 2150, width: 1300, height: 40, backgroundColor: "#888" },  // Bottom fence
  { left: 700, top: 1770, width: 10, height: 420, backgroundColor: "#888" },   // Start line
  { left: 1990, top: 1770, width: 10, height: 420, backgroundColor: "#888" },  // Finish line
  { left: 580, top: 1790, width: 120, height: 80, backgroundColor: "#CCC" },   // Stall 1
  { left: 580, top: 1920, width: 120, height: 80, backgroundColor: "#CCC" },   // Stall 2
  { left: 580, top: 2060, width: 120, height: 80, backgroundColor: "#CCC" }    // Start box
];
