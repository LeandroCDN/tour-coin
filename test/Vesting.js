const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Vesting", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [tokenOwner, otherAccount] = await ethers.getSigners();

    const TourCoin = await ethers.getContractFactory("TourCoin");
    const tourCoin = await TourCoin.deploy(tokenOwner.address);

    return { tourCoin, tokenOwner, otherAccount };
  }

  async function deployVestingFixture(tourCoinAddress, maxClaims) {
    const [vestingOwner, otherAccount] = await ethers.getSigners();
    const { tourCoin } = await loadFixture(deployTokenFixture);
    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(tourCoin.target, 12, vestingOwner.address);
  
    return { vesting, vestingOwner, otherAccount, tourCoin };
  }

  describe("Deployment", function () {
    it("Should set the right owner token", async function () {
      const { tourCoin } = await loadFixture(deployTokenFixture);
      expect(await tourCoin.decimals()).to.equal(18);
    });

    it("Should set the right owner Vesting", async function () {      
      const { vesting, vestingOwner, tourCoin } = await loadFixture(deployVestingFixture); 
      expect(await vesting.owner()).to.equal(vestingOwner.address);
      expect(await tourCoin.decimals()).to.equal(18);
    });

    // it("Deploy contract state",async function(){
    //   //todo
    // } )
  });

  describe("Register Vesting", function (){
    it("Requiere accounts.length == amount.length", async function(){
      
    });
    it("Requiere accounts[i] != address(0)", async function(){

    });
    it("contract state post write", async function(){

    });
    it(" write same address both times", async function(){

    });
  });
  describe("Owner functions", function (){
    it("removeAccounts", async function(){
      
    });
    it("changeInterval", async function(){

    });
    it(" initializeVesting", async function(){

    });
  });
  describe("claimTokens", function (){
    it("claim before timeintervals", async function(){
      
    });
    it("claim after intervals", async function(){

    });
    it("claim all months in time", async function(){

    });
    it("claim several months in time", async function(){

    });
    it("claim all months after", async function(){

    });
    it("claim maxClaims and more after/before", async function(){

    });
  });

  describe("Events", function () {
    it("Should emit an event on ResgisterVesting", async function () {})
    it("Should emit an event on SetCurrency", async function () {})
    it("Should emit an event on RemoveAccounts", async function () {})
    it("Should emit an event on ChangeInterval", async function () {})
    it("Should emit an event on InitializeVesting", async function () {})
    it("Should emit an event on ClaimTokens", async function () {})
  })

  describe("Transfers", function () {
    it("Should transfer the funds to the correct address", async function () {

    })
  });

  
});
