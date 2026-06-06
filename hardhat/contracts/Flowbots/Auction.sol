// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @dev Minimal ERC-721 interface surface we need.
interface IERC721Like {
    function ownerOf(uint256 tokenId) external view returns (address);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;

    function transferFrom(address from, address to, uint256 tokenId) external;
}

/// @dev Hardhat ABI says constructor takes `contract Flowbots`.
interface Flowbots is IERC721Like {

}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract Auction is IERC721Receiver {
    // -----------------------------
    // Events (match ABI names/fields)
    // -----------------------------
    event Birth(uint256 tokenId);
    event HighestBidIncreased(address from, uint256 amount, uint256 tokenId);
    event Received(address owner, uint256 amount);
    event SaleCancelled(uint256 tokenId);
    event SaleCreated(
        uint256 tokenId,
        uint256 startPrice,
        uint256 endPrice,
        uint256 endTime,
        address from
    );
    event SaleSuccessful(uint256 tokenId, uint256 amount, address owner);

    // -----------------------------
    // Storage (match ABI getters)
    // -----------------------------
    uint256 public activeAuction; // ABI: activeAuction() -> uint256
    uint256 public auctionEndTime; // ABI: auctionEndTime() -> uint256
    uint256 public auctionEndsAt; // ABI: auctionEndsAt() -> uint256

    mapping(address => uint256) public bidderBalances; // ABI: bidderBalances(address) -> uint256

    uint256 public biddingTime; // ABI: biddingTime() -> uint256
    uint256 public feePercentage; // ABI: feePercentage() -> uint256
    Flowbots public flowbots; // ABI: flowbots() -> address
    uint256 public highestBid; // ABI: highestBid() -> uint256
    address public highestBidder; // ABI: highestBidder() -> address
    uint256 public nftId; // ABI: nftId() -> uint256
    address payable public owner; // ABI: owner() -> address payable

    // Sale model inferred from ABI for `nftSales(uint256)`
    struct NftSale {
        uint256 nftId;
        uint256 startPrice;
        uint256 endPrice;
        uint256 duration;
        uint256 startTime;
        address seller;
        bool active;
    }

    // ABI: nftSales(uint256) -> (nftId,startPrice,endPrice,duration,startTime,seller,active)
    mapping(uint256 => NftSale) public nftSales;

    // Internal guard for init()
    bool private _initialized;

    // -----------------------------
    // Constructor (match ABI)
    // -----------------------------
    constructor(
        uint256 _biddingTime,
        Flowbots _flowbots,
        address payable _owner
    ) {
        biddingTime = _biddingTime;
        flowbots = _flowbots;
        owner = _owner;

        // Reasonable defaults; original contract may differ.
        feePercentage = 2; // 2%
        auctionEndTime = _biddingTime;
    }

    // -----------------------------
    // Receive ETH (match ABI: receive payable)
    // -----------------------------
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // -----------------------------
    // Admin
    // -----------------------------
    function setFeePercentage(uint256 _feePercentage) external {
        require(msg.sender == owner, "Only the owner can call this function.");
        require(
            _feePercentage <= 100,
            "Fee percentage cannot be greater than or equal to 100."
        );
        feePercentage = _feePercentage;
    }

    // -----------------------------
    // Init (match ABI: init() payable)
    // -----------------------------
    function init() external payable {
        require(!_initialized, "Auction already initialized.");
        _initialized = true;

        // This function’s original semantics aren’t recoverable from ABI alone.
        // We keep it payable and emit a receipt for funds.
        if (msg.value > 0) {
            emit Received(msg.sender, msg.value);
        }
    }

    // -----------------------------
    // Core sale/auction creation
    // -----------------------------
    function createAuction(
        uint256 _nftId,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _duration
    ) external {
        require(_duration > 0, "Duration must be greater than 0.");
        require(
            flowbots.ownerOf(_nftId) == msg.sender,
            "Auction: You do not own this NFT."
        );
        require(
            !nftSales[_nftId].active,
            "There is already an active auction for this NFT."
        );

        // Transfer NFT into escrow
        flowbots.transferFrom(msg.sender, address(this), _nftId);

        nftSales[_nftId] = NftSale({
            nftId: _nftId,
            startPrice: _startPrice,
            endPrice: _endPrice,
            duration: _duration,
            startTime: block.timestamp,
            seller: msg.sender,
            active: true
        });

        nftId = _nftId;
        activeAuction = _nftId;

        highestBid = 0;
        highestBidder = address(0);

        auctionEndsAt = block.timestamp + _duration;

        emit SaleCreated(
            _nftId,
            _startPrice,
            _endPrice,
            auctionEndsAt,
            msg.sender
        );
    }

    function addBuyNowSale(uint256 _nftId, uint256 _price) external {
        require(
            flowbots.ownerOf(_nftId) == msg.sender,
            "You do not own this NFT."
        );
        require(
            !nftSales[_nftId].active,
            "There is already an active auction for this NFT."
        );

        flowbots.transferFrom(msg.sender, address(this), _nftId);

        nftSales[_nftId] = NftSale({
            nftId: _nftId,
            startPrice: _price,
            endPrice: _price,
            duration: 0,
            startTime: block.timestamp,
            seller: msg.sender,
            active: true
        });

        emit SaleCreated(_nftId, _price, _price, block.timestamp, msg.sender);
    }

    function cancelSale(uint256 _nftId) external {
        NftSale storage sale = nftSales[_nftId];
        require(sale.active, "This sale can not be cancelled");

        // Seller or contract owner can cancel
        require(
            msg.sender == sale.seller || msg.sender == owner,
            "You are not authorised to cancel this sale"
        );

        // If this is the globally tracked active auction and there are bids, seller cancellation is risky.
        // We keep it simple and allow cancellation only when no highest bid.
        require(
            highestBid == 0 || activeAuction != _nftId,
            "This sale can not be cancelled"
        );

        sale.active = false;

        // Return NFT
        flowbots.safeTransferFrom(address(this), sale.seller, _nftId);

        emit SaleCancelled(_nftId);
    }

    // -----------------------------
    // English-style bidding (ABI: bid(uint256) payable)
    // -----------------------------
    function bid(uint256 _id) external payable {
        NftSale storage sale = nftSales[_id];
        require(sale.active, "NFT not available for sale");
        require(
            msg.sender != sale.seller,
            "You can not bid on your own auction"
        );

        // If duration is set, enforce end time
        if (sale.duration > 0) {
            require(
                block.timestamp < sale.startTime + sale.duration,
                "Auction already ended."
            );
        }

        // Require strictly higher bid than current
        require(msg.value > highestBid, "There is already a higher bid.");
        require(msg.value >= getCurrentPrice(_id), "Bid increment is too low.");

        // Refund previous bidder via withdraw pattern
        if (highestBidder != address(0)) {
            bidderBalances[highestBidder] += highestBid;
        }

        highestBid = msg.value;
        highestBidder = msg.sender;

        emit HighestBidIncreased(msg.sender, msg.value, _id);
    }

    function auctionEnd(uint256 _nftId) external {
        NftSale storage sale = nftSales[_nftId];
        require(sale.active, "Invalid NFT ID");
        require(
            sale.duration == 0 ||
                block.timestamp >= sale.startTime + sale.duration,
            "Auction not yet ended."
        );

        sale.active = false;

        // If no bids, return NFT to seller
        if (highestBidder == address(0)) {
            flowbots.safeTransferFrom(address(this), sale.seller, _nftId);
            emit SaleCancelled(_nftId);
            return;
        }

        // Transfer NFT to winner
        flowbots.safeTransferFrom(address(this), highestBidder, _nftId);

        // Fee + payout
        uint256 fee = (highestBid * feePercentage) / 100;
        uint256 payout = highestBid - fee;

        // Pay seller
        (bool okSeller, ) = payable(sale.seller).call{value: payout}("");
        require(okSeller, "Transfer failed");

        // Pay fee to owner (if any)
        if (fee > 0) {
            (bool okOwner, ) = owner.call{value: fee}("");
            require(okOwner, "Transfer failed");
        }

        emit SaleSuccessful(_nftId, highestBid, highestBidder);

        // Reset globals if this was the “activeAuction”
        if (activeAuction == _nftId) {
            activeAuction = 0;
            highestBid = 0;
            highestBidder = address(0);
            nftId = 0;
            auctionEndsAt = 0;
        }
    }

    // -----------------------------
    // Buy-now (ABI: buyNow(uint256) payable)
    // -----------------------------
    function buyNow(uint256 _nftId) external payable {
        NftSale storage sale = nftSales[_nftId];
        require(sale.active, "NFT not available for buy now.");

        // Buy-now sale identified by fixed price (start==end) and duration==0
        require(
            sale.duration == 0 && sale.startPrice == sale.endPrice,
            "NFT not available for buy now."
        );

        uint256 price = sale.startPrice;
        require(msg.value >= price, "Insufficient funds to buy now.");

        sale.active = false;

        flowbots.safeTransferFrom(address(this), msg.sender, _nftId);

        uint256 fee = (price * feePercentage) / 100;
        uint256 payout = price - fee;

        (bool okSeller, ) = payable(sale.seller).call{value: payout}("");
        require(okSeller, "Transfer failed");

        if (fee > 0) {
            (bool okOwner, ) = owner.call{value: fee}("");
            require(okOwner, "Transfer failed");
        }

        // Refund excess
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool okRefund, ) = payable(msg.sender).call{value: excess}("");
            require(okRefund, "Transfer failed");
        }

        emit SaleSuccessful(_nftId, price, msg.sender);
    }

    // -----------------------------
    // Views (match ABI)
    // -----------------------------
    function getRefundAmount() external view returns (uint256) {
        return bidderBalances[msg.sender];
    }

    function getCurrentPrice(uint256 _nftId) public view returns (uint256) {
        NftSale memory sale = nftSales[_nftId];
        require(sale.active, "Invalid NFT ID");

        // Fixed price
        if (sale.duration == 0) return sale.startPrice;

        // Default to Dutch-style interpolation from startPrice -> endPrice
        return
            calculateDutchAuctionPrice(
                sale.startTime,
                sale.startTime + sale.duration,
                sale.startPrice,
                sale.endPrice
            );
    }

    function calculateDutchAuctionPrice(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _startPrice,
        uint256 _endPrice
    ) public view returns (uint256) {
        if (block.timestamp <= _startTime) return _startPrice;
        if (block.timestamp >= _endTime) return _endPrice;

        uint256 elapsed = block.timestamp - _startTime;
        uint256 duration = _endTime - _startTime;

        if (_startPrice >= _endPrice) {
            uint256 delta = _startPrice - _endPrice;
            return _startPrice - ((delta * elapsed) / duration);
        } else {
            uint256 delta = _endPrice - _startPrice;
            return _startPrice + ((delta * elapsed) / duration);
        }
    }

    function calculateReverseDutchAuctionPrice(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _startPrice,
        uint256 _endPrice
    ) external view returns (uint256) {
        // Reverse meaning: price moves endPrice -> startPrice over time (simple swap)
        return
            calculateDutchAuctionPrice(
                _startTime,
                _endTime,
                _endPrice,
                _startPrice
            );
    }

    // -----------------------------
    // ERC-721 Receiver (match ABI)
    // -----------------------------
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
