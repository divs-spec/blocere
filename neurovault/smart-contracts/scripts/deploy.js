// ========================================
// smart-contracts/scripts/deploy.js
// ========================================

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting NeuroVault deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AIIdentity
  console.log("\n📝 Deploying AIIdentity contract...");
  const AIIdentity = await hre.ethers.getContractFactory("AIIdentity");
  const aiIdentity = await AIIdentity.deploy();
  await aiIdentity.waitForDeployment();
  const aiIdentityAddress = await aiIdentity.getAddress();
  console.log("✅ AIIdentity deployed to:", aiIdentityAddress);

  // Deploy MemoryVault
  console.log("\n📝 Deploying MemoryVault contract...");
  const MemoryVault = await hre.ethers.getContractFactory("MemoryVault");
  const memoryVault = await MemoryVault.deploy(aiIdentityAddress);
  await memoryVault.waitForDeployment();
  const memoryVaultAddress = await memoryVault.getAddress();
  console.log("✅ MemoryVault deployed to:", memoryVaultAddress);

  // Deploy ReputationOracle
  console.log("\n📝 Deploying ReputationOracle contract...");
  const ReputationOracle = await hre.ethers.getContractFactory("ReputationOracle");
  const reputationOracle = await ReputationOracle.deploy(
    aiIdentityAddress,
    memoryVaultAddress
  );
  await reputationOracle.waitForDeployment();
  const reputationOracleAddress = await reputationOracle.getAddress();
  console.log("✅ ReputationOracle deployed to:", reputationOracleAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      AIIdentity: aiIdentityAddress,
      MemoryVault: memoryVaultAddress,
      ReputationOracle: reputationOracleAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("\n⚠️  Remember to:");
  console.log("1. Update .env with contract addresses");
  console.log("2. Verify contracts on block explorer");
  console.log("3. Test all functionality on testnet first");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
