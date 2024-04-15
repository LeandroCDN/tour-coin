require("@nomicfoundation/hardhat-toolbox");

// Ensure your configuration variables are set before executing the script
const { vars } = require("hardhat/config");

// Go to https://alchemy.com, sign up, create a new App in
// its dashboard, and add its key to the configuration variables
// const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");

// Add your Sepolia account private key to the configuration variables
// To export your private key from Coinbase Wallet, go to
// Settings > Developer Settings > Show private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const BSC_PRIVATE_KEY = vars.get("BSC_PRIVATE_KEY");

module.exports = {
  solidity: "0.8.24",
  networks: {
    testBSC: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [BSC_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: "APKDT55QKTMYNVW27HVZHXHT5TY8WD2D3C",
  },
};