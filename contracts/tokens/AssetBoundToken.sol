// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Mintable721.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract AssetBoundToken is Mintable721 {
    constructor()
        Mintable721(
            "Asset Bound Token",
            "ABT",
            "https://beta.niovlabs.io/api/token/"
        )
    {}
}
