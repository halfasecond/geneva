import styled from "styled-components";
import { Z_LAYERS } from "../../../../config/zIndex";

export const PathSegment = styled.div`
  position: absolute;
  z-index: ${Z_LAYERS.TERRAIN_BASE};
`;

export const PathContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;