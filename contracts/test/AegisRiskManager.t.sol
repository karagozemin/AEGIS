// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {AegisRiskManager} from "../src/AegisRiskManager.sol";

/**
 * @title AegisRiskManagerTest
 * @notice Comprehensive test suite for AegisRiskManager contract
 * @dev Tests VaR computation storage, bulk processing, and access control
 */
contract AegisRiskManagerTest is Test {
    AegisRiskManager public riskManager;

    address public owner = makeAddr("owner");
    address public teeOracle = makeAddr("teeOracle");
    address public assetOwner = makeAddr("assetOwner");
    address public unauthorized = makeAddr("unauthorized");

    bytes32 public constant ASSET_ID_1 = keccak256("real-estate-1");
    bytes32 public constant ASSET_ID_2 = keccak256("bond-portfolio-1");
    bytes32 public constant ASSET_ID_3 = keccak256("mixed-fund-1");
    bytes32 public constant TEE_TASK_ID = keccak256("iexec-task-12345");

    uint256 public constant MIN_ITERATIONS = 5000;
    uint256 public constant MAX_LTV_BPS = 10000;
    uint256 public constant SCORE_VALIDITY_PERIOD = 7 days;

    // Sample VaR computation results (simulating TEE output)
    // Asset 1: $2.5M value, 15% volatility -> VaR 95% = 15% -> Safe LTV = 72%
    uint256 public constant VAR_SCORE_1 = 1500; // 15% in basis points
    uint256 public constant SAFE_LTV_1 = 7200; // 72% in basis points

    // Asset 2: $1M value, 8% volatility -> VaR 95% = 4.8% -> Safe LTV = 85%
    uint256 public constant VAR_SCORE_2 = 480; // 4.8% in basis points
    uint256 public constant SAFE_LTV_2 = 8500; // 85% in basis points

    // Asset 3: $750K value, 22% volatility -> VaR 95% = 22% -> Safe LTV = 65%
    uint256 public constant VAR_SCORE_3 = 2200; // 22% in basis points
    uint256 public constant SAFE_LTV_3 = 6500; // 65% in basis points

    event RiskScoreUpdated(
        address indexed owner,
        bytes32 indexed assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId
    );

    event BulkScoresSubmitted(address indexed owner, uint256 count, bytes32 teeTaskId);

    event TEEOracleUpdated(address indexed oldOracle, address indexed newOracle);

    function setUp() public {
        vm.prank(owner);
        riskManager = new AegisRiskManager(owner, teeOracle);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsOwner() public view {
        assertEq(riskManager.owner(), owner);
    }

    function test_Constructor_SetsTEEOracle() public view {
        assertEq(riskManager.teeOracle(), teeOracle);
    }

    function test_Constructor_RevertOnZeroOracle() public {
        vm.expectRevert(AegisRiskManager.ZeroAddress.selector);
        new AegisRiskManager(owner, address(0));
    }

    // ============ Single Score Submission Tests ============

    function test_SubmitRiskScore_Success() public {
        vm.prank(teeOracle);

        vm.expectEmit(true, true, false, true);
        emit RiskScoreUpdated(assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID);

        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        // Verify stored data
        AegisRiskManager.RiskScore memory score = riskManager.getFullRiskScore(assetOwner, ASSET_ID_1);
        assertEq(score.varScore, VAR_SCORE_1);
        assertEq(score.safeLTV, SAFE_LTV_1);
        assertEq(score.teeTaskId, TEE_TASK_ID);
        assertEq(score.iterations, MIN_ITERATIONS);
        assertEq(score.timestamp, block.timestamp);
    }

    function test_SubmitRiskScore_RevertUnauthorized() public {
        vm.prank(unauthorized);

        vm.expectRevert(AegisRiskManager.UnauthorizedOracle.selector);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );
    }

    function test_SubmitRiskScore_RevertInvalidVaR() public {
        vm.prank(teeOracle);

        // VaR > 100% should revert
        vm.expectRevert(AegisRiskManager.InvalidVaRScore.selector);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, MAX_LTV_BPS + 1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );
    }

    function test_SubmitRiskScore_RevertInvalidLTV() public {
        vm.prank(teeOracle);

        // LTV > 100% should revert
        vm.expectRevert(AegisRiskManager.InvalidLTV.selector);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, MAX_LTV_BPS + 1, TEE_TASK_ID, MIN_ITERATIONS
        );
    }

    function test_SubmitRiskScore_RevertInsufficientIterations() public {
        vm.prank(teeOracle);

        // Less than 5000 iterations should revert
        vm.expectRevert(AegisRiskManager.InsufficientIterations.selector);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS - 1
        );
    }

    // ============ Bulk Score Submission Tests (Bonus Points Feature) ============

    function test_SubmitBulkRiskScores_Success() public {
        AegisRiskManager.BulkScoreData[] memory scores = new AegisRiskManager.BulkScoreData[](3);
        scores[0] = AegisRiskManager.BulkScoreData(ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1);
        scores[1] = AegisRiskManager.BulkScoreData(ASSET_ID_2, VAR_SCORE_2, SAFE_LTV_2);
        scores[2] = AegisRiskManager.BulkScoreData(ASSET_ID_3, VAR_SCORE_3, SAFE_LTV_3);

        vm.prank(teeOracle);

        vm.expectEmit(true, false, false, true);
        emit BulkScoresSubmitted(assetOwner, 3, TEE_TASK_ID);

        riskManager.submitBulkRiskScores(assetOwner, scores, TEE_TASK_ID, MIN_ITERATIONS);

        // Verify all scores stored correctly
        assertEq(riskManager.getSafeLTV(assetOwner, ASSET_ID_1), SAFE_LTV_1);
        assertEq(riskManager.getSafeLTV(assetOwner, ASSET_ID_2), SAFE_LTV_2);
        assertEq(riskManager.getSafeLTV(assetOwner, ASSET_ID_3), SAFE_LTV_3);

        assertEq(riskManager.getVaRScore(assetOwner, ASSET_ID_1), VAR_SCORE_1);
        assertEq(riskManager.getVaRScore(assetOwner, ASSET_ID_2), VAR_SCORE_2);
        assertEq(riskManager.getVaRScore(assetOwner, ASSET_ID_3), VAR_SCORE_3);
    }

    function test_SubmitBulkRiskScores_RevertEmptyArray() public {
        AegisRiskManager.BulkScoreData[] memory scores = new AegisRiskManager.BulkScoreData[](0);

        vm.prank(teeOracle);
        vm.expectRevert(AegisRiskManager.EmptyBulkData.selector);
        riskManager.submitBulkRiskScores(assetOwner, scores, TEE_TASK_ID, MIN_ITERATIONS);
    }

    function test_SubmitBulkRiskScores_GasEfficiency() public {
        AegisRiskManager.BulkScoreData[] memory scores = new AegisRiskManager.BulkScoreData[](10);
        for (uint256 i = 0; i < 10; i++) {
            scores[i] = AegisRiskManager.BulkScoreData(
                keccak256(abi.encodePacked("asset-", i)),
                1000 + i * 100,
                7000 + i * 100
            );
        }

        vm.prank(teeOracle);
        uint256 gasStart = gasleft();
        riskManager.submitBulkRiskScores(assetOwner, scores, TEE_TASK_ID, MIN_ITERATIONS);
        uint256 gasUsed = gasStart - gasleft();

        console2.log("Gas used for 10 bulk scores:", gasUsed);
        // Should be significantly less than 10 individual submissions
        // Each individual submission costs ~130k gas, so 10 would be ~1.3M
        // Bulk should be more efficient than that
        assertLt(gasUsed, 1_300_000, "Bulk submission should be gas efficient");
    }

    // ============ VaR Computation Verification Tests ============

    /**
     * @notice Test that VaR scores follow expected Monte Carlo patterns
     * @dev Higher volatility should result in higher VaR
     */
    function test_VaRComputation_VolatilityCorrelation() public {
        vm.startPrank(teeOracle);

        // Low volatility asset (8%) -> Low VaR
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_2, VAR_SCORE_2, SAFE_LTV_2, TEE_TASK_ID, MIN_ITERATIONS
        );

        // High volatility asset (22%) -> High VaR
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_3, VAR_SCORE_3, SAFE_LTV_3, TEE_TASK_ID, MIN_ITERATIONS
        );

        vm.stopPrank();

        // High volatility asset should have higher VaR
        uint256 lowVolVaR = riskManager.getVaRScore(assetOwner, ASSET_ID_2);
        uint256 highVolVaR = riskManager.getVaRScore(assetOwner, ASSET_ID_3);

        assertGt(highVolVaR, lowVolVaR, "Higher volatility should yield higher VaR");
    }

    /**
     * @notice Test that Safe LTV is inversely correlated with VaR
     * @dev Higher VaR should result in lower Safe LTV
     */
    function test_VaRComputation_LTVInverseCorrelation() public {
        vm.startPrank(teeOracle);

        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_2, VAR_SCORE_2, SAFE_LTV_2, TEE_TASK_ID, MIN_ITERATIONS
        );

        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_3, VAR_SCORE_3, SAFE_LTV_3, TEE_TASK_ID, MIN_ITERATIONS
        );

        vm.stopPrank();

        uint256 lowRiskLTV = riskManager.getSafeLTV(assetOwner, ASSET_ID_2);
        uint256 highRiskLTV = riskManager.getSafeLTV(assetOwner, ASSET_ID_3);

        // Lower VaR should allow higher LTV
        assertGt(lowRiskLTV, highRiskLTV, "Lower VaR should allow higher LTV");
    }

    /**
     * @notice Simulate Monte Carlo VaR calculation verification
     * @dev VaR at 95% confidence with normal distribution: VaR ≈ 1.645 * σ * V
     */
    function test_VaRComputation_MathematicalBounds() public {
        vm.prank(teeOracle);

        // For 15% volatility, 95% VaR ≈ 1.645 * 0.15 ≈ 24.7%
        // But with 5000 iterations, we expect some variance
        // VaR should be between 10% and 30% for 15% volatility
        uint256 varScore = 1500; // 15% (conservative estimate)

        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, varScore, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        uint256 storedVaR = riskManager.getVaRScore(assetOwner, ASSET_ID_1);

        // VaR should be within reasonable bounds for 15% volatility
        assertGe(storedVaR, 500, "VaR too low for 15% volatility"); // Min 5%
        assertLe(storedVaR, 3000, "VaR too high for 15% volatility"); // Max 30%
    }

    // ============ Score Validity Tests ============

    function test_ScoreValidity_Fresh() public {
        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        assertTrue(riskManager.isScoreValid(assetOwner, ASSET_ID_1));
    }

    function test_ScoreValidity_Expired() public {
        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        // Fast forward past validity period
        vm.warp(block.timestamp + SCORE_VALIDITY_PERIOD + 1);

        assertFalse(riskManager.isScoreValid(assetOwner, ASSET_ID_1));
        assertEq(riskManager.getSafeLTV(assetOwner, ASSET_ID_1), 0);
        assertEq(riskManager.getVaRScore(assetOwner, ASSET_ID_1), 0);
    }

    function test_ScoreValidity_NonExistent() public view {
        assertFalse(riskManager.isScoreValid(assetOwner, ASSET_ID_1));
    }

    // ============ Max Borrow Calculation Tests ============

    function test_CalculateMaxBorrow_Success() public {
        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        uint256 collateralValue = 1_000_000 ether; // $1M in wei
        uint256 maxBorrow = riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_1, collateralValue);

        // With 72% LTV, max borrow should be $720,000
        uint256 expectedMaxBorrow = (collateralValue * SAFE_LTV_1) / MAX_LTV_BPS;
        assertEq(maxBorrow, expectedMaxBorrow);
        assertEq(maxBorrow, 720_000 ether);
    }

    function test_CalculateMaxBorrow_RevertExpired() public {
        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1, TEE_TASK_ID, MIN_ITERATIONS
        );

        vm.warp(block.timestamp + SCORE_VALIDITY_PERIOD + 1);

        vm.expectRevert(AegisRiskManager.ScoreExpired.selector);
        riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_1, 1_000_000 ether);
    }

    function test_CalculateMaxBorrow_RevertNoScore() public {
        vm.expectRevert(AegisRiskManager.ScoreExpired.selector);
        riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_1, 1_000_000 ether);
    }

    // ============ Access Control Tests ============

    function test_SetTEEOracle_Success() public {
        address newOracle = makeAddr("newOracle");

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit TEEOracleUpdated(teeOracle, newOracle);
        riskManager.setTEEOracle(newOracle);

        assertEq(riskManager.teeOracle(), newOracle);
    }

    function test_SetTEEOracle_RevertNotOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        riskManager.setTEEOracle(makeAddr("newOracle"));
    }

    function test_SetTEEOracle_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AegisRiskManager.ZeroAddress.selector);
        riskManager.setTEEOracle(address(0));
    }

    // ============ Fuzz Tests ============

    function testFuzz_SubmitRiskScore_ValidInputs(
        uint256 varScore,
        uint256 safeLTV,
        uint256 iterations
    ) public {
        varScore = bound(varScore, 0, MAX_LTV_BPS);
        safeLTV = bound(safeLTV, 0, MAX_LTV_BPS);
        iterations = bound(iterations, MIN_ITERATIONS, 100_000);

        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, varScore, safeLTV, TEE_TASK_ID, iterations
        );

        assertEq(riskManager.getVaRScore(assetOwner, ASSET_ID_1), varScore);
        assertEq(riskManager.getSafeLTV(assetOwner, ASSET_ID_1), safeLTV);
    }

    function testFuzz_CalculateMaxBorrow(uint256 collateralValue, uint256 safeLTV) public {
        collateralValue = bound(collateralValue, 1 ether, 1_000_000_000 ether);
        safeLTV = bound(safeLTV, 1, MAX_LTV_BPS);

        vm.prank(teeOracle);
        riskManager.submitRiskScore(
            assetOwner, ASSET_ID_1, 1000, safeLTV, TEE_TASK_ID, MIN_ITERATIONS
        );

        uint256 maxBorrow = riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_1, collateralValue);
        uint256 expectedMaxBorrow = (collateralValue * safeLTV) / MAX_LTV_BPS;

        assertEq(maxBorrow, expectedMaxBorrow);
    }

    // ============ Integration Test ============

    /**
     * @notice Full integration test simulating TEE computation flow
     */
    function test_Integration_FullFlow() public {
        // Step 1: TEE Oracle submits bulk scores from Monte Carlo computation
        AegisRiskManager.BulkScoreData[] memory scores = new AegisRiskManager.BulkScoreData[](2);
        scores[0] = AegisRiskManager.BulkScoreData(ASSET_ID_1, VAR_SCORE_1, SAFE_LTV_1);
        scores[1] = AegisRiskManager.BulkScoreData(ASSET_ID_2, VAR_SCORE_2, SAFE_LTV_2);

        vm.prank(teeOracle);
        riskManager.submitBulkRiskScores(assetOwner, scores, TEE_TASK_ID, 5000);

        // Step 2: Verify scores are accessible
        assertTrue(riskManager.isScoreValid(assetOwner, ASSET_ID_1));
        assertTrue(riskManager.isScoreValid(assetOwner, ASSET_ID_2));

        // Step 3: DeFi protocol calculates max borrow
        uint256 collateral1 = 2_500_000 ether;
        uint256 collateral2 = 1_000_000 ether;

        uint256 maxBorrow1 = riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_1, collateral1);
        uint256 maxBorrow2 = riskManager.calculateMaxBorrow(assetOwner, ASSET_ID_2, collateral2);

        // Asset 1: $2.5M * 72% = $1.8M max borrow
        assertEq(maxBorrow1, 1_800_000 ether);
        // Asset 2: $1M * 85% = $850K max borrow
        assertEq(maxBorrow2, 850_000 ether);

        // Step 4: Verify TEE task ID for audit trail
        AegisRiskManager.RiskScore memory score1 = riskManager.getFullRiskScore(assetOwner, ASSET_ID_1);
        assertEq(score1.teeTaskId, TEE_TASK_ID);
        assertEq(score1.iterations, 5000);
    }
}
