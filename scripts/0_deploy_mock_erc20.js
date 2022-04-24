/* eslint-disable no-process-exit */

const hre = require("hardhat");
const { ethers } = hre;

const { saveContract } = require("./utils");

async function main() {
  const network = hre.network.name;

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockErc20 = await MockERC20.deploy();
  await mockErc20.deployed();
  await saveContract(network, "mockErc20", mockErc20.address);
  console.log(`Deployed mockErc20 to ${mockErc20.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
