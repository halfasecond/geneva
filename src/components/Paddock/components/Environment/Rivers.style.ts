import styled from 'styled-components';
import { Z_LAYERS } from '../../../../config/zIndex';

export const RiverContainer = styled.div`
  position: absolute;
  z-index: ${Z_LAYERS.WATER};
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

interface RiverSegmentProps {
  width: number;
  height: number;
}

export const RiverSegment = styled.div<RiverSegmentProps>`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  transition: opacity 0.5s;
`;