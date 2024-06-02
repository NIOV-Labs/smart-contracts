// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import {Mintable20} from "../tokens/Mintable20.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract WETH9 is Mintable20 {
    constructor() Mintable20("Wrapped Ether", "WETH") {}
}

contract WMATIC is Mintable20 {
    constructor() Mintable20("Wrapped Matic", "WMATIC") {}
}

contract BlessUpToken is Mintable20 {
    constructor() Mintable20("Bless Up", "COINYE") {}
}

contract MoneyLaundryToken is Mintable20 {
    constructor() Mintable20("Most Definitely Not Money Laundry", "DIRTY$") {}
}

contract FungedNFTToken is Mintable20 {
    constructor() Mintable20("Funged Non-Fungible Token Tokens", "F-NFT") {}
}

contract MintyFreshToken is Mintable20 {
    constructor() Mintable20("Minty Fresh", "MINTY") {}
}
