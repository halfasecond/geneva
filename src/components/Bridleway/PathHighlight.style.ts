import styled from "styled-components";

const PATH_WIDTH = 90; // Width of all path segments

export const PathContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const HorizontalPath = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 2000px;
  height: ${PATH_WIDTH}px;
  background: #f0f0f0;
  opacity: 0.8;
`;

export const VerticalPath = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: ${PATH_WIDTH}px;
  height: 1200px;
  background: #f0f0f0;
  opacity: 0.8;
`;

export const PoolPath = styled.div`
  position: absolute;
  top: 20px;
  left: 1200px;
  width: 800px;
  height: 600px;
  background: #f0f0f0;
  opacity: 0.8;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
`;
