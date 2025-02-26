import styled from 'styled-components';
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
`;

export const Header = styled.div`
    padding-top: 40px;
    color: #000;
    position: absolute;

    h2 {
        font-size: 24px;
        margin-bottom: 10px;
        opacity: 0.4;

        span {
            margin-left: 10px;
            font-size: 16px;
        }
    }

    p {
        opacity: 0.4;
        font-size: 12px;
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
    border-radius: 8px;
    color: white;
    margin-left: 80px;

    h4 {
        margin: 15px 0 10px;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0 0 15px;

        li {
            margin: 5px 0;
            color: #ccc;

            b {
                color: #fff;
            }
        }
    }
`;