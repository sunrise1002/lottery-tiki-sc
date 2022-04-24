/* eslint-disable no-process-exit */

const hre = require("hardhat");
const { ethers, upgrades } = hre;

const { getContracts, saveContract } = require("../utils");

async function main() {
  const network = hre.network.name;
  const contracts = await getContracts()[network];

  const LotteryContract = await ethers.getContractFactory("Lottery");
  const lottery = await upgrades.upgradeProxy(
    contracts.lottery,
    LotteryContract
  );
  await lottery.deployed();
  await saveContract(network, "lottery", lottery.address);

  console.log(`Upgraded lottery to ${lottery.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
