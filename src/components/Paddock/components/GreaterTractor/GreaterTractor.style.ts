import styled from 'styled-components';
import { Z_LAYERS } from 'src/config/zIndex';

export const Container = styled.div`
  position: absolute;
  width: 600px;
  background-color: #f5f5dc; /* Beige background */
  border: 2px solid #8b4513; /* Brown border */
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: ${Z_LAYERS.TERRAIN_FEATURES};
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
  
  h2 {
    font-size: 24px;
    margin-bottom: 10px;
  }
  
  p {
    font-size: 16px;
    margin: 5px 0;
    > b {
      font-weight: bold; 
    }
  }
`;

export const TractorsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
`;

export const TractorWrapper = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  background-color: ${props => props.selected ? 'rgba(139, 69, 19, 0.2)' : 'transparent'};
  border: ${props => props.selected ? '2px solid #8b4513' : '2px solid transparent'};
  
  &:hover {
    background-color: rgba(139, 69, 19, 0.1);
  }
  
  p {
    margin-top: 10px;
    font-weight: ${props => props.selected ? 'bold' : 'normal'};
  }
`;

export const Tractor = styled.div<{ direction: 'left' | 'right' }>`
  font-size: 200px;
  transform: scaleX(${props => props.direction === 'left' ? -1 : 1});
  line-height: 1;
`;

export const VoteStatus = styled.div`
  text-align: center;
  font-weight: bold;
  margin-top: 20px;
  padding: 10px;
  background-color: rgba(139, 69, 19, 0.1);
  border-radius: 5px;
`;