import React from "react";
import { PathContainer, HorizontalPath, VerticalPath, PoolPath } from "./PathHighlight.style";

interface PathHighlightProps {
  active?: boolean;
}

export const PathHighlight: React.FC<PathHighlightProps> = ({ active = true }) => {
  if (!active) return null;
  
  return (
    <PathContainer data-testid="bridleway-path">
      <HorizontalPath />
      <VerticalPath />
      <PoolPath />
    </PathContainer>
  );
};
