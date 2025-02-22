import { ActorType } from '../server/types/actor';
import { decode, encode } from 'js-base64'

export const getImage = (type: ActorType, id?: number): string => {
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

export const getSVG = (imgsrc: string) => {
    const svg = decode(imgsrc.split(',')[1])
    const param = imgsrc.split(',')[0]
    const _svg = []
    svg.split('><').map((bit, i) => bit.indexOf(`rect width='32' height='32' fill='#`) !== -1 ?
        _svg.push(`<rect width='32' height='32' fill='transparent' />`)
        : i === 0 ? _svg.push(`${bit}>`)
        : i === svg.split('><').length - 1 ? _svg.push(`<${bit}`)
            : _svg.push(`<${bit}>`) // Manky.. strips out the background
    )
    return param + ',' + encode(_svg.join(''))
}