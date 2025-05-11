// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoKitties {
    // Mock balance for all addresses
    uint256 private mockBalance = 10;

    // Function to return a fixed balance for any address
    function balanceOf(address owner) external view returns (uint256) {
        return mockBalance;
    }

    // Optional: Function to set a custom mock balance (useful for testing)
    // function setMockBalance(uint256 newBalance) external {
    //     mockBalance = newBalance;
    // }
}