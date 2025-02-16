import { ActorType } from '../server/types/actor';

export const getImage = (type: ActorType, id?: string): string => {
    switch (type) {
        case 'player':
            if (!id) throw new Error('Player type requires an ID');
            return `horse/${id}.svg`;
        case 'duck of doom':
            return 'svg/horse/Duck.svg';
        case 'flower of goodwill':
            return 'svg/horse/Flower.svg';
        default:
            throw new Error(`Unknown actor type: ${type}`);
    }
};