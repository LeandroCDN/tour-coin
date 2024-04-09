// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lock is Ownable{
    uint public unlockTime;
    IERC721 public lpLockAddress;
    mapping(address => uint) public tokenIds;

    event Withdrawal(uint amount, uint when);
    event LockLp(uint id, uint whenStarted, uint whenWithdraw);

    constructor(address _lpLockAddress) payable Ownable(msg.sender){
        lpLockAddress = IERC721(_lpLockAddress);
    }

    function lockLp(uint _unlockTime,uint id) public onlyOwner{
        require(
            block.timestamp < (block.timestamp + _unlockTime),
            "Unlock time should be in the future"
        );
        require(unlockTime == 0, "anhoterLock is working");

        unlockTime = block.timestamp + _unlockTime;
        tokenIds[msg.sender] = id;
        lpLockAddress.transferFrom(msg.sender, address(this), id);
        emit LockLp(id, block.timestamp, unlockTime);
    }
    //todo: token id tokenIds[msg.sender]
    function withdraw() public onlyOwner{
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        lpLockAddress.transferFrom(address(this),msg.sender, tokenIds[msg.sender]);
        emit Withdrawal(tokenIds[msg.sender], block.timestamp);
    }
}
