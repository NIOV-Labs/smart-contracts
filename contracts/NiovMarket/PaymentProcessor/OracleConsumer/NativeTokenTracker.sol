// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title NativeTokenTracker
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice For keeping tabs on what we want to accept as "wrapped
 * gas". (e.g. Address of WETH9 contract on Ethereum or WMATIC on
 * Polygon) It only has internal UPDATE operations and shouldn't
 * need to be touched often. (see `NiovMarket.sol`)
 */

abstract contract NativeTokenTracker {
    event NativeTokenUpdated(
        address indexed oldToken,
        address indexed newToken
    );

    address private nativeToken;

    constructor(address _nativeToken) {
        nativeToken = _nativeToken;
    }

    /**
     * @notice Internal READ operation for nativeToken address
     * @return nativeTokenAddress is a direct copy
     */
    function _readNativeToken()
        internal
        view
        returns (address nativeTokenAddress)
    {
        nativeTokenAddress = nativeToken;
    }

    /**
     * @notice Internal UPDATE operation for nativeToken address
     * @param newToken Address of new Wrapped Token as a payment method
     *
     * Emits `NativeTokenUpdated` event
     */
    function _updateNativeToken(address newToken) internal {
        address oldToken = _readNativeToken();
        nativeToken = newToken;
        emit NativeTokenUpdated(oldToken, newToken);
    }
}
