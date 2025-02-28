import styled from 'styled-components';
import { Z_LAYERS } from 'src/config/zIndex';
import ghost from '/svg/horse/Ghost.svg';
import { bgColors } from 'style/config';

interface DoorProps {
    canscan: boolean;
    ismatch: boolean;
}

export const Container = styled.div`
    position: absolute;
    left: 4000px;
    top: 40px;
    width: 4000px;
    display: flex;
    z-index: ${Z_LAYERS['BACKGROUND']};
`;

export const Header = styled.div`
    color: #FFF;
    position: absolute;
    bottom: -170px;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 20px;
    border-radius: 5px;
    zIndex: ${Z_LAYERS['UI']};

    h2 {
        font-size: 24px;
        margin-bottom: 10px;

        span {
            margin-left: 10px;
            font-size: 16px;
        }
    }

    p {
        font-size: 16px;
        margin: 5px 0;
    }
`;

export const Buildings = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
`;

export const Building = styled.div`
    background-color: #dadee9;
    padding: 20px 20px 12px 20px;
    border-radius: 6px;
    margin-right: 20px;
    align-self: flex-end;
    min-width: 200px;

    h4 {
        font-size: 14px;
        margin-bottom: 20px;
        background-color: #EEE;
        display: inline-block;
        padding: 8px;
        font-weight: bold;
    }

    ul {
        padding-left: 0;
        display: flex;
        flex-wrap: no-wrap;
        flex-direction: column;
        margin-bottom: 24px;

        li {
            font-size: 12px;
            margin: 4px 0;
            color: #000;
            list-style: none;
        }
    }
`;

export const Door = styled.div<DoorProps>`
    background-color: ${({ canscan, ismatch }) => 
        canscan || ismatch ? 
        ismatch ? '#49aa43' : bgColors['starlight'] : 
        'transparent'
    };
    padding-top: 15px;
    width: 150px;

    > div {
        background-image: ${({ ismatch }) => 
            ismatch ? `url(${ghost})` : 'none'
        };
        animation: ${({ ismatch }) => 
            ismatch ? 'flashImage .25s infinite' : 'none'
        };
        animation-iteration-count: 4;
        background-size: 350% auto;
        background-position: 105% 210%;
        width: 120px;
        height: 120px;
        margin-left: 15px;
        background-color: #FFF;
    }

    @keyframes flashImage {
        0%, 100% {
            background-image: url(${ghost});
        }
        50% {
            background-image: none;
        }
    }
`;

export const Results = styled.div`
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 5px;
    color: white;
    margin-left: 80px;
    width: 600px;
    position: relative;

    h4 {
        margin: 15px 0 10px;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 36px 0 36px;

        li {
            margin: 5px 0;
            color: #ccc;
            font-size: 16px;

            b {
                color: #fff;
            }
        }
    }
`;

export const Ghost = styled.div`
    background-image: url(${ghost});
    background-size: 350% auto;
    background-position: 105% 210%;
    width: 40px;
    height: 40px;
    position: absolute;
    right: 12px;
`