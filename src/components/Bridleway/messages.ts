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
        message: `<b>Welcome to The Meadowverse</b><br />🐎 🐎 🐎 🐎 🐎<br />Use your arrow keys:<br />&#x2B06; &#x27A1; &#x2B07; &#x2B05;<br />to move your horse`
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