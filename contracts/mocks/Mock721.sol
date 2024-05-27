// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../tokens/Mintable721.sol";

// Contract by github/ctnava || linkedin/ctnava || discord/cat.hemlock

contract ExpensiveJpeg is Mintable721 {
    constructor()
        Mintable721(
            "Expensive JPEG",
            "$JPG",
            "ipfs://QmQvYD4LqDdB8gMaVh7vzGfBmApv1kdfGmToQ2B3t2QsU1"
        )
    {}
}

contract NiftyTrash is Mintable721 {
    constructor()
        Mintable721(
            "Nifty Trash",
            "TRASH",
            "ipfs://QmQvYD4LqDdB8gMaVh7vzGfBmApv1kdfGmToQ2B3t2QsU1"
        )
    {}
}

contract WrappedFortniteSkins is Mintable721 {
    constructor()
        Mintable721(
            "Wrapped Fortnite Skins",
            "4SKINZ",
            "ipfs://QmQvYD4LqDdB8gMaVh7vzGfBmApv1kdfGmToQ2B3t2QsU1"
        )
    {}
}

contract UnsolicitedDickPics is Mintable721 {
    constructor()
        Mintable721(
            "Unsolicited Dick Pics",
            "DIX",
            "ipfs://QmQvYD4LqDdB8gMaVh7vzGfBmApv1kdfGmToQ2B3t2QsU1"
        )
    {}
}
