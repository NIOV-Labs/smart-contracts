// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./Mintable721.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract NiovLigandToken is Mintable721 {
    constructor()
        Mintable721(
            "Niov Ligand Token",
            "NLT",
            "http://localhost:3000/api/ligand/"
        )
    {}
}
