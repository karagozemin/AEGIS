/**
 * Contract addresses and ABIs - server-safe (no wagmi/rainbowkit imports)
 * Both client components (via wagmi.ts) and API routes can import from here.
 */

// Contract addresses
export const AEGIS_RISK_MANAGER_ADDRESS =
  process.env.NEXT_PUBLIC_AEGIS_RISK_MANAGER_ADDRESS as `0x${string}`;

// AegisRiskManager ABI (complete for frontend + backend)
export const AEGIS_RISK_MANAGER_ABI = [
  // ============ Write Functions ============
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
      { name: "varScore", type: "uint256" },
      { name: "safeLTV", type: "uint256" },
      { name: "teeTaskId", type: "bytes32" },
      { name: "iterations", type: "uint256" },
    ],
    name: "submitRiskScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      {
        name: "scores",
        type: "tuple[]",
        components: [
          { name: "assetId", type: "bytes32" },
          { name: "varScore", type: "uint256" },
          { name: "safeLTV", type: "uint256" },
        ],
      },
      { name: "teeTaskId", type: "bytes32" },
      { name: "iterations", type: "uint256" },
    ],
    name: "submitBulkRiskScores",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOracle", type: "address" }],
    name: "setTEEOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ============ View Functions ============
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
    ],
    name: "getSafeLTV",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
    ],
    name: "getVaRScore",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
    ],
    name: "isScoreValid",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
    ],
    name: "getFullRiskScore",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "varScore", type: "uint256" },
          { name: "safeLTV", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "teeTaskId", type: "bytes32" },
          { name: "iterations", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
    ],
    name: "assetScores",
    outputs: [
      { name: "varScore", type: "uint256" },
      { name: "safeLTV", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "teeTaskId", type: "bytes32" },
      { name: "iterations", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "assetId", type: "bytes32" },
      { name: "collateralValue", type: "uint256" },
    ],
    name: "calculateMaxBorrow",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "teeOracle",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_ITERATIONS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_LTV_BPS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SCORE_VALIDITY_PERIOD",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "assetId", type: "bytes32" },
      { indexed: false, name: "varScore", type: "uint256" },
      { indexed: false, name: "safeLTV", type: "uint256" },
      { indexed: false, name: "teeTaskId", type: "bytes32" },
    ],
    name: "RiskScoreUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "count", type: "uint256" },
      { indexed: false, name: "teeTaskId", type: "bytes32" },
    ],
    name: "BulkScoresSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "oldOracle", type: "address" },
      { indexed: true, name: "newOracle", type: "address" },
    ],
    name: "TEEOracleUpdated",
    type: "event",
  },
] as const;
