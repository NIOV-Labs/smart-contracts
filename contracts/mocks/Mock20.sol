// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

abstract contract Mock20Base is ERC20 {
    uint private standardAmount = 10000 * 10 ** decimals();

    function quickMint() public returns (bool) {
        uint expected = totalSupply() + standardAmount;
        _mint(msg.sender, standardAmount);

        return (expected == totalSupply());
    }

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {}
}

contract WETH9 is Mock20Base {
    constructor() Mock20Base("Wrapped Ether", "WETH") {}
}

contract WMATIC is Mock20Base {
    constructor() Mock20Base("Wrapped Matic", "WMATIC") {}
}

contract BlessUpToken is Mock20Base {
    constructor() Mock20Base("Bless Up", "COINYE") {}
}

contract MoneyLaundryToken is Mock20Base {
    constructor() Mock20Base("Most Definitely Not Money Laundry", "DIRTY$") {}
}

contract FungedNFTToken is Mock20Base {
    constructor() Mock20Base("Funged Non-Fungible Token Tokens", "F-NFT") {}
}

contract MintyFreshToken is Mock20Base {
    constructor() Mock20Base("Minty Fresh", "MINTY") {}
}
