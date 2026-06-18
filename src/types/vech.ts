export interface VechTrait {
    trait_type: string;
    value: string;
}

export interface VechNft {
    tokenId: number;
    shipId?: number;
    owner: string;
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    background_color?: string;
    attributes?: VechTrait[];
}