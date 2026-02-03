import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "Aegis Prime",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ||
        "https://sepolia-rollup.arbitrum.io/rpc"
    ),
  },
  ssr: true,
});

// Contract addresses
export const AEGIS_RISK_MANAGER_ADDRESS =
  process.env.NEXT_PUBLIC_AEGIS_RISK_MANAGER_ADDRESS as `0x${string}`;

// AegisRiskManager ABI (minimal for frontend)
export const AEGIS_RISK_MANAGER_ABI = [
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
    name: "assetScores",
    outputs: [
      { name: "varScore", type: "uint256" },
      { name: "safeLTV", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "teeTaskId", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "assetId", type: "bytes32" },
      { indexed: false, name: "safeLTV", type: "uint256" },
    ],
    name: "RiskScoreUpdated",
    type: "event",
  },
] as const;
