import { getAssetPath } from './utils/assetPath';

// Audio setup
export const BACKGROUND_MUSIC = new Audio(getAssetPath('/audio/Sumer.mp3'));
// BACKGROUND_MUSIC.loop = true;

export const ghostFound = () => {
    const noises = [
        '/audio/Science Fiction Sci-Fi Electronic Alert Beep High.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Ascending Beep Short.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Beep High Pitched.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Beep.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Beeps Two.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Beeps.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Blip274.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Blurp.mp3',
        '/audio/Science Fiction Sci-Fi Electronic Chime.mp3',
    ]
    const randomNumber = Math.floor(Math.random() * noises.length)
    const STAB = new Audio(getAssetPath(noises[randomNumber]))
    STAB.play()
}