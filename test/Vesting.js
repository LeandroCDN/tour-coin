const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const amounts = ['100000000000000000000','200000000000000000000', '300000000000000000000', '400000000000000000000'];
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("Vesting", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  

  async function deployUserFixture() {
    // Contracts are deployed using the first signer/account by default
    const [userA, userB, userC, userD, userE] = await ethers.getSigners();
    return { userA, userB, userC, userD, userE};  
  }
  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [tokenOwner, otherAccount] = await ethers.getSigners();

    const TourCoin = await ethers.getContractFactory("TourCoin");
    const tourCoin = await TourCoin.deploy(tokenOwner.address);

    return { tourCoin, tokenOwner, otherAccount };
  }

  async function deployVestingFixture() {
    const [vestingOwner, otherAccount] = await ethers.getSigners();
    const { tourCoin } = await loadFixture(deployTokenFixture);
    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(tourCoin.target, 12, vestingOwner.address);
  
    return { vesting, vestingOwner, otherAccount, tourCoin };
  }

  async function fundContractAndInitializeFixture(){
    const { tourCoin, vesting, otherAccount } = await loadFixture(deployVestingFixture);
    const { userA, userB, userC, userE, } = await loadFixture(deployUserFixture);
    const ONE_DAY_IN_SECONDS = ((await time.latest())) + 86400;
    const ONE_MONTH_IN_SECONDS = (86401 * 30);
    const ONE_YEAR_IN_SECONDS =((await time.latest())) + (86401 * 360);

    await vesting.resgisterVesting([userA.address,userB.address,userC.address, userE.address],amounts);
    const totalAmountTransfer = await vesting.totalCurrency();
    await tourCoin.transfer(vesting.target, totalAmountTransfer);
    expect(await vesting.initializeVesting()).not.be.reverted;
    return {vesting, tourCoin, otherAccount, ONE_DAY_IN_SECONDS, ONE_MONTH_IN_SECONDS ,userA, userB, userC, userE};
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
    //todo: test with vestingstatus = true
    it("should be revert with the right error when addrest lenth != amounts.length", async function(){
      const { vesting } = await loadFixture(deployVestingFixture); 
      const { userA, userB, userC} = await loadFixture(deployUserFixture);
       
      await expect(vesting.resgisterVesting([userA.address,userB.address,userC.address],amounts)).to.be.revertedWith(
        "lenght no match"
      );
    });
    it("Requiere accounts[i] != address(0)", async function(){
      const { vesting } = await loadFixture(deployVestingFixture); 
      const { userA, userB, userC} = await loadFixture(deployUserFixture);
       
      await expect(vesting.resgisterVesting([userA.address,userB.address,userC.address, ZERO_ADDRESS],amounts)).to.be.revertedWith(
        "address 0"
      );
    });
    it("Shouldn't be reverted when owner call with same arrays lenghts and no zero address", async function(){
      const { vesting} = await loadFixture(deployVestingFixture); 
      const { userA, userB, userC, userD} = await loadFixture(deployUserFixture);
       
      expect(await vesting.resgisterVesting([userA.address,userB.address,userC.address, userD.address],amounts)).not.to.be.reverted;
    });

    it("Contract state post write", async function(){
      const { vesting} = await loadFixture(deployVestingFixture); 
      const { userA, userB, userC, userD} = await loadFixture(deployUserFixture);
      await vesting.resgisterVesting([userA.address,userB.address,userC.address, userD.address],amounts);

      expect(await vesting.totalAmounts(userA.address)).to.equal(amounts[0]);
      expect(await vesting.totalAmounts(userB.address)).to.equal(amounts[1]);
      expect(await vesting.totalAmounts(userC.address)).to.equal(amounts[2]);
      expect(await vesting.totalAmounts(userD.address)).to.equal(amounts[3]);
      // todo totalCurrency
    });
    it(" Write same address both times", async function(){
      const { vesting} = await loadFixture(deployVestingFixture); 
      const { userA, userC} = await loadFixture(deployUserFixture);
      await vesting.resgisterVesting([userA.address,userA.address,userC.address, userA.address],amounts);
      const totalAmountUserA = parseInt(amounts[0]) + parseInt(amounts[1]) + parseInt(amounts[3])
      expect(await vesting.totalAmounts(userA.address)).to.equal(totalAmountUserA.toString());
      expect(await vesting.totalAmounts(userC.address)).to.equal(amounts[2]);
    });
  });

  describe("Owner functions", function (){
    it("removeAccounts", async function(){
      const { vesting} = await loadFixture(deployVestingFixture); 
      const { userA, userC} = await loadFixture(deployUserFixture);
      await vesting.resgisterVesting([userA.address,userA.address,userC.address, userA.address],amounts);
      expect(await vesting.removeAccounts(userA.address)).not.to.be.reverted;
      expect(await vesting.totalAmounts(userA.address)).to.equal(0);
      await vesting.resgisterVesting([userA.address,userA.address,userC.address, userA.address],amounts);
      // todo: test with start vesting 
    });
    it("should't be revert when call ChangeInterval before start vesting", async function(){
      const { vesting} = await loadFixture(deployVestingFixture); 
      const intervalBeforaChange = await vesting.interval();
      expect(intervalBeforaChange).to.equal(2592000);
      expect(await vesting.changeInterval(10000)).not.be.reverted;
      expect(await vesting.interval()).to.equal(10000);
    });
    it("initializeVesting", async function(){
      const { vesting, tourCoin} = await loadFixture(deployVestingFixture); 
      expect(await tourCoin.balanceOf(vesting.target)).to.equal(0);
      const { userA, userB, userC, userD} = await loadFixture(deployUserFixture);
      
      expect(await vesting.resgisterVesting([userA.address,userB.address,userC.address, userD.address],amounts)).not.to.be.reverted;
      // initialize Vesting fun: 
      await expect( vesting.initializeVesting()).to.be.revertedWith(
        "Not enough balance"
      );
      const totalAmountTransfer = await vesting.totalCurrency();
      await tourCoin.transfer(vesting.target, totalAmountTransfer);

      expect(await vesting.initializeVesting()).not.be.reverted;
      expect(await tourCoin.balanceOf(vesting.target)).to.equal(totalAmountTransfer);
      await expect( vesting.initializeVesting()).to.be.revertedWith(
        "Only when Vesting was not initialized"
      );
    });
  });

  describe("claimTokens", function (){
    it("should revert when claim before timeintervals", async function(){
      const {vesting, otherAccount} = await loadFixture(fundContractAndInitializeFixture);
      await expect( vesting.connect(otherAccount).claimTokens()).to.be.revertedWith(
        "Error: next claim instance not available yet"
      );
    });

    it("Claim after intervals", async function(){
      const {vesting, tourCoin, ONE_MONTH_IN_SECONDS, userE} = await loadFixture(fundContractAndInitializeFixture);
      expect(await tourCoin.balanceOf(userE)).to.equal(0)
      
      for (let i = 0; i < 12; i++){
        await time.increase(ONE_MONTH_IN_SECONDS);
        expect(await vesting.connect(userE).claimTokens()).not.be.reverted;
      }
      expect(await tourCoin.balanceOf(userE)).to.equal("399999999999999999996"); //amounts[3] - 4 wei
      
      await time.increase(ONE_MONTH_IN_SECONDS);
      await expect( vesting.connect(userE).claimTokens()).to.be.revertedWith(
        'all tokens claimed'
      );
    }); 

    it("claim all months in time", async function(){
      const {vesting, tourCoin, ONE_MONTH_IN_SECONDS, userE} = await loadFixture(fundContractAndInitializeFixture);
      expect(await tourCoin.balanceOf(userE)).to.equal(0)
      await time.increase(ONE_MONTH_IN_SECONDS * 12);
      
      for (let i = 0; i < 12; i++){
        expect(await vesting.connect(userE).claimTokens()).not.be.reverted;
      }
      expect(await tourCoin.balanceOf(userE)).to.equal("399999999999999999996"); //amounts[3] - 4 wei
      
    });

    it("claim all months after", async function(){
      const {vesting, tourCoin, ONE_MONTH_IN_SECONDS, userE} = await loadFixture(fundContractAndInitializeFixture);
      expect(await tourCoin.balanceOf(userE)).to.equal(0)
      await time.increase(ONE_MONTH_IN_SECONDS * 24);
      
      for (let i = 0; i < 12; i++){
        expect(await vesting.connect(userE).claimTokens()).not.be.reverted;
      }
      expect(await tourCoin.balanceOf(userE)).to.equal("399999999999999999996"); //amounts[3] - 4 wei
      
    });
  });

  // describe("Events", function () {
  //   it("Should emit an event on ResgisterVesting", async function () {})
  //   it("Should emit an event on SetCurrency", async function () {})
  //   it("Should emit an event on RemoveAccounts", async function () {})
  //   it("Should emit an event on ChangeInterval", async function () {})
  //   it("Should emit an event on InitializeVesting", async function () {})
  //   it("Should emit an event on ClaimTokens", async function () {})
  // })

  // describe("Transfers", function () {
  //   it("Should transfer the funds to the correct address", async function () {

  //   })
  // });

  
});
