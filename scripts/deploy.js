const hre = require("hardhat");

async function main() {
    console.log("Deploying MedicalRecords contract...\n");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy the contract
    const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy();

    await medicalRecords.waitForDeployment();
    const contractAddress = await medicalRecords.getAddress();

    console.log("✅ MedicalRecords deployed to:", contractAddress);
    console.log("   Admin address:", deployer.address);

    // Get deployment transaction
    const deployTx = medicalRecords.deploymentTransaction();
    console.log("   Transaction hash:", deployTx.hash);

    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        adminAddress: deployer.address,
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployedAt: new Date().toISOString(),
        transactionHash: deployTx.hash
    };

    console.log("\n📋 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Verify on Etherscan if on Sepolia
    if (hre.network.name === "sepolia") {
        console.log("\n⏳ Waiting for block confirmations...");
        await deployTx.wait(5); // Wait for 5 confirmations

        console.log("🔍 Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: []
            });
            console.log("✅ Contract verified on Etherscan!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("Contract already verified!");
            } else {
                console.log("Verification failed:", error.message);
            }
        }
    }

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
