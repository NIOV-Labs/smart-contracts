// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title ReceiptKeeper
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice DO NOT IMPLEMENT! DO NOT IMPLEMENT! DO NOT IMPLEMENT!
 *
 * This is a demonstration of how stupid it is to store things that
 * should just be events on-chain.
 *
 * Adding `_createReceipt` just before the emission in `acceptAsk`
 * inflated gas price by ~2.5X
 */

contract ReceiptKeeper {
    struct Receipt {
        address buyer;
        address nftAddress;
        uint tokenId;
        uint price; // USD Pennies
        address paymentMethod; // address(0) if gas
        uint rawValue;
        address seller;
    }
    uint public numReceipts;
    mapping(uint => Receipt) private receipts;

    function _createReceipt(
        address buyer,
        address nftAddress,
        uint tokenId,
        uint price,
        address paymentMethod,
        uint rawValue,
        address seller
    ) internal {
        numReceipts++;
        receipts[numReceipts] = Receipt(
            buyer,
            nftAddress,
            tokenId,
            price,
            paymentMethod,
            rawValue,
            seller
        );
    }

    function readReceipt(
        uint index
    ) public view returns (Receipt memory receipt) {
        receipt = receipts[index];
    }

    /* *
     * @notice DO NOT IMPLEMENT/ SET TO PRIVATE JUST
     * INCASE I'M STUPID ENOUGH TO UNCOMMENT THESE FUNCTIONS
     *
     * @param index of receipt
     */
    // function _updateReceipt(uint index /*, etc, etc*/) private {}

    /* *
     * @notice DO NOT IMPLEMENT/ SET TO PRIVATE JUST
     * INCASE I'M STUPID ENOUGH TO UNCOMMENT THESE FUNCTIONS
     *
     * @param index of receipt
     */
    // function _destroyReceipt(uint index) private {
    //     delete receipts[index];
    // }
}
