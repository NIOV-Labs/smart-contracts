// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title ListingDatabase
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice These are guts of `Listing` database with internal CRUD
 * functions. The data is meant to be manipulated outside of this
 * abstract. (see `PaymentProcessor.sol`)
 */

interface ListingEvents {
    event ListingCreated(
        address indexed nftAddress,
        uint indexed tokenId,
        //
        uint price,
        address indexed seller
    );

    event ListingUpdated(
        address indexed nftAddress,
        uint indexed tokenId,
        //
        uint price,
        address indexed seller
    );

    event ListingDestroyed(
        address indexed nftAddress,
        uint indexed tokenId,
        //
        // uint price,
        address indexed seller
    );
}

abstract contract ListingDatabase is ListingEvents {
    struct Listing {
        uint price;
        address seller;
    }

    mapping(address => mapping(uint => Listing)) private listings;

    /**
     * @notice Internal CREATE operation for Listing structs
     * @param nftAddress address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     * @param price sale price for each item (USD Pennies)
     * @param seller address of the seller (typically msg.sender)
     *
     * Emits `ListingCreated` Event
     */
    function _createListing(
        address nftAddress,
        uint tokenId,
        uint price,
        address seller
    ) internal {
        listings[nftAddress][tokenId] = Listing(price, seller);
        emit ListingCreated(nftAddress, tokenId, price, seller);
    }

    /**
     * @notice Internal READ operation for Listing structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     */
    function _readListing(
        address nftAddress,
        uint tokenId
    ) internal view returns (Listing memory listing) {
        listing = listings[nftAddress][tokenId];
    }

    /**
     * @notice Internal DESTROY operation for Listing structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     * @param emitEvent controls whether or not the event should be emitted
     *
     * May emit `ListingDestroyed` Event
     */
    function _destroyListing(
        address nftAddress,
        uint tokenId,
        bool emitEvent
    ) internal {
        Listing memory listing = _readListing(nftAddress, tokenId);
        delete (listings[nftAddress][tokenId]);
        if (emitEvent)
            emit ListingDestroyed(nftAddress, tokenId, listing.seller);
    }

    /**
     * @notice Internal UPDATE operation for Listing structs
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenId Token ID of NFT
     * @param newPrice new sale price for each item (USD Pennies)
     *
     * Emits `ListingUpdated` Event
     */
    function _updateListing(
        address nftAddress,
        uint tokenId,
        uint newPrice,
        address seller
    ) internal {
        listings[nftAddress][tokenId].price = newPrice;
        emit ListingUpdated(nftAddress, tokenId, newPrice, seller);
    }
}
