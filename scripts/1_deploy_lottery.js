/* eslint-disable no-process-exit */

const hre = require("hardhat");
const { BigNumber } = require("ethers");
const { ethers, upgrades } = hre;

const { saveContract, getContracts } = require("./utils");

async function main() {
  const network = hre.network.name;
  const contracts = await getContracts()[network];

  const LotteryContract = await ethers.getContractFactory("Lottery");
  const lottery = await upgrades.deployProxy(LotteryContract, [
    contracts.mockErc20,
    BigNumber.from(100).mul(BigNumber.from(10).pow(18)), // 100
    100,
  ]);
  await lottery.deployed();
  await saveContract(network, "lottery", lottery.address);
  console.log(`Deployed lottery to ${lottery.address}`);

  const DEALER = await lottery.DEALER();
  await lottery.grantRole(DEALER, contracts.dealer);
  console.log(`Grant role DEALER for address ${contracts.dealer} success`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
