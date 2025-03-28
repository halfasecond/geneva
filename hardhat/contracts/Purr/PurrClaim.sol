// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICryptoKitties {
    function balanceOf(address owner) external view returns (uint256);
}

contract PurrClaim is Ownable {
    IERC20 public purrToken;
    ICryptoKitties public cryptoKitties;
    mapping(address => bool) public hasClaimed;

    event TokensClaimed(address indexed claimer, uint256 amount);

    constructor(address _purrToken, address _cryptoKitties) Ownable(msg.sender) {
        purrToken = IERC20(_purrToken);
        cryptoKitties = ICryptoKitties(_cryptoKitties);
    }

    function claim() external {
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 kittyBalance = cryptoKitties.balanceOf(msg.sender);
        require(kittyBalance > 0, "No CryptoKitties owned");

        uint256 claimable = calculatePurr(kittyBalance);
        require(claimable > 0, "Not eligible for purr");
        require(
            purrToken.balanceOf(address(this)) >= claimable,
            "Insufficient contract balance"
        );

        hasClaimed[msg.sender] = true;
        require(purrToken.transfer(msg.sender, claimable), "Transfer failed");
        emit TokensClaimed(msg.sender, claimable);
    }

    function calculatePurr(uint256 kittyBalance) internal pure returns (uint256) {
        if (kittyBalance >=  1000) {
            return 1_000 * 10 ** 18;
        } else if (kittyBalance >= 420) {
            return 690 * 10 ** 18;
        } else if (kittyBalance >= 100) {
            return 100 * 10 ** 18;
        } else if (kittyBalance >= 69) {
            return 42 * 10 ** 18;
        } else if (kittyBalance >= 10) {
            return 10 * 10 ** 18;
        } else {
            return 0;
        }
    }

    function fund(uint256 amount) external onlyOwner {
        require(
            purrToken.transferFrom(msg.sender, address(this), amount),
            "Funding failed"
        );
    }

    function hasAddressClaimed(address account) external view returns (bool) {
        return hasClaimed[account];
    }
}
