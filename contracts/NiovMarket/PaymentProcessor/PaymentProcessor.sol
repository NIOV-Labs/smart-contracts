// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {NftUtils} from "./NftUtils.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {OracleConsumer} from "./OracleConsumer/OracleConsumer.sol";
import {ProceedsManager} from "./ProceedsManager.sol";
import {ListingDatabase} from "./ListingDatabase.sol";

/**
 * @title PaymentProcessor
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice This contract serves as the main commercial hub
 */

interface PaymentProcessorErrors {
    // PaymentProcessor
    error PriceNotMet(
        address nftAddress,
        uint tokenId,
        uint usdPennyPrice,
        uint requiredValue
    );

    // Commerce
    error PriceMustBeAboveZero();

    // Listing
    error AlreadyListed(address nftAddress, uint tokenId);
    error NotListed(address nftAddress, uint tokenId);
    // Proceeds
    error NoProceeds();
}

interface PaymentProcessorEvents {
    // ProceedsManager
    event ProceedsWithdrawn(
        uint usdPennyValue,
        uint rawValue,
        address indexed seller
    );
    // ListingDatabase
    event ListingClosed(
        address indexed buyer,
        address indexed nftAddress,
        uint tokenId,
        uint usdPennyPrice,
        address paymentMethod,
        uint requiredValue,
        address indexed seller
    );
}

contract PaymentProcessor is
    NftUtils,
    ReentrancyGuard,
    OracleConsumer,
    ProceedsManager,
    ListingDatabase,
    PaymentProcessorErrors,
    PaymentProcessorEvents
{
    constructor(
        address _oracle,
        address _nativeToken
    ) OracleConsumer(_oracle, _nativeToken) {}

    ///////////////////////////////
    // ListingDatabase Functions //
    ///////////////////////////////
    modifier notListed(address nftAddress, uint tokenId) {
        Listing memory listing = _readListing(nftAddress, tokenId);
        if (
            listing.price > 0 &&
            listing.seller == _nftOwner(nftAddress, tokenId)
        ) revert AlreadyListed(nftAddress, tokenId);
        _;
    }
    modifier isListed(address nftAddress, uint tokenId) {
        Listing memory listing = _readListing(nftAddress, tokenId);
        if (listing.price <= 0) revert NotListed(nftAddress, tokenId);
        _;
    }

    /**
     * @notice External CREATE operation for Listing Structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     * @param price sale price for each item (USD Pennies)
     *
     * Emits `ListingCreated` Event
     * See './ListingDatabase.sol' for more details
     */
    function createListing(
        address nftAddress,
        uint tokenId,
        uint price
    )
        external
        isNftOwner(nftAddress, tokenId, msg.sender)
        notListed(nftAddress, tokenId)
        nftIsApprovedForMarket(nftAddress, tokenId)
    {
        if (price <= 0 || _calculateRequiredValue(price, true) <= 0)
            revert PriceMustBeAboveZero();
        _createListing(nftAddress, tokenId, price, msg.sender);
    }

    /**
     * @notice External READ operation for Listing Structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     *
     * In the event that a seller decides to transfer their NFT
     * without destroying their listing, it simply shows up as
     * not for sale.
     *
     * See './ListingDatabase.sol' for more details
     */
    function readListing(
        address nftAddress,
        uint tokenId
    )
        external
        view
        returns (
            address seller,
            uint usdPennyPrice,
            uint rawValueGas,
            uint rawValueTkn
        )
    {
        Listing memory listing = _readListing(nftAddress, tokenId);
        bool sellerIsOwner = (listing.seller == _nftOwner(nftAddress, tokenId));
        if (sellerIsOwner) {
            seller = listing.seller;
            usdPennyPrice = listing.price;
            rawValueGas = _calculateRequiredValue(usdPennyPrice, true);
            rawValueTkn = _calculateRequiredValue(usdPennyPrice, false);
        } else {
            seller = address(0);
            usdPennyPrice = 0;
            rawValueGas = 0;
            rawValueTkn = 0;
        }
    }

    /**
     * @notice External UPDATE operation for Listing Structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     * @param newPrice new sale price for each item (USD Pennies)
     *
     * Will DESTROY listing instead of update if the `newPrice` is <= 0
     * OR if the market is missing approval.
     *
     * Emits `ListingUpdated` or `ListingDeleted` Event
     * See './ListingDatabase.sol' for more details
     */
    function updateListing(
        address nftAddress,
        uint tokenId,
        uint newPrice
    )
        external
        isNftOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        if (
            !_marketHasApprovalForNft(nftAddress, tokenId) ||
            newPrice <= 0 ||
            _calculateRequiredValue(newPrice, true) <= 0
        ) _destroyListing(nftAddress, tokenId, true);
        else _updateListing(nftAddress, tokenId, newPrice, msg.sender);
    }

    /**
     * @notice External DESTROY operation for Listing Structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     *
     * Emits `ListingDestroyed` Event
     * See './ListingDatabase.sol' for more details
     */
    function destroyListing(
        address nftAddress,
        uint tokenId
    )
        external
        isNftOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        _destroyListing(nftAddress, tokenId, true);
    }

    ////////////////////////////////
    // PaymentProcessor Functions //
    ////////////////////////////////
    /**
     * @notice Method for accepting the asking price of a listing
     * @notice The owner of an NFT could unapprove the marketplace,
     * which would cause this function to fail. Ideally you'd also
     * have a `createOffer` functionality.
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     *
     * Emits `ListingClosed` Event
     */
    function acceptAsk(
        address nftAddress,
        uint tokenId
    )
        external
        payable
        isNotNftOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        Listing memory listing = _readListing(nftAddress, tokenId);
        uint rawValue = _calculateRequiredValue(listing.price, true);
        if (rawValue <= 0) revert PriceMustBeAboveZero();
        // if (msg.value < rawValue) // I mean can we be nice and only accept exact change? lol
        if (msg.value != rawValue)
            revert PriceNotMet(nftAddress, tokenId, listing.price, rawValue);
        _destroyListing(nftAddress, tokenId, false);

        // Transact
        IERC721(nftAddress).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );
        _updateProceeds(listing.seller, msg.value);

        emit ListingClosed(
            msg.sender,
            nftAddress,
            tokenId,
            listing.price,
            address(0),
            rawValue,
            listing.seller
        );
    }

    ///////////////////////////////
    // ProceedsManager Functions //
    ///////////////////////////////
    /**
     * @notice Fetches the amount of available proceeds for a seller
     * @param seller Address of seller
     * @return amount is the raw value of gas that can be redeemed.
     */
    function checkProceeds(address seller) public view returns (uint amount) {
        amount = _readProceeds(seller);
    }

    /**
     * @notice Method for withdrawing proceeds
     *
     * Emits `ProceedsWithdrawn` Event
     */
    function withdrawProceeds() external nonReentrant {
        uint amount = _readProceeds(msg.sender);
        if (amount <= 0) revert NoProceeds();
        _destroyProceeds(msg.sender);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        uint usdPennyValue = _backConversion(amount);
        emit ProceedsWithdrawn(usdPennyValue, amount, msg.sender);
    }
}
