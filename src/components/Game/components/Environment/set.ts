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
  { left: 200, top: 2070, width: 500, height: 80, backgroundColor: "#EEE" },
  // Bridges
  { left: 740, top: 2810, width: 100, height: 100, backgroundColor: "#EEE" },
  { left: 2420, top: 2380, width: 100, height: 120, backgroundColor: "#EEE" },
  { left: 3500, top: 1800, width: 140, height: 100, backgroundColor: "#EEE" },
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
  // Before bridge
  { left: 540, top: 2820, width: 200, height: 80, backgroundColor: "#37d7ff" },
  // After bridge
  { left: 840, top: 2820, width: 700, height: 80, backgroundColor: "#37d7ff" },
  { left: 1540, top: 2400, width: 100, height: 500, backgroundColor: "#37d7ff" },
  // Before bridge
  { left: 1620, top: 2400, width: 800, height: 80, backgroundColor: "#37d7ff" },
  // After bridge
  { left: 2520, top: 2400, width: 600, height: 80, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1980, width: 100, height: 500, backgroundColor: "#37d7ff" },
  { left: 3120, top: 1980, width: 400, height: 80, backgroundColor: "#37d7ff" },
  // Before bridge
  { left: 3520, top: 1660, width: 100, height: 140, backgroundColor: "#37d7ff" },
  // After bridge
  { left: 3520, top: 1900, width: 100, height: 160, backgroundColor: "#37d7ff" },
  { left: 3520, top: 1660, width: 1800, height: 80, backgroundColor: "#37d7ff" }
];

export interface IntroMessage {
  left: number;
  top: number;
  width: number;
  message: string;
  triggerSegment: number;  // The path segment that triggers this message
}

export const introMessages: IntroMessage[] = [
  {
      left: 60,
      top: 280,
      width: 300,
      triggerSegment: 0,  // First path segment - show immediately
      message: `<b>Welcome to The Paddock</b><br />🐎 🐎 🐎 🐎 🐎<br />Use your arrow keys:<br /><span style="font-size: 32px">↑ → ↓ ←</span><br />to move your horse`
  },
  {
      left: 70,
      top: 470,
      width: 280,
      triggerSegment: 1,  // Show when leaving first path
      message: 'please stay on the path<br />while we show you around'
  },
  {
      // Adjusted for combined segment 5
      left: 1040,
      top: 260,
      width: 800,
      triggerSegment: 4,  // Now segment 4 after combining 5&6
      message: 'So what can you do in the Paddock? The choice is yours: you could chat to other Chained Horse owners at <b>Engagement Farm</b>, enjoy some solitude at <b>RainbowPuke Falls</b> or maybe participate in some daily challenges to earn some useful <b>$HAY</b>'
  },
  {
      left: 1670,  // Fine-tuned position for readability
      top: 1280,
      width: 900,  // Tripled width for better text layout
      triggerSegment: 6,  // Intersection segment
      message: 'We are a team of agentic A.I. horses who gallop through sprints and stand-ups to make the paddock more beautiful every day. Our agile methodology keeps us nimble, focused, and always moving forward.'
  },
  {
      left: 340,
      top: 1120,
      width: 510,
      triggerSegment: 9,  // Adjusted for new intersection segment
      message: 'Some horses are born to compete and enjoy putting their jockeying skills to the test at the various Race Tracks that can be found throughout the Paddock. <br /><br />Start a <b>Race</b> by going to your start position in the bottom stall'
  },
  {
      left: 2500,  // Fine-tuned position
      top: 1770,   // Fine-tuned position
      width: 500,  // Wider for better text layout
      triggerSegment: -2,  // Special value for race completion
      message: '<b>Well Done!</b><br />You took part in a race.<br /><br />You are now free to roam around the Paddock. From now on the path you take is up to you.'
  }
];

export const issuesColumns = [
  { left: 1682, top: 510, width: 236, height: 720, backgroundColor: "rgb(139, 69, 19)" },  // Column 1
  { left: 1942, top: 510, width: 236, height: 720, backgroundColor: "rgb(139, 69, 19)" },  // Column 2 (left + width + gap)
  { left: 2202, top: 510, width: 236, height: 720, backgroundColor: "rgb(139, 69, 19)" },  // Column 3 (prev + width + gap)
  { left: 2462, top: 510, width: 236, height: 720, backgroundColor: "rgb(139, 69, 19)" }   // Column 4 (prev + width + gap)
];

export const raceElements = [
  { left: 700, top: 1739, width: 1300, height: 40, backgroundColor: "#888" },  // Top fence
  { left: 700, top: 2150, width: 1300, height: 40, backgroundColor: "#888" },  // Bottom fence
  { left: 700, top: 1770, width: 10, height: 420, backgroundColor: "#888" },   // Start line
  { left: 1990, top: 1770, width: 10, height: 420, backgroundColor: "#888" },  // Finish line
  { left: 580, top: 1790, width: 120, height: 80, backgroundColor: "#CCC" },   // Stall 1
  { left: 580, top: 1920, width: 120, height: 80, backgroundColor: "#CCC" },   // Stall 2
  { left: 580, top: 2060, width: 120, height: 80, backgroundColor: "#CCC" }    // Start box
];

export const pond = {
  left: 1040,
  top: 510,
  width: 500,
  height: 340,
  backgroundColor: "#37d7ff"
};