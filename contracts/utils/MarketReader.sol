// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {IPaymentProcessor, PaymentProcessorData} from "../NiovMarket/PaymentProcessor/PaymentProcessor.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IMintable721} from "../tokens/Mintable721.sol";

contract MarketReader is PaymentProcessorData {
    address public market;

    constructor(address _niovMarket) {
        market = _niovMarket;
    }

    function _market() internal view returns (IPaymentProcessor) {
        return IPaymentProcessor(market);
    }

    /////////////
    // GETTERS //
    /////////////
    /**
     * @notice Frontend READ operation for an array of ListingData
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenIds uint array of tokenIds
     *
     */
    function readListings(
        address nftAddress,
        uint[] memory tokenIds
    ) public view returns (ListingData[] memory result) {
        result = new ListingData[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++)
            result[i] = _market().readListing(nftAddress, tokenIds[i]);
    }

    function abtListingsOf(
        address nftAddress,
        address operator
    ) public view returns (ListingData[] memory result) {
        uint[] memory tokenIds = IMintable721(nftAddress).inventoryOf(operator);
        result = readListings(nftAddress, tokenIds);
    }

    ///////////////
    // MODIFIERS //
    ///////////////
    function nftIsListed(
        address nftAddress,
        uint tokenId
    ) public view returns (bool) {
        ListingData memory listing = _market().readListing(nftAddress, tokenId);
        return listing.usdPennyPrice != 0;
    }

    function operatorIsHolder(
        address nftAddress,
        uint tokenId,
        address operator
    ) public view returns (bool) {
        return operator == IERC721(nftAddress).ownerOf(tokenId);
    }

    function marketIsApproved(
        address nftAddress,
        uint tokenId
    ) public view returns (bool) {
        return market == IERC721(nftAddress).getApproved(tokenId);
    }

    //////////////
    // CHECKERS //
    //////////////
    function canCreateListing(
        address operator,
        address nftAddress,
        uint tokenId,
        uint price
    )
        public
        view
        returns (
            bool canCreate,
            bool isNftOwner,
            bool notListed,
            bool nftIsApprovedForMarket,
            bool nonZeroPrice
        )
    {
        isNftOwner = operatorIsHolder(nftAddress, tokenId, operator);
        notListed = !nftIsListed(nftAddress, tokenId);
        nftIsApprovedForMarket = marketIsApproved(nftAddress, tokenId);
        nonZeroPrice = (price > 0); // price == usdPennyPrice
        // does not check _calculateRequiredValue
        canCreate =
            isNftOwner &&
            notListed &&
            nftIsApprovedForMarket &&
            nonZeroPrice;
    }

    function canUpdateListing(
        address operator,
        address nftAddress,
        uint tokenId
    ) public view returns (bool canUpdate, bool isNftOwner, bool isListed) {
        isNftOwner = operatorIsHolder(nftAddress, tokenId, operator);
        isListed = nftIsListed(nftAddress, tokenId);
        canUpdate = isNftOwner && isListed;
    }

    function updateWillDestroyListing(
        address nftAddress,
        uint tokenId,
        uint newPrice
    )
        public
        view
        returns (bool willDestroy, bool zeroPrice, bool nftNotApprovedForMarket)
    {
        // does not check _calculateRequiredValue
        zeroPrice = newPrice <= 0;
        nftNotApprovedForMarket = !marketIsApproved(nftAddress, tokenId);
        willDestroy = zeroPrice || nftNotApprovedForMarket;
    }

    function canDestroyListing(
        address operator,
        address nftAddress,
        uint tokenId
    ) public view returns (bool canDestroy, bool isNftOwner, bool isListed) {
        (canDestroy, isNftOwner, isListed) = canUpdateListing(
            operator,
            nftAddress,
            tokenId
        );
    }

    function canAcceptAsk(
        address operator,
        address nftAddress,
        uint tokenId,
        uint messageValue
    )
        public
        view
        returns (
            bool canAccept,
            bool isNotNftOwner,
            bool isListed,
            bool accurateValue
        )
    {
        isNotNftOwner = !operatorIsHolder(nftAddress, tokenId, operator);
        isListed = nftIsListed(nftAddress, tokenId);
        ListingData memory listing = _market().readListing(nftAddress, tokenId);
        accurateValue = messageValue == listing.rawValueGas;
        canAccept = isNotNftOwner && isListed && accurateValue;
    }

    // I mean... you don't really need this
    function canWithdrawProceeds(
        address operator
    ) public view returns (bool canWithdraw) {
        (uint rawValue, ) = _market().checkProceeds(operator);
        canWithdraw = rawValue > 0;
    }
}
