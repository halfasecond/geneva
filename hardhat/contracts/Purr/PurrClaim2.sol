// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface ICryptoKitties {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @title PurrClaim2 — Gilded kitties + Fancy #1 grandmaster hatchers
/// @notice Gilded: 100 $PURR per kitty, claimed by the current owner with a merkle proof.
///         Grandmasters: 1000 $PURR per hatcher address of ranking-1 of each Fancy type
contract PurrClaim2 is Ownable {
    uint256 public constant GILDED_AMOUNT = 100 * 10 ** 18;
    uint256 public constant GRANDMASTER_AMOUNT = 1000 * 10 ** 18;

    IERC20 public purrToken;
    ICryptoKitties public cryptoKitties;

    bytes32 public gildedRoot;
    mapping(uint256 => bool) public gildedClaimed;

    mapping(address => bool) public isGrandmaster;
    mapping(address => bool) public grandmasterClaimed;
    address[] public grandmasters;

    event GildedClaim(address indexed claimer, uint256 indexed kittyId, uint256 amount);
    event GrandmasterClaim(address indexed claimer, uint256 amount);
    event GrandmasterAdded(address indexed account);

    constructor(
        address _purrToken,
        address _cryptoKitties,
        bytes32 _gildedRoot,
        address[] memory _grandmasters
    ) Ownable(msg.sender) {
        purrToken = IERC20(_purrToken);
        cryptoKitties = ICryptoKitties(_cryptoKitties);
        gildedRoot = _gildedRoot;

        for (uint256 i = 0; i < _grandmasters.length; i++) {
            _addGrandmaster(_grandmasters[i]);
        }
    }

    function _addGrandmaster(address gm) internal {
        if (gm != address(0) && !isGrandmaster[gm]) {
            isGrandmaster[gm] = true;
            grandmasters.push(gm);
            emit GrandmasterAdded(gm);
        }
    }

    /// @notice Append grandmasters. Duplicates and the zero address are skipped. There is no remove.
    function addGrandmasters(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            _addGrandmaster(accounts[i]);
        }
    }

    function isGilded(uint256 kittyId, bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(kittyId));
        return MerkleProof.verify(proof, gildedRoot, leaf);
    }

    function claimGilded(uint256 kittyId, bytes32[] calldata proof) external {
        require(cryptoKitties.ownerOf(kittyId) == msg.sender, "You don't own this kitty");
        require(isGilded(kittyId, proof), "Not a gilded kitty");
        require(!gildedClaimed[kittyId], "Already claimed");
        require(
            purrToken.balanceOf(address(this)) >= GILDED_AMOUNT,
            "Insufficient contract balance"
        );

        gildedClaimed[kittyId] = true;
        require(purrToken.transfer(msg.sender, GILDED_AMOUNT), "Transfer failed");
        emit GildedClaim(msg.sender, kittyId, GILDED_AMOUNT);
    }

    function claimGrandmaster() external {
        require(isGrandmaster[msg.sender], "Not a grandmaster");
        require(!grandmasterClaimed[msg.sender], "Already claimed");
        require(
            purrToken.balanceOf(address(this)) >= GRANDMASTER_AMOUNT,
            "Insufficient contract balance"
        );

        grandmasterClaimed[msg.sender] = true;
        require(purrToken.transfer(msg.sender, GRANDMASTER_AMOUNT), "Transfer failed");
        emit GrandmasterClaim(msg.sender, GRANDMASTER_AMOUNT);
    }

    function withdraw(uint256 amount) external onlyOwner {
        uint256 contractBalance = purrToken.balanceOf(address(this));
        require(amount <= contractBalance, "Insufficient contract balance");
        require(purrToken.transfer(msg.sender, amount), "Withdraw failed");
    }

    function grandmasterCount() external view returns (uint256) {
        return grandmasters.length;
    }

    function hasGildedClaimed(uint256 kittyId) external view returns (bool) {
        return gildedClaimed[kittyId];
    }

    function hasGrandmasterClaimed(address account) external view returns (bool) {
        return grandmasterClaimed[account];
    }
}
