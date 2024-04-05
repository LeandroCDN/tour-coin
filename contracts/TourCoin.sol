// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TourCoin is ERC20, ERC20Permit {
    constructor(address to) ERC20("TourCoin", "TRC") ERC20Permit("TourCoin") {
        _mint(to, 100000000 * 10 ** decimals());
    }
}