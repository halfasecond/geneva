import { useEffect, useRef, useState } from "react";
import * as Styled from './AttributeType.style'

const AttibuteType = ({ attributes, traitType, player, offset, socket, gameData }) => {
  const [canscan, setCanscan] = useState(false);
  const scanningAreaRef = useRef(null);

  useEffect(() => {
    if (player && scanningAreaRef.current) {
      const saRect = scanningAreaRef.current.getBoundingClientRect();
      const parentRect = scanningAreaRef.current.parentElement.parentElement.getBoundingClientRect();

      // Calculate player's position relative to the parent element
      const adjustedPlayerLeft = player.left - (offset.left - parentRect.left);
      const adjustedPlayerTop = player.top - (offset.top - parentRect.top);
      // Check if adjusted player is within the scanning area
      const isPlayerWithinScanningArea =
        adjustedPlayerLeft >= saRect.left &&
        adjustedPlayerLeft + player.size <= saRect.left + saRect.width &&
        adjustedPlayerTop >= saRect.top - 30 &&
        adjustedPlayerTop + player.size <= saRect.top + saRect.height + 30;
      if (isPlayerWithinScanningArea !== canscan) {
        setCanscan(isPlayerWithinScanningArea);
      }
      
    }
  }, [player.left, player.top, offset]);

  useEffect(() => {
    if (canscan && !gameData.discounters.includes(player.owner) && !gameData.foundBy) {
      socket.emit('scanHorse', { scanType: traitType, scanResult: player.horse[traitType], account: player.owner })
    }
  },[canscan])

  return (
    <Styled.Li canscan={canscan ? 'true' : 'false'} ismatch={(gameData.answer === player.horse[traitType] && gameData.foundBy) ? 'true' : 'false'}>
      <h4>{traitType}</h4>
      <ul>
        {attributes
          .filter(({ name }) => name === traitType)
          .sort((a, b) => a.amount - b.amount)
          .map((trait, q) => {
            const textDecoration = 
              gameData.discounted.includes(trait.value) || (gameData.foundBy && gameData.answer !== trait.value) ? 'line-through' : gameData.answer === trait.value && gameData.foundBy ? 'underline' : 'none'
            return (
              <li key={`b${q}`} style={{ textDecoration }}>
                {trait.value} ({trait.amount}){' '}
                {`${parseFloat(trait.percentage).toFixed(2)}%`}
              </li>
            );
          })}
      </ul>
      <div
        ref={scanningAreaRef}
        style={{
          width: 150,
          height: 150,
          zIndex: 1,
        }}
      ><div /></div>
    </Styled.Li>
  );
};

export default AttibuteType;