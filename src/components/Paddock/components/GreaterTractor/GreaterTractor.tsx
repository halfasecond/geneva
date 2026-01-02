import React, { useEffect, useRef } from 'react';
import * as Styled from './GreaterTractor.style';

interface GreaterTractorDimensions {
  width: number;
  height: number;
  left: number;
  top: number;
}

interface GreaterTractorProps {
  left: number;
  top: number;
  player?: any;
  gameData?: any;
  block?: any;
  onElementDimensions?: (dimensions: Record<string, GreaterTractorDimensions>) => void;
  onVote?: (direction: 'left' | 'right') => void;
}

const GreaterTractor: React.FC<GreaterTractorProps> = ({
  left,
  top,
  player,
  gameData,
  block,
  onElementDimensions,
  onVote
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftTractorRef = useRef<HTMLDivElement>(null);
  const rightTractorRef = useRef<HTMLDivElement>(null);
  const measurementDone = useRef(false);

  // Measure elements after they're rendered
  useEffect(() => {
    if (
      containerRef.current && 
      leftTractorRef.current && 
      rightTractorRef.current && 
      !measurementDone.current
    ) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const leftTractorRect = leftTractorRef.current.getBoundingClientRect();
      const rightTractorRect = rightTractorRef.current.getBoundingClientRect();

      const dimensions: Record<string, GreaterTractorDimensions> = {
        container: {
          width: containerRect.width,
          height: containerRect.height,
          left: left,
          top: top
        },
        leftTractor: {
          width: leftTractorRect.width,
          height: leftTractorRect.height,
          left: left + (leftTractorRect.left - containerRect.left),
          top: top + (leftTractorRect.top - containerRect.top)
        },
        rightTractor: {
          width: rightTractorRect.width,
          height: rightTractorRect.height,
          left: left + (rightTractorRect.left - containerRect.left),
          top: top + (rightTractorRect.top - containerRect.top)
        }
      };

      onElementDimensions?.(dimensions);
      measurementDone.current = true;
    }
  }, [left, top, onElementDimensions]);

  // Get player's current vote
  const playerVote = player?.game?.greaterTractor?.vote;
  
  // Calculate time until next reset
  const blocksUntilReset = gameData?.nextReset ? gameData.nextReset - (block?.blocknumber || 0) : 0;

  const handleVote = (direction: 'left' | 'right') => {
    if (onVote) {
      onVote(direction);
    }
  };

  return (
    <Styled.Container ref={containerRef} style={{ left, top }}>
      <Styled.Header>
        <h2>The Greater Tractor</h2>
        <p>Vote for the greater tractor! Winners get <b>5 $HAY</b>.</p>
        {blocksUntilReset > 0 && (
          <p>Next reset in {blocksUntilReset} blocks</p>
        )}
      </Styled.Header>
      
      <Styled.TractorsContainer>
        <Styled.TractorWrapper 
          ref={leftTractorRef}
          onClick={() => handleVote('left')}
          selected={playerVote === 'left'}
        >
          <Styled.Tractor direction="right">🚜</Styled.Tractor>
          <p>Vote Left</p>
        </Styled.TractorWrapper>
        
        <Styled.TractorWrapper 
          ref={rightTractorRef}
          onClick={() => handleVote('right')}
          selected={playerVote === 'right'}
        >
          <Styled.Tractor direction="left">🚜</Styled.Tractor>
          <p>Vote Right</p>
        </Styled.TractorWrapper>
      </Styled.TractorsContainer>
      
      {playerVote && (
        <Styled.VoteStatus>
          You voted for the {playerVote} tractor
        </Styled.VoteStatus>
      )}
    </Styled.Container>
  );
};

export default GreaterTractor;