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
  playerState?: any; // Add playerState prop
  onElementDimensions?: (dimensions: Record<string, GreaterTractorDimensions>) => void;
  onVote?: (direction: 'left' | 'right') => void;
}

const GreaterTractor: React.FC<GreaterTractorProps> = ({
  left,
  top,
  player,
  gameData,
  block,
  playerState,
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

  // Get player's current vote and loading state from playerState
  const playerVote = playerState?.vote;
  const hasVoted = playerState?.hasVoted || false;
  const isLoading = playerState?.loading || false;
  
  // Calculate time until next reset
  const blocksUntilReset = gameData?.nextReset ? gameData.nextReset - (block?.blocknumber || 0) : 0;

  const handleVote = (direction: 'left' | 'right') => {
    // Only allow voting if the player hasn't voted yet and no vote is in progress
    if (onVote && !hasVoted && !isLoading) {
      onVote(direction);
    }
  };

  return (
    <Styled.Container ref={containerRef} style={{ left, top }}>
      <Styled.Header>
        <h2>The Greater Tractor</h2>
        <p>What is the greater tractor? Winners get 5 <b>$HAY</b>.</p>
        {blocksUntilReset > 0 && (
          <p>Next reset in {blocksUntilReset} blocks</p>
        )}
      </Styled.Header>
      
      <Styled.TractorsContainer>
        <Styled.TractorWrapper
          ref={leftTractorRef}
          onClick={() => handleVote('left')}
          selected={playerVote === 'left'}
          disabled={hasVoted || isLoading}
        >
          <Styled.Tractor direction="right">🚜</Styled.Tractor>
          <p>The tractor on the left</p>
          {playerVote === 'left' && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px' }}>✓</span>}
          {isLoading && !playerVote && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px' }}>⏳</span>}
        </Styled.TractorWrapper>
        
        <Styled.TractorWrapper
          ref={rightTractorRef}
          onClick={() => handleVote('right')}
          selected={playerVote === 'right'}
          disabled={hasVoted || isLoading}
        >
          <Styled.Tractor direction="left">🚜</Styled.Tractor>
          <p>The tractor on the right</p>
          {playerVote === 'right' && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px' }}>✓</span>}
          {isLoading && !playerVote && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px' }}>⏳</span>}
        </Styled.TractorWrapper>
      </Styled.TractorsContainer>
      
      {isLoading && !hasVoted && (
        <Styled.VoteStatus>
          Submitting your vote...
        </Styled.VoteStatus>
      )}
      
      {hasVoted && playerVote && (
        <Styled.VoteStatus>
          You voted for the {playerVote} tractor
        </Styled.VoteStatus>
      )}
    </Styled.Container>
  );
};

export default GreaterTractor;