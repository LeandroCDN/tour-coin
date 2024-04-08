// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lock is Ownable{
    uint public unlockTime;
    IERC721 public lpLockAddress;
    mapping(address => uint) public tokenIds;
    // address payable public owner;

    event Withdrawal(uint amount, uint when);

    constructor(address _lpLockAddress) payable Ownable(msg.sender){
        lpLockAddress = IERC721(_lpLockAddress);
    }

    function lockLP(uint _unlockTime,uint id) public onlyOwner{
         require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = block.timestamp + _unlockTime;
        tokenIds[msg.sender] = id;
        lpLockAddress.transferFrom(msg.sender, address(this), id);
    }

    function withdraw() public onlyOwner{
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        lpLockAddress.transferFrom(address(this),msg.sender, tokenIds[msg.sender]);

        emit Withdrawal(address(this).balance, block.timestamp);

        
    }
}
