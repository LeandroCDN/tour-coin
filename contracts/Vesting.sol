// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
* @title : Vesting
* @author: @LenLabiano
* @notice: a vesting contract for youtube tutorial
*/
contract Vesting is Ownable {
  bool public stateVesting;
  uint public startVesting;
  uint public interval = 30 days; //30 days in seconds
  uint public totalCurrency;
  uint8 public maxClaims;
  
  IERC20 public currency;
  mapping(address => uint) public totalAmounts;
  mapping(address => uint) public totalClaims;

  event ResgisterVesting(uint tokenAmount, uint accountAmount);
  event SetCurrency(address newCurrency);
  event RemoveAccounts(address account);
  event ChangeInterval(uint intervalInSconds);
  event InitializeVesting(uint timeStamp);
  event ClaimTokens(address from, uint amount, uint count);

  constructor(address currency_, uint8 maxClaims_, address newOwner) Ownable(newOwner){
    require(currency_ != address(0), "Must be a token address");
    currency = IERC20(currency_);
    maxClaims = maxClaims_;
  }

  modifier beforeVestingStart() {
    require(!stateVesting, "Only when Vesting was not initialized"); 
    _;
  }

  /*
  ** @dev: owner can register accounts before start vesting. If one address appers twice, 
  ** the ammount is added
  ** @param accounts: List of account in vesting
  ** @param amounts: Amount of total vesting for each account
  */
  function resgisterVesting(address[] memory accounts, uint[] memory amounts) public  onlyOwner beforeVestingStart(){
    
    uint length = accounts.length;
    require(length == amounts.length, "lenght no match");

    uint totalCurrency_;

    for(uint i; i <length;){
      require(accounts[i] != address(0), "address 0");

      totalCurrency_ +=amounts[i];
      totalAmounts[accounts[i]] += amounts[i];
      unchecked {
        ++i;
      }
    }
    totalCurrency += totalCurrency_;
    emit ResgisterVesting(totalCurrency_, accounts.length);
  }

  function setCurrency(IERC20 currency_) public onlyOwner beforeVestingStart(){
    currency = currency_;
    emit SetCurrency(address(currency));
  }

  function removeAccounts(address account) public onlyOwner beforeVestingStart(){
    totalCurrency -= totalAmounts[account];
    totalAmounts[account] = 0; 
    emit RemoveAccounts(account);
  }

  function changeInterval(uint intervalInSconds) public onlyOwner beforeVestingStart(){
    interval = intervalInSconds;
    emit ChangeInterval(intervalInSconds);
  }

  function initializeVesting() public onlyOwner beforeVestingStart(){
    require(currency.balanceOf(address(this)) >= totalCurrency, "Not enough balance");
    stateVesting = true;
    startVesting = block.timestamp;
    emit InitializeVesting(startVesting);
  }

  function claimTokens() external {
    require(stateVesting, "Vesting not started yet");
    address user = msg.sender;
    uint amount = totalAmounts[user];
    uint currentClaim = totalClaims[user]++; 
    require(amount > 0);
    require(block.timestamp >= startVesting + interval * ( currentClaim + 1), "Error: next claim instance not available yet");
    require(currentClaim < maxClaims, "all tokens claimed");
    uint totalAmount = amount/maxClaims;

    currency.transfer(user, totalAmount);
    emit ClaimTokens(user, totalAmount, currentClaim);
  }
}
