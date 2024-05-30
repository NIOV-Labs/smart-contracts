// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {IPaymentProcessor, PaymentProcessorData} from "../NiovMarket/PaymentProcessor/PaymentProcessor.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MarketReader is PaymentProcessorData {
    address public market;

    constructor(address _niovMarket) {
        market = _niovMarket;
    }

    function _market() internal view returns (IPaymentProcessor) {
        return IPaymentProcessor(market);
    }

    /**
     * @notice Frontend READ operation for an array of ListingData
     * @param nftAddress Address of NFT contract (typically the ABT contract)
     * @param tokenIds uint array of tokenIds
     *
     */
    function readListings(
        address nftAddress,
        uint[] memory tokenIds
    ) external view returns (ListingData[] memory result) {
        result = new ListingData[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            result[i] = _market().readListing(nftAddress, tokenIds[i]);
        }
    }
}
