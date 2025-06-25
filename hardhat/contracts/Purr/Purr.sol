// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICryptoKitties {
    function totalSupply() external view returns (uint256);
}

contract Purr is ERC20, Ownable {
    
    // Murmurare est amare... 🐾

    ICryptoKitties public immutable cryptoKitties;
    
    bool public paws;
    bool public purrmanentPaws;
    
    event Purrs(uint256 amount);
    event Paws(bool paused);
    event PurrmanentPaws();
    
    constructor(address _cryptoKittiesAddress) ERC20("$PURR", "$PURR") Ownable(msg.sender) {
        cryptoKitties = ICryptoKitties(_cryptoKittiesAddress);
        uint256 totalKitties = cryptoKitties.totalSupply();
        _mint(msg.sender, totalKitties * 10 ** decimals());
    }
    
    /**
     * @dev Mint additional PURR tokens based on CryptoKitties birth rate
     * Automatically calculates and mints the difference between current CryptoKitties
     * total supply and current PURR total supply
     */
    function purr() external {
        require(!purrmanentPaws, "Purring is over");
        require(!paws, "Purr paws");
        
        // Get current CryptoKitties total supply
        uint256 currentKittiesTotal = cryptoKitties.totalSupply();
        uint256 maxPurrSupply = currentKittiesTotal * 10 ** decimals();
        uint256 currentPurrSupply = totalSupply();
        
        // Calculate how much can be minted
        require(maxPurrSupply > currentPurrSupply, "No new PURR tokens to mint");
        uint256 amountToMint = maxPurrSupply - currentPurrSupply;
        
        _mint(owner(), amountToMint);
        emit Purrs(amountToMint);
    }
    
    /**
     * @dev Returns a random purr frequency in Hz (25-150 Hz range)
     * @return hz The purr frequency in Hz
     */
    function purrs() external view returns (uint256 hz) {
        uint256 _purr = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, block.number, msg.sender )));
        hz = 25 + (_purr % 126);
        return hz;
    }

    /**
     * @dev Toggle paws purrs - only owner can call
     */
    function togglePaws() external onlyOwner {
        require(!purrmanentPaws, "Purring is over");
        paws = !paws;
        emit Paws(paws);
    }
    
    /**
     * @dev Permanently stop minting forever - only owner can call
     * This action is irreversible!
     */
    function stopPurringForever() external onlyOwner {
        purrmanentPaws = true;
        paws = true;
        emit PurrmanentPaws();
    }
}