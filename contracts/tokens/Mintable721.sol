// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract Mintable721 is ERC721, Ownable {
    using Strings for uint;
    uint public numTokens;
    string private baseUri;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseUri = _uri;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token with regard to tokenId
     */
    function tokenURI(
        uint tokenId
    ) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        //
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    /**
     * @dev Returns user inventory as array of tokenIds
     */
    function inventoryOf(address operator) public view returns (uint[] memory) {
        if (operator == address(0)) revert ERC721InvalidOperator(operator);
        //
        uint tokenCount = balanceOf(operator);
        if (tokenCount == 0) {
            return new uint[](0);
        } else {
            uint[] memory result = new uint[](tokenCount);
            uint resultIndex;
            for (uint tokenId = 1; tokenId <= numTokens; tokenId++) {
                if (ownerOf(tokenId) == operator) {
                    result[resultIndex] = tokenId;
                    resultIndex++;
                }
            }
            return result;
        }
    }

    /**
     * @dev Mints the recipient a new token and returns its id
     */
    function mintTo(address to) public onlyOwner returns (uint) {
        if (to == address(0)) revert ERC721InvalidReceiver(address(0));
        //
        numTokens++;
        _mint(to, numTokens);
        return numTokens;
    }
}
