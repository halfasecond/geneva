// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoKitties {
    // Mock balance for all addresses
    uint256 private mockBalance = 10;
    
    // Mapping to track kitty ownership for testing
    mapping(uint256 => address) private kittyOwners;
    
    // Mapping to track which kitties should revert (for testing non-existent kitties)
    mapping(uint256 => bool) private nonExistentKitties;

    // Function to return a fixed balance for any address
    function balanceOf(address owner) external view returns (uint256) {
        return mockBalance;
    }

    // Function to return ownership of a kitty
    function ownerOf(uint256 tokenId) external view returns (address) {
        // require(!nonExistentKitties[tokenId], "ERC721: owner query for nonexistent token");
        
        // // If ownership is explicitly set, return that
        // if (kittyOwners[tokenId] != address(0)) {
        //     return kittyOwners[tokenId];
        // }
        
        // // Default behavior: return msg.sender (for backward compatibility)
        // return msg.sender;
        return 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    }

    // Test helper functions
    function setKittyOwner(uint256 tokenId, address owner) external {
        kittyOwners[tokenId] = owner;
    }
    
    function setNonExistent(uint256 tokenId, bool nonExistent) external {
        nonExistentKitties[tokenId] = nonExistent;
    }
    
    function setMockBalance(uint256 newBalance) external {
        mockBalance = newBalance;
    }
    // Total supply function for compatibility with Purr contract
    function totalSupply() external pure returns (uint256) {
        return 100000; // Mock total supply of 100,000 kitties
    }
}