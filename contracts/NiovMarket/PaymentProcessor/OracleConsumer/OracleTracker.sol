// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title OracleTracker
 * @author github/ctnava || linkedin/ctnava || discord/cat.hemlock
 * @notice For keeping tabs on what oracle we use to fetch the price of the network's
 * native asset.
 */

abstract contract OracleTracker {
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    address private oracle;

    constructor(address _oracle) {
        oracle = _oracle;
    }

    /**
     * @notice Internal READ operation for oracle address
     * @return oracleAddress is a direct copy
     */
    function _readOracle() internal view returns (address oracleAddress) {
        oracleAddress = oracle;
    }

    /**
     * @notice Internal UPDATE operation for oracle address
     * @param newOracle Address of new Wrapped Token / USD Oracle for payment
     *
     * Emits  `OracleUpdated` Event
     */
    function _updateOracle(address newOracle) internal {
        address oldOracle = _readOracle();
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }
}
