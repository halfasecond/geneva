import AttibuteType from 'components/AttibuteType';
import * as Styled from './Traits.style';
import { useEffect, useState } from 'react';
import hay from 'svg/hay.svg'

const Traits = ({ attributes, left, top, width = 4000, player, socket }) => {
  const [gameData, setGameData] = useState(undefined)
  const [time, setTime] = useState(undefined)
  useEffect(() => {
    // Add the event listener when the component mounts
    const handleGameData = (_gameData) => {
      setGameData(_gameData)
    };
    socket.on('gameData', handleGameData);
    if (!gameData) {
      socket.emit('gameData', handleGameData)
    }
    // Remove the event listener when the component unmounts
    return () => {
      socket.off('gameData', handleGameData);
    };
  }, [socket]);

  useEffect(() => {
    // Define a function to handle the 'ethHeader' event
    const handleEthHeaderEvent = (data) => setTime(Number(data))
    if (!time) {
      socket.emit('ethHeader', handleEthHeaderEvent)
    }
    socket.on('ethHeader', handleEthHeaderEvent)
    return () => {
      socket.off('ethHeader', handleEthHeaderEvent)
    };
  }, [socket])

  return gameData && gameData.gameStart ? (
    <Styled.Ul style={{ left, top, width }}>
      <h2 style={{ position: 'absolute', top: 0, opacity: 0.4 }}>
        {'Scare City'}<span>{'Check if you\'re rare but don\'t get a scare!'}</span>
      </h2>
      <p style={{ position: 'absolute', top: 30, opacity: 0.4, fontSize: '12px' }}>
        {"Stand in the doorway of all the skyscrapers but don't get spooked by a spooky ghost of death!"}
      </p>
      <p style={{ position: 'absolute', top: 60, opacity: 0.4, fontSize: '12px' }}>
        {`Game finishes in ${time && gameData.gameStart + gameData.gameLength - time} blocks`}
      </p>
      {[...new Set(attributes.map(({ name }) => name))].map((traitType, i) => (
        <AttibuteType
          key={i}
          {...{
            attributes,
            player,
            traitType,
            offset: { left, top },
            gameData: gameData[traitType],
            socket,
          }} />
      ))}
      <Styled.Li>
          <h4>{'Results'}</h4>
          {gameData && gameData.gameStart && (
            <ul>
              <li>Spooked: {[...new Set(attributes.map(({ name }) => name))].filter((traitType, i) => gameData[traitType].foundBy).length} - {parseFloat((100 / 11) * [...new Set(attributes.map(({ name }) => name))].filter((traitType, i) => gameData[traitType].foundBy).length).toFixed(2)}%</li>
              <li>Not scared: {gameData.ghosts.length}</li>
            </ul>
          )}
          <h4>{'How the scores work'}</h4>
          <ul>
            <li>Fully Spooked: 5 x <b>{' $HAY'}</b></li>
            <li>Not scared: amount x <b>{' $HAY'}</b></li>
            <li>All rewards have a "not scared" + 1<br />horse multiplier</li>
            <li><b>{'$HAY'}</b> is paid out according to<br />trait rarity of the participating horse</li>
          </ul>
          <h4>{`Game ends: ${time && gameData.gameStart + gameData.gameLength - time} blocks`}</h4>
      </Styled.Li>
    </Styled.Ul>
  ) : <></>;
};

export default Traits;
