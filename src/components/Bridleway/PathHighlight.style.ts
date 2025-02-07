import styled from "styled-components";

export const PathSegment = styled.div<{ width: number; height: number }>`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  z-index: 1;
`;

export const PathContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;
