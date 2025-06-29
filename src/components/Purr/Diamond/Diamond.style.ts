import styled, { keyframes } from 'styled-components'

const spritesheet = 'https://cryptokitties.co/images/cattributes/mewtation-gems/diamond-lg-sprite.svg'

export const Div = styled.div`
    background-image: url(${spritesheet});
    background-size: 900% 100%;
    background-position: center;
    animation: ${keyframes`
        0% { background-position: 0 0; }
        11.11% { background-position: 100% 0; }
        22.22% { background-position: 200% 0; }
        33.33% { background-position: 300% 0; }
        44.44% { background-position: 400% 0; }
        55.55% { background-position: 500% 0; }
        66.66% { background-position: 600% 0; }
        77.77% { background-position: 700% 0; }
        88.88% { background-position: 800% 0; }
        100% { background-position: 900% 0; }
    `} 3s steps(8) infinite;
`