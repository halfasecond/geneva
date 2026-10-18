export default [
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'claimer', type: 'address' },
            { indexed: true, internalType: 'uint256', name: 'kittyId', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'GildedClaim',
        type: 'event',
    },
]
