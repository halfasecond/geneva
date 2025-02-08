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
        triggerSegment: 1,
        message: `<b>Welcome to The Meadowverse</b><br />🐎 🐎 🐎 🐎 🐎<br />Use your arrow keys:<br />&#x2B06; &#x27A1; &#x2B07; &#x2B05;<br />to move your horse`
    },
    {
        left: 70,
        top: 470,
        width: 280,
        triggerSegment: 3,
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
        left: 1040,
        top: 960,
        width: 360,
        triggerSegment: 6,  // Adjusted for new segment numbering
        message: 'Every ChainedHorse in the Paddock is entitled to a <b>"Shitty Stable"</b>. Collecting <b>$HAY</b> allows you to upgrade your stable and make it less shitty. One way to earn <b>$HAY</b> is to hang out here at <b>Engagement Farm</b> where you can acquire <b>$HAY</b> just for being here.'
    },
    {
        left: 340,
        top: 1120,
        width: 510,
        triggerSegment: 8,  // Adjusted for new segment numbering
        message: 'Some horses are born to compete and enjoy putting their jockeying skills to the test at the various Race Tracks that can be found throughout the Paddock. <br /><br />Start a <b>Race</b> by going to your start position in the bottom stall'
    }
    // "Well done" message removed - will be handled by race completion logic
];