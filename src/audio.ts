import { getAssetPath } from './utils/assetPath';

// Audio setup
export const BACKGROUND_MUSIC = new Audio(getAssetPath('Sumer.mp3'));
BACKGROUND_MUSIC.loop = true;