import React from 'react';
import { rivers } from './set';
import { RiverContainer, RiverSegment } from './Rivers.style';

interface RiversProps {
  active?: boolean;
}

export const Rivers: React.FC<RiversProps> = ({ active = true }) => {
  if (!active) return null;

  return (
    <RiverContainer data-testid="rivers">
      {rivers.map((river, index) => (
        <RiverSegment
          key={index}
          width={river.width}
          height={river.height}
          style={{
            left: river.left,
            top: river.top,
            backgroundColor: river.backgroundColor
          }}
        />
      ))}
    </RiverContainer>
  );
};
