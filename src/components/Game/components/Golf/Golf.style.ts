import styled, { keyframes } from 'styled-components';
import { bgColors } from 'src/style/config';

const dimensionalRift = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 0, 255, 0.5); }
  50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
  100% { box-shadow: 0 0 10px rgba(255, 0, 255, 0.5); }
`;

const dimensionalPulse = keyframes`
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.7; transform: scale(1); }
`;

export const Div = styled.div`
    position: absolute;
    width: 2000px;
    height: 1100px;
    border: 10px dotted #000;
    background: rgba(0, 0, 0, 0.3);
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, rgba(100, 0, 100, 0.2), transparent 70%);
        pointer-events: none;
    }
    
    > h2 {
        color: #fff;
        font-size: 48px;
        text-align: center;
        margin-top: 20px;
        text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
    }
`;

export const ControlPanel = styled.div`
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    border: 2px solid rgba(255, 0, 255, 0.5);
    z-index: 10;
`;

export const GolfButton = styled.button<{ active?: boolean }>`
    background: ${props => props.active ? 'rgba(255, 0, 255, 0.5)' : 'rgba(0, 0, 0, 0.7)'};
    color: #fff;
    border: 1px solid rgba(255, 0, 255, 0.5);
    padding: 8px 16px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(255, 0, 255, 0.3);
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    }
`;

export const DimensionIndicator = styled.div<{ dimension: string }>`
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: ${props => {
        switch(props.dimension) {
            case 'quantum': return '#00ffff';
            case 'mirror': return '#ff00ff';
            case 'hyperbolic': return '#ffff00';
            case 'fractal': return '#00ff00';
            default: return '#ffffff';
        }
    }};
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 255, 0.5);
    font-size: 16px;
    animation: ${dimensionalPulse} 2s infinite ease-in-out;
`;

export const Rift = styled.div<{ size: number, color: string }>`
    position: absolute;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: 50%;
    background: radial-gradient(circle at center, ${props => props.color}, transparent 70%);
    animation: ${dimensionalRift} 2s infinite ease-in-out;
    pointer-events: none;
    z-index: 5;
`;

export const ChainFace = styled.div<{ size: number, color: string, state: string }>`
    position: absolute;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    font-size: ${props => props.size * 0.7}px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color};
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
    transition: all 0.1s linear;
    z-index: 2;
    
    ${props => props.state === 'quantum' && `
        opacity: 0.7;
        text-shadow: 0 0 10px #00ffff;
    `}
    
    ${props => props.state === 'timeshifted' && `
        opacity: 0.5;
        filter: blur(1px);
    `}
    
    ${props => props.state === 'folded' && `
        transform: scale(0.8);
        opacity: 0.9;
        text-shadow: 0 0 10px #ff00ff;
    `}
`;