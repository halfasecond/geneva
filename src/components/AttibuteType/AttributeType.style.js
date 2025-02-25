import styled from 'styled-components'
import ghost from 'svg/horse/Ghost.svg'
import { bgColors } from 'style/config'

export const Li = styled.li`
    background-color: #dadee9;
    padding: 20px 20px 12px 20px;
    border-radius: 6px;
    margin-right: 20px;
    align-self: flex-end;
    > h4 {
        font-size: 14px;
        margin-bottom: 20px;
    }
    > ul {
        padding-left: 0;
        display: flex;
        flex-wrap: no-wrap;
        flex-direction: column;
        margin-bottom: 24px;
        > li {
            font-size: 12px;
            margin: 4px 0;
            color: #000;
        }
    }
    > div {
        background-color: ${({ canscan, ismatch }) => canscan === 'true' || ismatch === 'true' ? ismatch === 'true' ? '#49aa43' : bgColors['starlight'] : 'transparent' };
        padding-top: 15px;
        > div {
            background-image:  ${({ ismatch }) => ismatch === 'true' ? `url(${ghost})` : 'none'};
            animation:  ${({ ismatch }) => ismatch === 'true' ? 'flashImage .25s infinite' : 'none'};
            animation-iteration-count: 4;
            background-size: 350% auto;
            background-position: 105% 210%;
            width: 120px;
            height: 120px;
            margin-left: 15px;
            background-color: #FFF;
        }
    }

    @keyframes flashImage {
        0%, 100% {
          background-image: url(${ghost});
        }
        50% {
          background-image: none;
        }
      }
`