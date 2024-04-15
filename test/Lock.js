const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployLockFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    //1: deploy lpMock
    const LpMock = await ethers.getContractFactory("LP");
    const lpMock = await LpMock.deploy();

    //2: deploy LpLock with lpMock.tarjet
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(lpMock.target);

    //3: send 1 lpMock to otherAccount
    await lpMock.safeMint(otherAccount.address);
    expect(await lpMock.balanceOf(otherAccount.address)).to.equal(1);

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const EPOC = ((await time.latest()));
    
    return { lpMock, lock, owner, otherAccount, ONE_YEAR_IN_SECS,EPOC };
  }

  describe("Deployment", function () {
    it("Should set the right lpLockAddress", async function () {
      const {lpMock, lock} = await loadFixture(deployLockFixture);
      expect(await lock.lpLockAddress()).to.equal(lpMock.target);
    });
    
    it("Should set the right owner", async function () {
      const {lock, owner} = await loadFixture(deployLockFixture);
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Lp balance should be zero", async function () {
      const {lpMock, lock} = await loadFixture(deployLockFixture);
      expect(await lpMock.balanceOf(lock.target)).to.equal(0);
    });
  });
  describe("Deposits", function(){
    describe("Validations", function(){
      it("Should REVERT with the right error if called with wrong time", async function () {
        const {lock} = await loadFixture(deployLockFixture);
        await expect( lock.lockLp(0,0)).to.be.revertedWith(
          "Unlock time should be in the future"
        );
      });

      it("Should REVERT if called with wrong address", async function () {
        const {lock, otherAccount} = await loadFixture(deployLockFixture);
        await expect( lock.lockLp(0,0)).to.be.reverted;
      });

      it("Should REVERT  if caller dont have the id  ", async function () {
        const {lock, otherAccount, EPOC} = await loadFixture(deployLockFixture);
        await expect( lock.lockLp(EPOC+100,0)).to.be.reverted;
      });
      it("Shouldn't REVERT with the right params ", async function () {
        const {lock, lpMock, owner ,EPOC} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);
         
        expect(await lock.lockLp(EPOC+100,1)).not.be.reverted;
        expect(await lpMock.balanceOf(lock.target)).to.equal(1);
        expect(await lpMock.balanceOf(owner.address)).to.equal(0);
      });
      it("Should REVERT with the right error if deposit call two times", async function () {
        const {lock, lpMock, owner ,EPOC} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);
         
        expect(await lock.lockLp(EPOC+100,1)).not.be.reverted;
        expect(await lpMock.balanceOf(lock.target)).to.equal(1);
        expect(await lpMock.balanceOf(owner.address)).to.equal(0);
        await expect( lock.lockLp(EPOC+200,0)).to.be.revertedWith(
          "anhoterLock is working"
        );
      });
    });
    describe("Events", function(){
      it("Should emit an event on deposits", async function () {
        const {lock, lpMock, owner ,EPOC} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);

        await expect(lock.lockLp(100,1))
          .to.emit(lock, "LockLp")
          .withArgs(1, anyValue, await time.latest()+101
        ); // We accept any value as `when` arg
         
        expect(await lpMock.balanceOf(lock.target)).to.equal(1);
        expect(await lpMock.balanceOf(owner.address)).to.equal(0);
      });
    });
    
  })

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const {lock, lpMock, owner ,EPOC} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);
        expect(await lock.lockLp(EPOC+100,1)).not.be.reverted;

        await expect( lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert if called from another account", async function () {
        const {lock, lpMock, owner ,EPOC, otherAccount} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);
        expect(await lock.lockLp(EPOC+100,1)).not.be.reverted;
        await time.increase(EPOC+200);
        await expect( lock.connect(otherAccount).withdraw()).to.be.reverted;
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const {lock, lpMock, owner ,EPOC, otherAccount} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        expect(await lpMock.balanceOf(lock.target)).to.equal(0);
        await lpMock.approve(lock.target,1);
        await expect( lock.lockLp(EPOC+100,1)).not.be.reverted;
        expect(await lpMock.balanceOf(lock.target)).to.equal(1);
        expect(await lpMock.balanceOf(owner.address)).to.equal(0);
        await time.increase(EPOC+200);
        expect(await lock.withdraw()).not.be.reverted;
        expect(await lpMock.balanceOf(lock.target)).to.equal(0);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);

      });
    });

    describe("Events", function () {
      it("Should emit an event on withdraws", async function () {
        const {lock, lpMock, owner ,EPOC, otherAccount} = await loadFixture(deployLockFixture);
        await lpMock.safeMint(owner.address);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
        await lpMock.approve(lock.target,1);
        expect(await lock.lockLp(EPOC+100,1)).not.be.reverted;
        await time.increase(EPOC+200);
        // await expect( lock.withdraw()).not.be.reverted;
        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(1, anyValue,
        );
        expect(await lpMock.balanceOf(lock.target)).to.equal(0);
        expect(await lpMock.balanceOf(owner.address)).to.equal(1);
      });
    });

    // describe("Transfers", function () {
    //   it("Should transfer the funds to the owner", async function () {
    //     const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     await time.increaseTo(unlockTime);

    //     await expect(lock.withdraw()).to.changeEtherBalances(
    //       [owner, lock],
    //       [lockedAmount, -lockedAmount]
    //     );
    //   });
    // });
  });
});
