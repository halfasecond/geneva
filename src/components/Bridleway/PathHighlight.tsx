import React from "react";
import { PathContainer, PathSegment as StyledPathSegment } from "./PathHighlight.style";
import { paths } from "./set";

export interface PathHighlightProps {
  active?: boolean;
}

export const PathHighlight: React.FC<PathHighlightProps> = ({ active = true }) => {
  if (!active) return null;

  // Add safeZone to each path segment
  const pathsWithSafeZones = paths.map((path) => ({
    ...path,
    safeZone: {
      left: path.left + 90,
      right: path.left + path.width - 90,
      top: path.top + 80,
      bottom: path.top + path.height - 90
    }
  }));
  
  return (
    <PathContainer data-testid="bridleway-path">
      {pathsWithSafeZones.map((path, index) => (
        <StyledPathSegment
          key={index}
          width={path.width}
          height={path.height}
          style={{
            left: path.left,
            top: path.top,
            backgroundColor: path.backgroundColor
          }}
        />
      ))}
    </PathContainer>
  );
};
