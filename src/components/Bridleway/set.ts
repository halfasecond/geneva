export const paths = [
  { left: 0, top: 160, width: 500, height: 80, backgroundColor: "#EEE" },
  { left: 400, top: 160, width: 100, height: 600, backgroundColor: "#EEE" },
  { left: 400, top: 680, width: 600, height: 80, backgroundColor: "#EEE" },
  { left: 900, top: 390, width: 100, height: 370, backgroundColor: "#EEE" },
  { left: 900, top: 390, width: 600, height: 80, backgroundColor: "#EEE" },
  { left: 1380, top: 390, width: 600, height: 80, backgroundColor: "#EEE" },
  { left: 1900, top: 390, width: 100, height: 920, backgroundColor: "#EEE" },
  { left: 900, top: 1230, width: 1100, height: 80, backgroundColor: "#EEE" },
  { left: 900, top: 1000, width: 100, height: 300, backgroundColor: "#EEE" },
  { left: 200, top: 1000, width: 800, height: 80, backgroundColor: "#EEE" },
  { left: 200, top: 1000, width: 100, height: 860, backgroundColor: "#EEE" },
  { left: 200, top: 1780, width: 500, height: 80, backgroundColor: "#EEE" }
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
