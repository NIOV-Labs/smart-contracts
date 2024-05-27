// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract EthereumLinkSim is AggregatorV3Interface {
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function description() public pure override returns (string memory) {
        return "ETH / USD";
    }

    function version() public pure override returns (uint256) {
        return 42069;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(
        uint80 _roundId
    )
        public
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = _roundId;
        startedAt = 2;
        updatedAt = 3;
        answeredInRound = 4;
        _roundId++;
        answer = 4096 * (10 ** 8); // $4096
    }

    function latestRoundData()
        public
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = 1;
        startedAt = 2;
        updatedAt = 3;
        answeredInRound = 4;
        answer = 4096 * (10 ** 8); // $4096
    }
}

contract PolygonLinkSim is AggregatorV3Interface {
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function description() public pure override returns (string memory) {
        return "MATIC / USD";
    }

    function version() public pure override returns (uint256) {
        return 42069;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(
        uint80 _roundId
    )
        public
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = _roundId;
        startedAt = 2;
        updatedAt = 3;
        answeredInRound = 4;
        _roundId++;
        answer = 2 * (10 ** 8); // $2
    }

    function latestRoundData()
        public
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = 1;
        startedAt = 2;
        updatedAt = 3;
        answeredInRound = 4;
        answer = 2 * (10 ** 8); // $2
    }
}
