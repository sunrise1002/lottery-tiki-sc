/* eslint-disable no-unused-expressions */

const { use, expect } = require("chai");
const { BigNumber } = require("ethers");
const { solidity } = require("ethereum-waffle");
const { ethers, upgrades } = require("hardhat");

use(solidity);

const toBN = (n) => BigNumber.from(n);
const expandTo18Decimals = (x) =>
  BigNumber.from(x).mul(BigNumber.from(10).pow(18));

describe("Lottery testing:", () => {
  let token, lottery, dealer, player1, player2, player3, player4, player5;

  const betAmount = expandTo18Decimals(100);

  beforeEach(async () => {
    [dealer, player1, player2, player3, player4, player5] =
      await ethers.getSigners();

    // Contract deployment
    const Token = await ethers.getContractFactory("MockERC20", dealer);
    token = await Token.deploy();
    await token.deployed();

    const lotteryContract = await ethers.getContractFactory("Lottery", dealer);
    lottery = await upgrades.deployProxy(lotteryContract, [
      token.address,
      betAmount,
      4,
    ]);
    await lottery.deployed();

    // Grant role
    const DEALER = await lottery.DEALER();
    await lottery.grantRole(DEALER, dealer.address);

    // Setup balance
    for (const account of [
      dealer,
      player1,
      player2,
      player3,
      player4,
      player5,
    ]) {
      await token.connect(account).claimMockToken();
      await token.connect(account).approve(lottery.address, betAmount);
    }
  });

  describe("Bet a number", () => {
    it("Dealer can not bet", async () => {
      await expect(lottery.connect(dealer).bet(10)).to.be.revertedWith(
        "Dealer can not be a player"
      );
    });

    it("Invalid bet number", async () => {
      await expect(lottery.connect(player1).bet(100)).to.be.revertedWith(
        "Invalid bet number"
      );
    });

    it("Player has already bet", async () => {
      await lottery.connect(player1).bet(10);
      await expect(lottery.connect(player1).bet(11)).to.be.revertedWith(
        "Player has already bet"
      );
    });

    it("Number players exceeded", async () => {
      await lottery.connect(player1).bet(1);
      await lottery.connect(player2).bet(2);
      await lottery.connect(player3).bet(3);
      await lottery.connect(player4).bet(4);
      await expect(lottery.connect(player5).bet(5)).to.be.revertedWith(
        "Number players exceeded"
      );
    });

    it("Game stopped", async () => {
      await lottery.connect(player1).bet(1);
      await lottery.connect(dealer).stopGame();
      await expect(lottery.connect(player2).bet(2)).to.be.revertedWith(
        "The game stopped"
      );
    });

    it("Bet success", async () => {
      const playerBalanceBeforeBet = await token.balanceOf(player1.address);
      expect(playerBalanceBeforeBet).to.be.equal(
        betAmount,
        `Expect player balance before bet to be equal ${betAmount}`
      );

      await lottery.connect(player1).bet(1);

      const playerBalanceAfterBet = await token.balanceOf(player1.address);
      const lotteryBalance = await token.balanceOf(lottery.address);
      expect(playerBalanceAfterBet).to.be.equal(
        toBN(0),
        `Expect player balance after bet to be equal 0`
      );
      expect(lotteryBalance).to.be.equal(
        betAmount,
        `Expect lottery balance to be equal ${betAmount}`
      );
    });
  });

  describe("Stop the game", () => {
    it("Not dealer", async () => {
      await expect(lottery.connect(player1).stopGame()).to.be.revertedWith(
        "Not dealer"
      );
    });

    it("Game stopped", async () => {
      await lottery.connect(dealer).stopGame();
      await expect(lottery.connect(dealer).stopGame()).to.be.revertedWith(
        "The game stopped"
      );
    });

    it("Stop game success with 0 winner", async () => {
      await lottery.connect(player1).bet(1);
      await lottery.connect(dealer).stopGame();

      const currentBlock = await ethers.provider.getBlock("latest");
      const lotteryResultNumber = await lottery.lotteryResult();
      expect(toBN(currentBlock.number % 100)).to.be.equal(
        lotteryResultNumber,
        "Expect correct lottery result"
      );

      const dealerBalance = await token.balanceOf(dealer.address);
      expect(dealerBalance).to.be.equal(
        betAmount.mul(2),
        "Expect the dealer to get all reward"
      );
    });

    it("Stop game success with 1 winner", async () => {
      await lottery.connect(player1).bet(72);
      await lottery.connect(dealer).stopGame();

      const dealerBalance = await token.balanceOf(dealer.address);
      const doesPlayer1Win = await lottery.isWinner(player1.address);

      expect(dealerBalance).to.be.above(
        expandTo18Decimals(100),
        "Expect the dealer to get fee"
      );

      expect(doesPlayer1Win).to.be.true;
    });

    it("Stop game success with 2 winner", async () => {
      await lottery.connect(player1).bet(90);
      await lottery.connect(player2).bet(90);
      await lottery.connect(dealer).stopGame();

      const dealerBalance = await token.balanceOf(dealer.address);
      const doesPlayer1Win = await lottery.isWinner(player1.address);
      const doesPlayer2Win = await lottery.isWinner(player2.address);

      expect(dealerBalance).to.be.above(
        expandTo18Decimals(100),
        "Expect the dealer to get fee"
      );

      expect(doesPlayer1Win).to.be.true;
      expect(doesPlayer2Win).to.be.true;
    });
  });

  describe("Claim reward", () => {
    it("The game has not stopped yet", async () => {
      await lottery.connect(player1).bet(90);
      await expect(lottery.connect(player1).claimReward()).to.be.revertedWith(
        "The game has not stopped yet"
      );
    });

    it("Not winner", async () => {
      await lottery.connect(player1).bet(1);
      await lottery.connect(dealer).stopGame();
      await expect(lottery.connect(player1).claimReward()).to.be.revertedWith(
        "Insufficient balance"
      );
    });

    it("Claim reward success", async () => {
      await lottery.connect(player1).bet(43);
      await lottery.connect(player2).bet(43);
      await lottery.connect(dealer).stopGame();
      await lottery.connect(player1).claimReward();
      await lottery.connect(player2).claimReward();

      const player1Balance = await token.balanceOf(player1.address);
      const player2Balance = await token.balanceOf(player2.address);
      expect(player1Balance).to.be.above(
        expandTo18Decimals(0),
        "Expect player1 can get reward"
      );
      expect(player2Balance).to.be.above(
        expandTo18Decimals(0),
        "Expect player2 can get reward"
      );
    });
  });
});
