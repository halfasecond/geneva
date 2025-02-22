import { Actor } from 'server/types/Actor'
import { getSVG, getImage } from 'src/utils/getImage';
import { getAssetPath } from 'src/utils/assetPath';
import { Z_LAYERS } from 'src/config/zIndex';

const GameActor = ({ actor, visible, asset }: {
    actor: Actor;
    visible: boolean;
    asset: any,
}) => actor.type === 'player' ? (
    <img
        src={asset?.svg ? getSVG(asset.svg) : ''}
        alt={`${actor.type} ${actor.id}`}
        style={{
            width: '100px',
            height: '100px',
            left: `${actor.position.x}px`,
            top: `${actor.position.y}px`,
            transform: `scaleX(${actor.position.direction === "right" ? 1 : -1})`,
            display: visible ? 'block' : 'none',
            position: 'absolute',
            willChange: 'transform',
            transition: 'all 0.1s linear',
            zIndex: Z_LAYERS.CHARACTERS,
        }}
    />
) : (
    <img
        src={getAssetPath(getImage(actor.type, actor.id))}
        alt={`${actor.type} ${actor.id}`}
        style={{
            width: actor.type === 'flower of goodwill' && actor.size ? `${actor.size}px` : '100px',
            height: actor.type === 'flower of goodwill' && actor.size ? `${actor.size}px` : '100px',
            left: `${actor.position.x}px`,
            top: `${actor.position.y}px`,
            transform: `scaleX(${actor.position.direction === "right" ? 1 : -1})`,
            display: visible ? 'block' : 'none',
            position: 'absolute',
            willChange: 'transform',
            transition: 'all 0.1s linear',
            zIndex: Z_LAYERS.CHARACTERS,
        }}
    />
);

export default GameActor