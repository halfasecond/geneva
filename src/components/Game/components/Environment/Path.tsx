import React from "react";
import * as Styled from "./Path.style";
import { paths } from "./set";

export interface PathHighlightProps {
    active?: boolean;
}

export const PathHighlight: React.FC<PathHighlightProps> = ({ active = true }) => {
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
        <Styled.PathContainer data-testid="bridleway-path">
            {pathsWithSafeZones.map((path, index) => (
                <Styled.PathSegment
                    key={index}
                    style={{
                        left: path.left,
                        top: path.top,
                        width: path.width,
                        height: path.height,
                        backgroundColor: '#EEE'
                    }}
                />
            ))}
        </Styled.PathContainer>
    );
};

export default PathHighlight;