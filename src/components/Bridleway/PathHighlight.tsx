import React from "react";
import { Path } from "./PathHighlight.style";

interface PathHighlightProps {
  active?: boolean;
}

export const PathHighlight: React.FC<PathHighlightProps> = ({ active = true }) => {
  return <Path data-testid="bridleway-path" />;
};
