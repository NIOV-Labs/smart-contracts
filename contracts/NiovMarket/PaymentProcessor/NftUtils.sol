// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title NftUtils
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice A cherry-picked assortment of functions convenient for use in the marketplace contract.
 */
abstract contract NftUtils {
    // Ownership
    error SpenderNotOwner();
    error SpenderIsOwner();
    // Approvals
    error NotApprovedForMarketplace();

    /**
     * @notice Internal method for fetching the current owner of an NFT
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @return owner address of
     */
    function _nftOwner(
        address nftAddress,
        uint tokenId
    ) internal view returns (address owner) {
        owner = IERC721(nftAddress).ownerOf(tokenId);
    }

    /**
     * @notice Internal method for fetching the approval state of an NFT for
     * the market contract
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @return approved yes/no answer
     */
    function _marketHasApprovalForNft(
        address nftAddress,
        uint tokenId
    ) internal view returns (bool approved) {
        approved = (address(this) == IERC721(nftAddress).getApproved(tokenId));
    }

    modifier isNftOwner(
        address nftAddress,
        uint tokenId,
        address spender
    ) {
        address owner = _nftOwner(nftAddress, tokenId);
        if (spender != owner) revert SpenderNotOwner();
        _;
    }

    modifier isNotNftOwner(
        address nftAddress,
        uint tokenId,
        address spender
    ) {
        address owner = _nftOwner(nftAddress, tokenId);
        if (spender == owner) revert SpenderIsOwner();
        _;
    }

    modifier nftIsApprovedForMarket(address nftAddress, uint tokenId) {
        if (!_marketHasApprovalForNft(nftAddress, tokenId))
            revert NotApprovedForMarketplace();
        _;
    }
}
