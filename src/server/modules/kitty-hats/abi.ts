/** Item NFT: Apply(uint256 kittyId) / Remove(uint256 kittyId) */
export const ITEM_EVENTS = [
    {
        type: 'event',
        name: 'Apply',
        inputs: [{ indexed: false, name: 'kittyId', type: 'uint256' }],
    },
    {
        type: 'event',
        name: 'Remove',
        inputs: [{ indexed: false, name: 'kittyId', type: 'uint256' }],
    },
] as const;

/** Marketplace core: Buy(string itemName) */
export const CORE_EVENTS = [
    {
        type: 'event',
        name: 'Buy',
        inputs: [{ indexed: false, name: 'itemName', type: 'string' }],
    },
] as const;

export const CORE_ADDR = '0xfc9ec868f4c8c586d1bb7586870908cca53d5f38';

export const APPLY_TOPIC = '0x2fc96119a3d9277e338f2f7b673fd2a522fd9f9d6c58ddc6c661d4bd41e7d995';
export const REMOVE_TOPIC = '0x476e4aa4bb19dbdea8700b4db99d81ad2fefcf51924ba5d493b7be6393f82201';
export const BUY_TOPIC = '0x353b106fdecdb1f25da8bb26e494673ac78af8663fd9dcb279f04c0c6c59c371';
