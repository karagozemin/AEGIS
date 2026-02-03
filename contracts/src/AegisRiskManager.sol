// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AegisRiskManager
 * @author Aegis Prime Team
 * @notice Stores TEE-attested Value-at-Risk (VaR) scores and Safe LTV ratios for RWA assets
 * @dev Designed to receive risk scores from iExec TEE computations
 *
 * VaR Formula: VaR_α(X) = inf{x ∈ ℝ : P(X + x < 0) ≤ 1 - α}
 * - varScore: The 95% VaR in basis points (relative to asset value)
 * - safeLTV: Derived safe Loan-to-Value ratio considering VaR
 */
contract AegisRiskManager is Ownable, ReentrancyGuard {
    // ============ Structs ============

    /**
     * @notice Risk score data structure for an asset
     * @param varScore Value-at-Risk in basis points (e.g., 1500 = 15% potential loss)
     * @param safeLTV Safe Loan-to-Value ratio in basis points (e.g., 7500 = 75%)
     * @param timestamp Block timestamp when the score was recorded
     * @param teeTaskId iExec TEE task ID for verification
     * @param iterations Number of Monte Carlo iterations used
     */
    struct RiskScore {
        uint256 varScore;
        uint256 safeLTV;
        uint256 timestamp;
        bytes32 teeTaskId;
        uint256 iterations;
    }

    /**
     * @notice Bulk submission data structure
     * @param assetId Unique identifier for the asset
     * @param varScore Value-at-Risk in basis points
     * @param safeLTV Safe LTV ratio in basis points
     */
    struct BulkScoreData {
        bytes32 assetId;
        uint256 varScore;
        uint256 safeLTV;
    }

    // ============ State Variables ============

    /// @notice Mapping of owner => assetId => RiskScore
    mapping(address => mapping(bytes32 => RiskScore)) public assetScores;

    /// @notice Authorized TEE oracle address that can submit scores
    address public teeOracle;

    /// @notice Minimum required Monte Carlo iterations for valid computation
    uint256 public constant MIN_ITERATIONS = 5000;

    /// @notice Maximum allowed Safe LTV (100% = 10000 basis points)
    uint256 public constant MAX_LTV_BPS = 10000;

    /// @notice Score validity period (7 days)
    uint256 public constant SCORE_VALIDITY_PERIOD = 7 days;

    // ============ Events ============

    /**
     * @notice Emitted when a risk score is updated
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @param varScore Value-at-Risk in basis points
     * @param safeLTV Safe LTV ratio in basis points
     * @param teeTaskId iExec TEE task ID
     */
    event RiskScoreUpdated(
        address indexed owner,
        bytes32 indexed assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId
    );

    /**
     * @notice Emitted when bulk scores are submitted
     * @param owner Address of the asset owner
     * @param count Number of scores submitted
     * @param teeTaskId iExec TEE task ID
     */
    event BulkScoresSubmitted(address indexed owner, uint256 count, bytes32 teeTaskId);

    /**
     * @notice Emitted when the TEE oracle address is updated
     * @param oldOracle Previous oracle address
     * @param newOracle New oracle address
     */
    event TEEOracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ============ Errors ============

    error UnauthorizedOracle();
    error InvalidVaRScore();
    error InvalidLTV();
    error InsufficientIterations();
    error EmptyBulkData();
    error ZeroAddress();
    error ScoreExpired();

    // ============ Modifiers ============

    /**
     * @notice Restricts function access to the authorized TEE oracle
     */
    modifier onlyTEE() {
        if (msg.sender != teeOracle) revert UnauthorizedOracle();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initializes the contract with an owner and TEE oracle
     * @param _owner Contract owner address
     * @param _teeOracle Authorized TEE oracle address
     */
    constructor(address _owner, address _teeOracle) Ownable(_owner) {
        if (_teeOracle == address(0)) revert ZeroAddress();
        teeOracle = _teeOracle;
    }

    // ============ External Functions ============

    /**
     * @notice Submit a single risk score from TEE computation
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @param varScore Value-at-Risk in basis points
     * @param safeLTV Safe LTV ratio in basis points
     * @param teeTaskId iExec TEE task ID for verification
     * @param iterations Number of Monte Carlo iterations used
     */
    function submitRiskScore(
        address owner,
        bytes32 assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId,
        uint256 iterations
    ) external onlyTEE nonReentrant {
        _validateAndStoreScore(owner, assetId, varScore, safeLTV, teeTaskId, iterations);

        emit RiskScoreUpdated(owner, assetId, varScore, safeLTV, teeTaskId);
    }

    /**
     * @notice Submit multiple risk scores in a single transaction (bulk processing)
     * @dev Gas-efficient for processing multiple assets from one TEE task
     * @param owner Address of the asset owner
     * @param scores Array of bulk score data
     * @param teeTaskId iExec TEE task ID for verification
     * @param iterations Number of Monte Carlo iterations used
     */
    function submitBulkRiskScores(
        address owner,
        BulkScoreData[] calldata scores,
        bytes32 teeTaskId,
        uint256 iterations
    ) external onlyTEE nonReentrant {
        if (scores.length == 0) revert EmptyBulkData();
        if (iterations < MIN_ITERATIONS) revert InsufficientIterations();

        for (uint256 i = 0; i < scores.length;) {
            _validateAndStoreScore(
                owner,
                scores[i].assetId,
                scores[i].varScore,
                scores[i].safeLTV,
                teeTaskId,
                iterations
            );

            emit RiskScoreUpdated(owner, scores[i].assetId, scores[i].varScore, scores[i].safeLTV, teeTaskId);

            unchecked {
                ++i;
            }
        }

        emit BulkScoresSubmitted(owner, scores.length, teeTaskId);
    }

    /**
     * @notice Update the TEE oracle address
     * @param newOracle New oracle address
     */
    function setTEEOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();
        address oldOracle = teeOracle;
        teeOracle = newOracle;
        emit TEEOracleUpdated(oldOracle, newOracle);
    }

    // ============ View Functions ============

    /**
     * @notice Get the safe LTV for an asset
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @return safeLTV Safe LTV ratio in basis points (0 if no score or expired)
     */
    function getSafeLTV(address owner, bytes32 assetId) external view returns (uint256) {
        RiskScore memory score = assetScores[owner][assetId];
        if (score.timestamp == 0) return 0;
        if (block.timestamp > score.timestamp + SCORE_VALIDITY_PERIOD) return 0;
        return score.safeLTV;
    }

    /**
     * @notice Get the VaR score for an asset
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @return varScore Value-at-Risk in basis points (0 if no score or expired)
     */
    function getVaRScore(address owner, bytes32 assetId) external view returns (uint256) {
        RiskScore memory score = assetScores[owner][assetId];
        if (score.timestamp == 0) return 0;
        if (block.timestamp > score.timestamp + SCORE_VALIDITY_PERIOD) return 0;
        return score.varScore;
    }

    /**
     * @notice Check if a risk score is still valid (not expired)
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @return isValid True if score exists and is not expired
     */
    function isScoreValid(address owner, bytes32 assetId) external view returns (bool) {
        RiskScore memory score = assetScores[owner][assetId];
        if (score.timestamp == 0) return false;
        return block.timestamp <= score.timestamp + SCORE_VALIDITY_PERIOD;
    }

    /**
     * @notice Get full risk score data for an asset
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @return score Full RiskScore struct
     */
    function getFullRiskScore(
        address owner,
        bytes32 assetId
    ) external view returns (RiskScore memory) {
        return assetScores[owner][assetId];
    }

    /**
     * @notice Calculate maximum borrowable amount based on collateral and safe LTV
     * @param owner Address of the asset owner
     * @param assetId Unique identifier for the asset
     * @param collateralValue Value of the collateral in base units
     * @return maxBorrow Maximum borrowable amount
     */
    function calculateMaxBorrow(
        address owner,
        bytes32 assetId,
        uint256 collateralValue
    ) external view returns (uint256) {
        RiskScore memory score = assetScores[owner][assetId];
        if (score.timestamp == 0) revert ScoreExpired();
        if (block.timestamp > score.timestamp + SCORE_VALIDITY_PERIOD) revert ScoreExpired();

        return (collateralValue * score.safeLTV) / MAX_LTV_BPS;
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate inputs and store risk score
     */
    function _validateAndStoreScore(
        address owner,
        bytes32 assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId,
        uint256 iterations
    ) internal {
        if (varScore > MAX_LTV_BPS) revert InvalidVaRScore();
        if (safeLTV > MAX_LTV_BPS) revert InvalidLTV();
        if (iterations < MIN_ITERATIONS) revert InsufficientIterations();

        assetScores[owner][assetId] = RiskScore({
            varScore: varScore,
            safeLTV: safeLTV,
            timestamp: block.timestamp,
            teeTaskId: teeTaskId,
            iterations: iterations
        });
    }
}
