const CK_CONTRACT = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'
const FALLBACK_IMAGE = `https://img.cn.cryptokitties.co/${CK_CONTRACT.toLowerCase()}/103.png`

export const kittyImageUrl = (tokenId: number) =>
    `https://img.cryptokitties.co/${CK_CONTRACT}/${tokenId === 0 ? '--' : tokenId}.png`

export const kittyImageSrc = (kitty: { tokenId: number; image_url?: string; image_url_cdn?: string }) =>
    kitty.image_url ?? kitty.image_url_cdn ?? kittyImageUrl(kitty.tokenId)

export const KITTY_IMAGE_FALLBACK = FALLBACK_IMAGE