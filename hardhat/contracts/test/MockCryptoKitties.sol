// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockCryptoKitties {
    mapping(uint256 => address) private _owners;
    uint256 private _totalSupply = 2_500_000; // Mock total supply for testing
    
    function setKittyOwner(uint256 kittyId, address owner) external {
        _owners[kittyId] = owner;
    }
    
    function ownerOf(uint256 kittyId) external view returns (address) {
        address owner = _owners[kittyId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
    
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    // Function to set total supply for testing different scenarios
    function setTotalSupply(uint256 newTotalSupply) external {
        _totalSupply = newTotalSupply;
    }
}