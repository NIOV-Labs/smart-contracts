// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {PaymentProcessor} from "./PaymentProcessor/PaymentProcessor.sol";

/**
 * @title NiovMarket
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice This is the main contract. Here you will find External functions that are NOT
 * related to commercial activity. Instead, these are functions for administrators (hence
 * the onlyOwner modifiers) and are not generally useful for the average user.
 *
 * Please check out `PaymentProcessor.sol` if you are looking for the external,
 * consumer-oriented interface.
 */

contract NiovMarket is PaymentProcessor, Ownable {
    constructor(
        address _oracle,
        address _nativeToken
    ) PaymentProcessor(_oracle, _nativeToken) Ownable(msg.sender) {}

    /**
     * @notice Internal READ operation for nativeToken address
     * @return nativeTokenAddress is a direct copy
     */
    function readNativeToken()
        external
        view
        returns (address nativeTokenAddress)
    {
        nativeTokenAddress = _readNativeToken();
    }

    // TODO @PROD ADD SAFETY CHECKS TO MAKE SURE IT'S ACTUALLY A TOKEN EVENTUALLY
    /**
     * @notice External UPDATE operation for nativeToken address
     * @param newToken Address of new Wrapped Token as a payment method
     *
     * Emits `NativeTokenUpdated` event
     * See './NativeTokenTracker.sol' for more details
     */
    function updateNativeToken(address newToken) external onlyOwner {
        _updateNativeToken(newToken);
    }

    // TODO @PROD ADD SAFETY CHECKS TO MAKE SURE IT'S ACTUALLY AN ORACLE EVENTUALLY
    /**
     * @notice External UPDATE operation for oracle address
     * @param newOracle Address of new Wrapped Token / USD Oracle for payment
     *
     * Emits  `OracleUpdated` Event
     * See './OracleTracker.sol' for more details
     */
    function updateOracle(address newOracle) external onlyOwner {
        _updateOracle(newOracle);
    }

    /**
     * @notice External READ operation for oracle address
     * @return oracleAddress is a direct copy
     */
    function readOracle() external view returns (address oracleAddress) {
        oracleAddress = _readOracle();
    }
}
