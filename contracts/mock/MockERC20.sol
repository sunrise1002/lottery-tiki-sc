// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() public ERC20("Mock ERC20", "MERC20") {
        _mint(address(this), 1000000 * (10 ** uint256(decimals())));
    }

    event ClaimToken (
        address indexed claimer
    );

    function claimMockToken() public {
        _transfer(address(this), msg.sender, 100 * (10 ** uint256(decimals())));

        emit ClaimToken(msg.sender);
    }
}
