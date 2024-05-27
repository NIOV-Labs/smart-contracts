// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {OracleTracker} from "./OracleTracker.sol";
import {NativeTokenTracker} from "./NativeTokenTracker.sol";

/**
 * @title OracleConsumer
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice Internal calculator functions for pricefeed conversions needed by the marketplace.
 * These functions leverage the addresses managed by `NativeTokenTracker` & `OracleTracker`
 * contracts.
 */

abstract contract OracleConsumer is NativeTokenTracker, OracleTracker {
    constructor(
        address _oracle,
        address _nativeToken
    ) OracleTracker(_oracle) NativeTokenTracker(_nativeToken) {}

    /**
     * @notice Method for turning $/ETH to ETH/$
     * @param decimals decimals of the asset to be used as payment (gas or ERC20)
     * @return tokensPerUnit is returned as a raw uint with respect to decimals
     * e.g.
     * If the current price of ETH is      $4096.00 per ETH
     * the corresponding oracle answers     4096 * (10 ** 8)
     * therefore, tokensPerUnit should be   00000244140625000000
     * or, if translated appropriately,     0.000244140625000000 ETH per $
     */
    function _calculatePerUnitQuote(
        uint decimals
    ) private view returns (uint tokensPerUnit) {
        AggregatorV3Interface orcl = AggregatorV3Interface(_readOracle());

        // Get the exponent for the oracle price and token decimals
        uint orclExp = 10 ** orcl.decimals();
        uint tokenExp = 10 ** decimals;

        // Fetch the latest price from the oracle
        (, int price, , , ) = orcl.latestRoundData();
        uint orclPrice = uint(price);

        // Calculate scaling factor between token decimals and oracle decimals
        uint scalingFactor = tokenExp * orclExp;

        // Calculate tokens per unit (ETH per USD)
        // This converts the oracle price to the number of tokens (ETH) per 1 USD
        tokensPerUnit = (scalingFactor / orclPrice);
    }

    /**
     * @notice Method for turning getting a quote on the penny price
     * @param pennyValue we are treating USD as a token with 2 decimals of precision
     * @param tokenAddress Address of payment method (address(0) if using gas)
     * @return amount is returned as a raw value to be sent for payment
     * e.g.
     * If the current price of ETH is      $4096.00 per ETH
     * and the raw price of an item is      409600
     * then the raw value quote should be   1E18 (or 1 whole ETH)
     * assuming you're paying in gas or the token address has 18 decimals
     */
    function _calculatePerAssetQuote(
        uint pennyValue,
        address tokenAddress
    ) internal view returns (uint amount) {
        uint decimals = tokenAddress == address(0)
            ? 18
            : IERC20Metadata(tokenAddress).decimals();
        amount = (pennyValue * _calculatePerUnitQuote(decimals)) / 100;
    }

    /**
     * @notice Internal function for calculating the needed amount of tokens for transactions
     * @param price price of asset in pennies
     * @param isGas if true, user pays in gas. if false, user pays in wrapped native tokens
     * @return amount raw value required for transaction
     */
    function _calculateRequiredValue(
        uint price,
        bool isGas
    ) internal view returns (uint amount) {
        address paymentMethod = isGas ? address(0) : _readNativeToken();
        amount = _calculatePerAssetQuote(price, paymentMethod);
    }

    /**
     * @notice External function for calculating the usdPennyPrice
     * @param rawGasValue amount of wei (ETH)
     * @return usdPennyAmount how many pennies you would need to match that amount
     * of raw Ethereum value.
     */
    function _backConversion(
        uint rawGasValue
    ) internal view returns (uint usdPennyAmount) {
        uint tokensPerDollar = _calculatePerUnitQuote(18);
        uint usdAmount = (rawGasValue * 1e18) / tokensPerDollar;
        // Since usdAmount is in 1e18, we divide by 1e16 to get pennies
        usdPennyAmount = usdAmount / 1e16;
    }
}
