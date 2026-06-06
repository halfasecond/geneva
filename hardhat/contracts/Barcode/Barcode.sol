// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Barcode is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant TOTAL_SUPPLY = 2_160;
    uint256 public constant TILE_SIZE    = 10;
    uint256 public constant WIDTH        = 600;
    uint256 public constant HEIGHT       = 360;
    uint256 public constant MAX_ITER     = 120;
    uint256 public constant KAPPA        = 0;
    uint256 public constant MINT_PRICE   = 0.6235 ether;

    uint256 public totalSupply;
    mapping(uint256 => uint256) public shuffledIndex;
    mapping(uint256 => uint256) public tokenIdToTileIndex;

    constructor() ERC721("Barcode", "BAR") Ownable(msg.sender) {}

    function mint(uint256 quantity) external payable {
        require(totalSupply + quantity <= TOTAL_SUPPLY, "Sold out");
        require(quantity <= 10, "Max 10 per tx");
        require(msg.value >= MINT_PRICE * quantity, "Not enough ETH");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 seed = uint256(keccak256(abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                block.number,
                msg.sender,
                totalSupply + i + 1,
                gasleft()
            )));

            // Chaos-amplified but perfectly uniform
            uint256 chaotic = _chaosAmplify(seed);
            uint256 pick = uint256(keccak256(abi.encodePacked(chaotic))) % (TOTAL_SUPPLY - totalSupply);

            uint256 tileIndex = shuffledIndex[pick] == 0 ? pick : shuffledIndex[pick];

            if (pick != (TOTAL_SUPPLY - totalSupply - 1)) {
                uint256 last = TOTAL_SUPPLY - totalSupply - 1;
                shuffledIndex[pick] = shuffledIndex[last] == 0 ? last : shuffledIndex[last];
            }
            delete shuffledIndex[TOTAL_SUPPLY - totalSupply - 1];

            uint256 tokenId = ++totalSupply;
            tokenIdToTileIndex[tokenId] = tileIndex;
            _safeMint(msg.sender, tokenId);
        }
    }

    function _chaosAmplify(uint256 seed) internal pure returns (uint256) {
        int256 x = int256(seed % 1_000_000_000);
        int256 sigma = 1;

        for (uint256 i = 0; i < 120; i++) {
            int256 nx = sigma * (x * x / 1_000_000_000);
            if (abs(nx) > int256(1_000_000_000 + (uint256(abs(x)) * 623_500_000) / 1_000_000_000)) {
                sigma = -sigma;
            }
            x = nx > 0 ? nx % 1_000_000_000 : (-nx) % 1_000_000_000;
        }
        return uint256(x < 0 ? -x : x);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 tileIndex = tokenIdToTileIndex[tokenId];
        uint256 tileX = (tileIndex % 60) * TILE_SIZE;
        uint256 tileY = (tileIndex / 60) * TILE_SIZE;

        string memory svg = _generateTileSVG(tileX, tileY, KAPPA);

        string memory json = Base64.encode(bytes(string.concat(
            '{"name":"Barcode #', tokenId.toString(), '",',
            '"description":"10x10 tile from the unique (by definition) Natural Maths Mandelbrot set.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
                '{"trait_type":"Tile X","value":', tileX.toString(), '},',
                '{"trait_type":"Tile Y","value":', tileY.toString(), '},',
                '{"trait_type":"Curvature","value":"0"}',
            ']}'
        )));

        return string.concat("data:application/json;base64,", json);
    }

    function kaos(uint256 tokenId, uint256 customKappa)
        external
        view
        returns (string memory svgBase64)
    {
        _requireOwned(tokenId);
        uint256 tileIndex = tokenIdToTileIndex[tokenId];
        uint256 tileX = (tileIndex % 60) * TILE_SIZE;
        uint256 tileY = (tileIndex / 60) * TILE_SIZE;

        string memory svg = _generateTileSVG(tileX, tileY, customKappa);
        return Base64.encode(bytes(svg));
    }

    function _generateTileSVG(uint256 startX, uint256 startY, uint256 kappa)
        internal
        pure
        returns (string memory)
    {
        string memory rects = "";
        uint256 lastRed;
        uint256 lastGreen;
        uint256 lastBlue;
        uint256 lastColor = 0;
        uint256 runLength = 0;

        for (uint256 dy = 0; dy < TILE_SIZE; dy++) {
            uint256 py = startY + dy;
            runLength = 0;
            lastColor = 0;

            for (uint256 dx = 0; dx < TILE_SIZE; dx++) {
                uint256 px = startX + dx;
                (uint256 red, uint256 green, uint256 blue, uint256 colorHash) = _getPixelColor(px, py, kappa);

                if (colorHash == lastColor && dx > 0) {
                    runLength++;
                } else {
                    if (runLength > 0) {
                        rects = string.concat(rects,
                            _rectString(dx - runLength - 1, dy, runLength, 1, lastRed, lastGreen, lastBlue)
                        );
                    }
                    lastRed = red;
                    lastGreen = green;
                    lastBlue = blue;
                    lastColor = colorHash;
                    runLength = 1;
                }
            }
            if (runLength > 0) {
                rects = string.concat(rects,
                    _rectString(TILE_SIZE - runLength, dy, runLength, 1, lastRed, lastGreen, lastBlue)
                );
            }
        }

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">',
            '<rect width="10" height="10" fill="#000511"/>',
            rects,
            '</svg>'
        );
    }

    function _getPixelColor(uint256 px, uint256 py, uint256 kappa)
        internal
        pure
        returns (uint256 red, uint256 green, uint256 blue, uint256 colorHash)
    {
        int256 c  = -2500000000 + (int256(px) * 3500000000) / int256(WIDTH - 1);
        int256 bb = (int256(py) * 2000000000) / int256(HEIGHT - 1) - 1000000000;

        int256 x = 0;
        int256 sigma = bb == 0 ? int256(1) : (bb > 0 ? int256(1) : int256(-1));
        uint256 it = 0;

        while (it < MAX_ITER) {
            int256 nx = sigma * (x * x / 1000000000) + c;
            if (abs(nx) > 1000000000 + abs(bb) * int256(kappa)) {
                sigma = -sigma;
            }
            x = nx;
            if (abs(x) > 2000000000) break;
            it++;
        }
        if (it == MAX_ITER) it = MAX_ITER;

        (red, green, blue) = _colorFromIteration(it);
        colorHash = red * 1000000 + green * 1000 + blue;
    }

    function _colorFromIteration(uint256 n) internal pure returns (uint256 r, uint256 g, uint256 b) {
        if (n >= MAX_ITER) return (5, 10, 25);
        uint256 t = n * 1000 / MAX_ITER;
        uint256 s = _sqrt(t * 1000);
        r = 40 + (190 * s) / 1000;
        g = 80 + (120 * s) / 1000;
        b = 180 + (60 * s) / 1000;
    }

    function _rectString(
        uint256 x, uint256 y, uint256 w, uint256 h,
        uint256 r, uint256 g, uint256 b
    ) internal pure returns (string memory) {
        return string.concat(
            '<rect x="', x.toString(),
            '" y="', y.toString(),
            '" width="', w.toString(),
            '" height="', h.toString(),
            '" fill="rgb(', r.toString(), ',', g.toString(), ',', b.toString(), ')"/>'
        );
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function abs(int256 x) internal pure returns (int256) {
        return x >= 0 ? x : -x;
    }
}