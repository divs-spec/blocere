// ========================================
// smart-contracts/hardhat.config.js
// ========================================

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    qie_testnet: {
      url: process.env.QIE_RPC_URL || "https://testnet-rpc.qie.network",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1234, // Replace with actual QIE chain ID
      gasPrice: 20000000000
    },
    qie_mainnet: {
      url: process.env.QIE_MAINNET_RPC_URL || "https://rpc.qie.network",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 5678, // Replace with actual QIE mainnet chain ID
      gasPrice: 30000000000
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
