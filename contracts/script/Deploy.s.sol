// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {AegisRiskManager} from "../src/AegisRiskManager.sol";

/**
 * @title Deploy
 * @notice Deployment script for AegisRiskManager on Arbitrum Sepolia
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // TEE Oracle address - this should be the iExec callback address
        // For testing, we use the deployer; in production, use iExec's oracle
        address teeOracle = vm.envOr("TEE_ORACLE_ADDRESS", deployer);

        console2.log("Deploying AegisRiskManager...");
        console2.log("  Network: Arbitrum Sepolia");
        console2.log("  Deployer:", deployer);
        console2.log("  TEE Oracle:", teeOracle);

        vm.startBroadcast(deployerPrivateKey);

        AegisRiskManager riskManager = new AegisRiskManager(deployer, teeOracle);

        vm.stopBroadcast();

        console2.log("\nDeployment successful!");
        console2.log("  AegisRiskManager:", address(riskManager));
        console2.log("\nSet this in your .env:");
        console2.log("  NEXT_PUBLIC_AEGIS_RISK_MANAGER_ADDRESS=", address(riskManager));
    }
}

/**
 * @title DeployAndSetup
 * @notice Deploy and submit test data for development
 */
contract DeployAndSetup is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying AegisRiskManager with test data...");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with deployer as both owner and oracle for testing
        AegisRiskManager riskManager = new AegisRiskManager(deployer, deployer);

        // Submit test risk scores
        bytes32 assetId1 = keccak256("test-real-estate-1");
        bytes32 assetId2 = keccak256("test-bond-portfolio-1");
        bytes32 teeTaskId = keccak256("test-task-id");

        riskManager.submitRiskScore(
            deployer,
            assetId1,
            1500, // 15% VaR
            7200, // 72% Safe LTV
            teeTaskId,
            5000
        );

        riskManager.submitRiskScore(
            deployer,
            assetId2,
            800, // 8% VaR
            8500, // 85% Safe LTV
            teeTaskId,
            5000
        );

        vm.stopBroadcast();

        console2.log("\nDeployment and setup complete!");
        console2.log("  AegisRiskManager:", address(riskManager));
        console2.log("  Test Asset 1:", vm.toString(assetId1));
        console2.log("  Test Asset 2:", vm.toString(assetId2));
    }
}
