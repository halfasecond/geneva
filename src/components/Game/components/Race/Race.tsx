import * as Styled from './Race.style';
import Horse from 'components/Horse';
import { Z_LAYERS } from 'src/config/zIndex';
import { RaceState } from 'components/Game/utils';

interface RaceProps {
    aiHorses: Array<{
        tokenId: string;
        position: { x: number; y: number };
    }>;
    raceState: RaceState;
    countdown: number | null;
    finishResults: { tokenId: number | string, time: number }[];
    nfts: any[];
}

const Race = ({
    aiHorses,
    raceState,
    countdown = null,
    finishResults = [],
    nfts,
}: RaceProps): React.ReactElement => {

    return (
        <>
            {/* Race Track */}
            <Styled.RaceTrack />
            <Styled.StartLine />
            <Styled.FinishLine />
            
            {/* Starting Stalls */}
            <Styled.StartingStall style={{ left: 580, top: 1790 }} />
            <Styled.StartingStall style={{ left: 580, top: 1920 }} />
            <Styled.StartingStall style={{ left: 580, top: 2060 }} />

            {/* Fences */}
            <Styled.Fence className="top" />
            <Styled.Fence className="bottom" />

            {/* AI Horses */}
            {aiHorses.map((horse, index) => {
                const _horse = finishResults.filter(({ tokenId }) => tokenId === horse.tokenId).length === 1
                    ? nfts.find(nft => nft.tokenId === 151)
                    : nfts.find(nft => nft.tokenId === parseInt(horse.tokenId))
                if (!_horse) return null;
                return (
                    <Horse
                        key={horse.tokenId}
                        style={{
                            position: 'absolute',
                            left: `${horse.position.x}px`,
                            top: `${1790 + (index * 130)}px`,
                            transform: 'scaleX(1)',
                            zIndex: Z_LAYERS.TERRAIN_FEATURES + 1
                        }}
                        horse={_horse}
                    />
                )})
            }
            {/* Podium */}
            {finishResults.length > 0 && (
                <Styled.Podium data-testid="podium" style={{ opacity: 1 }}>
                    {finishResults.map((horse: any, index) => {
                        const podiumHorse = nfts.find(nft => nft.tokenId === parseInt(horse.tokenId))
                        return (
                            <Horse
                                key={`podium-${horse.tokenId}`}
                                style={{
                                    position: 'absolute',
                                    left: [102, 42, 170][index],
                                    top: [8, 18, 28][index],
                                    width: 50,
                                    height: 50
                                }}
                                horse={podiumHorse}
                            />
                        );
                    })}
                    <Styled.PodiumPlatform className="first" />
                    <Styled.PodiumPlatform className="second" />
                    <Styled.PodiumPlatform className="third" />
                </Styled.Podium>
            )}

            {/* Countdown Display */}
            {raceState === 'countdown' && countdown !== null && (
                <Styled.CountdownDisplay
                    style={{
                        animation: countdown === 0 ? 'scale 0.5s infinite' : 'none',
                        fontSize: countdown === 0 ? '72px' : '48px',
                        color: '#000',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {countdown === 0 ? 'GO!' : countdown}
                </Styled.CountdownDisplay>
            )}
        </>
    );
};

export default Race;
