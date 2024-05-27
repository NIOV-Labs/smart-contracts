// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title ProceedsManager
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice Meant to track and distribute the gas proceeds of sales made through
 * this contract. See `Push over Pull` Solidity Pattern for more details.
 * Data is manipulated with internal CRUD functions. The data is meant to be
 * manipulated outside of this abstract (see `PaymentProcessor.sol`).
 */

abstract contract ProceedsManager {
    mapping(address => uint) private proceeds;

    /* *
     * @notice Internal CREATE operation for proceeds mapping
     * @param seller Address of seller
     * @param amount Amount to set proceeds
     *
     * DO NOT IMPLEMENT!
     * I SET TO PRIVATE JUST INCASE I'M STUPID ENOUGH TO UNCOMMENT THIS FUNCTION
     */
    // function _createProceeds(address seller, uint amount) private {
    //     proceeds[seller] = amount;
    // }

    /**
     * @notice Internal READ operation for proceeds mapping
     * @param seller Address of seller
     * @return amount is the raw value of gas that can be redeemed.
     */
    function _readProceeds(address seller) internal view returns (uint amount) {
        amount = proceeds[seller];
    }

    /**
     * @notice Internal UPDATE operation for proceeds mapping
     * @param seller Address of seller
     * @param amount Amount to add to proceeds
     */
    function _updateProceeds(address seller, uint amount) internal {
        proceeds[seller] += amount;
    }

    /**
     * @notice Internal DESTROY operation for proceeds mapping
     * @param seller Address of seller
     *
     * Slight gas rebate on delete method
     */
    function _destroyProceeds(address seller) internal {
        delete proceeds[seller];
    }
}
