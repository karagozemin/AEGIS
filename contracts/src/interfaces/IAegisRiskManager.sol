// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAegisRiskManager
 * @notice Interface for the AegisRiskManager contract
 */
interface IAegisRiskManager {
    struct RiskScore {
        uint256 varScore;
        uint256 safeLTV;
        uint256 timestamp;
        bytes32 teeTaskId;
        uint256 iterations;
    }

    struct BulkScoreData {
        bytes32 assetId;
        uint256 varScore;
        uint256 safeLTV;
    }

    event RiskScoreUpdated(
        address indexed owner,
        bytes32 indexed assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId
    );

    event BulkScoresSubmitted(address indexed owner, uint256 count, bytes32 teeTaskId);

    event TEEOracleUpdated(address indexed oldOracle, address indexed newOracle);

    error UnauthorizedOracle();
    error InvalidVaRScore();
    error InvalidLTV();
    error InsufficientIterations();
    error EmptyBulkData();
    error ZeroAddress();
    error ScoreExpired();

    function submitRiskScore(
        address owner,
        bytes32 assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId,
        uint256 iterations
    ) external;

    function submitBulkRiskScores(
        address owner,
        BulkScoreData[] calldata scores,
        bytes32 teeTaskId,
        uint256 iterations
    ) external;

    function setTEEOracle(address newOracle) external;

    function getSafeLTV(address owner, bytes32 assetId) external view returns (uint256);

    function getVaRScore(address owner, bytes32 assetId) external view returns (uint256);

    function isScoreValid(address owner, bytes32 assetId) external view returns (bool);

    function getFullRiskScore(address owner, bytes32 assetId) external view returns (RiskScore memory);

    function calculateMaxBorrow(
        address owner,
        bytes32 assetId,
        uint256 collateralValue
    ) external view returns (uint256);
}
