// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

abstract contract Mintable20 is ERC20 {
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
