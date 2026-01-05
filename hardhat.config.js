require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Helper to format private key (add 0x prefix if missing)
const formatPrivateKey = (key) => {
    if (!key) return null;
    return key.startsWith("0x") ? key : `0x${key}`;
};

const PRIVATE_KEY = formatPrivateKey(process.env.PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
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
        hardhat: {
            chainId: 31337
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337
        },
        // Tenderly Virtual TestNet / DevNet
        tenderly: {
            url: process.env.TENDERLY_RPC_URL || "",
            accounts: PRIVATE_KEY && process.env.TENDERLY_RPC_URL ? [PRIVATE_KEY] : [],
            chainId: parseInt(process.env.TENDERLY_CHAIN_ID || "1")
        },
        // Sepolia - only configure if URL is set
        ...(process.env.SEPOLIA_RPC_URL ? {
            sepolia: {
                url: process.env.SEPOLIA_RPC_URL,
                accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
                chainId: 11155111
            }
        } : {})
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || ""
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
