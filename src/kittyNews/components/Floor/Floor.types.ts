export interface FloorItem {
    price: string;
    tokenId: number;
    icon: string;
    searchUrl: string;
}

export interface FloorData {
    sale: FloorItem;
    sire: FloorItem;
    gen0: FloorItem;
    gen0virgin: FloorItem;
    founders: FloorItem;
    fancy: FloorItem;
    shinyfancy: FloorItem;
    exclusive: FloorItem;
    diamond: FloorItem;
    gilded: FloorItem;
    amethyst: FloorItem;
    lapis: FloorItem;
    purrstige: FloorItem;
    specialedition: FloorItem;
    day1: FloorItem;
    born2017: FloorItem;
}