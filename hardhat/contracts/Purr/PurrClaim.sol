// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface ICryptoKitties {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract PurrClaim is Ownable {
    IERC20 public purrToken;
    ICryptoKitties public cryptoKitties;
    
    mapping(uint256 => uint256) public kittyClaimed;
    bytes32 public diamonds;
    bytes32[] public exclusives;
    bool public portalOpen;

    event Claim(address indexed claimer, uint256 indexed kittyId, uint256 amount);
    event PortalOpen(address indexed openedBy);

    constructor(address _purrToken, address _cryptoKitties) Ownable(msg.sender) {
        purrToken = IERC20(_purrToken);
        cryptoKitties = ICryptoKitties(_cryptoKitties);
        diamonds = 0x12349fca1989b4a32ad421092981473494e8d91675b639d881ff4141a9412f0a;
        exclusives.push(0x68be1c5b2727fbdc09c67656b2a7286a2a8d8dfd12ef2fbc893b51903106af5c);
        portalOpen = false;
    }
    
    /**
     * @dev Check if a kitty ID is a diamond kitty using a Merkle proof
     * @param kittyId The kitty ID to check
     * @param merkleProof The Merkle proof for the kitty ID
     * @return Whether the kitty is a diamond kitty
     */
    function isDiamond(uint256 kittyId, bytes32[] calldata merkleProof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(kittyId));
        return MerkleProof.verify(merkleProof, diamonds, leaf);
    }

    /**
     * @dev Check if a kitty ID is an exclusive using Merkle proofs
     * @param kittyId The kitty ID to check
     * @param proof The Merkle proof for the kitty ID
     * @return Whether the kitty is exclusive
     */
    function isExclusive(uint256 kittyId, bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(kittyId));
        for (uint256 i = 0; i < exclusives.length; i++) {
            if (MerkleProof.verify(proof, exclusives[i], leaf)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Claim PURR tokens for a specific kitty
     * @param kittyId The ID of the kitty to claim for
     * @param proof The Merkle proof if claiming for a diamond kitty
     */
    function claim(uint256 kittyId, bytes32[] calldata proof) external {
        // Verify the sender owns this kitty
        require(cryptoKitties.ownerOf(kittyId) == msg.sender, "You don't own this kitty");

        bool diamond = isDiamond(kittyId, proof);
        bool exclusive = isExclusive(kittyId, proof);
        
        // Check if this kitty is eligible (either ID <= MAX_ELIGIBLE_ID or is a diamond kitty)
        require(
            kittyId <= 3365 || diamond || exclusive,
            "kitty is not eligible for this claim"
        );
        
        uint256 alreadyClaimed = kittyClaimed[kittyId];
        
        // For reclaims (kitty has already claimed something), require proof
        if (alreadyClaimed > 0) {
            require(proof.length > 0, "Reclaims must include a proof");
        }
        
        uint256 maxClaimable = calculatePurr(kittyId, diamond, exclusive);
        
        // Calculate the difference to claim
        require(maxClaimable > alreadyClaimed, "This kitty has already claimed the maximum amount");
        uint256 claimable = maxClaimable - alreadyClaimed;
        
        require(
            purrToken.balanceOf(address(this)) >= claimable,
            "Insufficient contract balance"
        );
        
        // Update the total claimed amount for this kitty
        kittyClaimed[kittyId] = maxClaimable;
        
        // Transfer tokens to the owner
        require(purrToken.transfer(msg.sender, claimable), "Transfer failed");
        emit Claim(msg.sender, kittyId, claimable);
    }

    /**
     * @dev Calculate the amount of PURR tokens to claim
     * @return Fixed amount of PURR tokens
     */
    function calculatePurr(uint256 kittyId, bool diamond, bool exclusive) internal pure returns (uint256) {
        uint256 baseAmount = 10;
        uint256 amount = baseAmount;

        if (kittyId <= 100) {
            amount *= baseAmount; // founders multiplier
        }

        if (exclusive) {
            amount *= baseAmount; // exclusives multiplier
        }

        if (diamond) {
            amount *= baseAmount; // diamonds multiplier
            amount *= baseAmount;
        }

        if (kittyId <= 3365) {
            amount *= baseAmount; // day1 multiplier
        }

        return amount * 10 ** 18;
    }

    function withdraw(uint256 amount) external onlyOwner {
        uint256 contractBalance = purrToken.balanceOf(address(this));
        require(amount <= contractBalance, "Insufficient contract balance");
        require(purrToken.transfer(msg.sender, amount), "Withdraw failed");
    }

    /**
     * @dev Update the entire array of Merkle roots for exclusives (onlyOwner)
     * @param roots The new array of Merkle roots for the exclusives batch
     */
    function updateExclusiveRoots(bytes32[] calldata roots) external onlyOwner {
        exclusives = roots; // Replace the entire exclusives array with the new one
    }

    /**
     * @dev Opens a portal so non-Day1 Exclusives can claim $PURR
     * @param kittyId a mystery kitty that can open a portal to a new dimension
     */
    function openPortal(uint256 kittyId) external {
        require(!portalOpen, "Portal already opened");
        require(keccak256(abi.encodePacked(kittyId)) == 0x66925e85f1a4743fd8d60ba595ed74887b7caf321dd83b21e04d77c115383408, "This kitty can not open portals");
        require(cryptoKitties.ownerOf(kittyId) == msg.sender, "Portal must be opened by owner");
        uint256 contractBalance = purrToken.balanceOf(address(this));
        uint256 amount = kittyId * 10 * 10 ** 18;
        require(amount <= contractBalance, "More $PURR needed to power the portal!");
        require(purrToken.transfer(msg.sender, amount), "Transfer failed");
        portalOpen = true;
        exclusives.push(0x05048a079a07ef7749db7bd397d7811e0ad1b93ba9264746543fc36465176e85);
        emit PortalOpen(msg.sender);
    }
    
    /**
     * @dev Check if a kitty has already claimed
     * @param kittyId The ID of the kitty to check
     * @return Whether the kitty has claimed
     */
    function hasKittyClaimed(uint256 kittyId) external view returns (bool) {
        return kittyClaimed[kittyId] > 0;
    }
    
    /**
     * @dev Get the amount a kitty has already claimed
     * @param kittyId The ID of the kitty to check
     * @return The amount already claimed by this kitty
     */
    function getKittyClaimedAmount(uint256 kittyId) external view returns (uint256) {
        return kittyClaimed[kittyId];
    }
    
    /**
     * @dev Get the maximum amount a kitty can claim with proper proofs
     * @param kittyId The ID of the kitty to check
     * @param proof The Merkle proof for diamond/exclusive verification
     * @return The maximum amount this kitty can claim
     */
    function getKittyMaxClaim(uint256 kittyId, bytes32[] calldata proof) external view returns (uint256) {
        // Check if this kitty is eligible
        bool diamond = isDiamond(kittyId, proof);
        bool exclusive = isExclusive(kittyId, proof);
        
        if (!(kittyId <= 3365 || diamond || exclusive)) {
            return 0; // Not eligible
        }
        
        return calculatePurr(kittyId, diamond, exclusive);
    }
    
    /**
     * @dev Get the remaining amount a kitty can still claim
     * @param kittyId The ID of the kitty to check
     * @param proof The Merkle proof for diamond/exclusive verification
     * @return The remaining amount this kitty can claim
     */
    function getKittyRemainingClaim(uint256 kittyId, bytes32[] calldata proof) external view returns (uint256) {
        uint256 maxClaim = this.getKittyMaxClaim(kittyId, proof);
        uint256 alreadyClaimed = kittyClaimed[kittyId];
        
        if (maxClaim <= alreadyClaimed) {
            return 0;
        }
        
        return maxClaim - alreadyClaimed;
    }
}
