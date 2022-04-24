# Tiki Lottery Contract
  

## Dependencies

  

* Node v14.15.4

* Hardhat 2.9.3

  

## How to build?

  

* Install npm packages, run the below command:
```

yarn install

```

* Compile solidity files:
```

yarn compile

```


  

## How to test?

  

* Run the below command:
```

yarn test

```

  

## How to deploy?

  

* Copy & modify environment variables:
```

cp .env.example .env

```

It looks like:

```

ETHERSCAN_API_KEY=
ETHERSCAN=https://kovan.etherscan.io/
ROPSTEN_URL=https://eth-ropsten.alchemyapi.io/v2/<YOUR ALCHEMY KEY>
PRIVATE_KEY=
BSCSCAN=https://testnet.bscscan.com/
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545
REPORT_GAS=true

```

  

* Deploy contracts, run the below commands:

```

npx hardhat run --network <bsc | tbsc | kovan> scripts/<file_name>

```
or
```

yarn deploy:<local | dev | staging | prod> scripts/<file_name>

```

  

* Verify contracts:

```

npx hardhat verify --network <bsc | tbsc | kovan> <contract_address> <input_parameters>

```

  

or

  

```

yarn verify:<local | dev | staging | prod> <contract_address> <input_parameters>

```
