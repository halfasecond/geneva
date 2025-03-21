// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Purr is ERC20 {
    constructor() ERC20("Purr", "PURR") {
        _mint(msg.sender, 250_000_000 * 10 ** decimals());
    }
}