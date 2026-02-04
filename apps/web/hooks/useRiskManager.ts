"use client";

import { useReadContract, useAccount } from "wagmi";
import { AEGIS_RISK_MANAGER_ADDRESS, AEGIS_RISK_MANAGER_ABI } from "@/lib/wagmi";
import { keccak256, toBytes } from "viem";

export interface RiskScore {
  varScore: bigint;
  safeLTV: bigint;
  timestamp: bigint;
  teeTaskId: `0x${string}`;
}

export function useRiskScore(assetId: string) {
  const { address } = useAccount();

  // Convert asset ID string to bytes32
  const assetIdBytes32 = keccak256(toBytes(assetId));

  const { data, isLoading, error, refetch } = useReadContract({
    address: AEGIS_RISK_MANAGER_ADDRESS,
    abi: AEGIS_RISK_MANAGER_ABI,
    functionName: "assetScores",
    args: address ? [address, assetIdBytes32] : undefined,
    query: {
      enabled: !!address && !!AEGIS_RISK_MANAGER_ADDRESS,
    },
  });

  const riskScore: RiskScore | null = data
    ? {
        varScore: data[0],
        safeLTV: data[1],
        timestamp: data[2],
        teeTaskId: data[3] as `0x${string}`,
      }
    : null;

  return {
    riskScore,
    isLoading,
    error,
    refetch,
    hasScore: riskScore && riskScore.timestamp > BigInt(0),
  };
}

export function useSafeLTV(assetId: string) {
  const { address } = useAccount();

  const assetIdBytes32 = keccak256(toBytes(assetId));

  const { data, isLoading, error } = useReadContract({
    address: AEGIS_RISK_MANAGER_ADDRESS,
    abi: AEGIS_RISK_MANAGER_ABI,
    functionName: "getSafeLTV",
    args: address ? [address, assetIdBytes32] : undefined,
    query: {
      enabled: !!address && !!AEGIS_RISK_MANAGER_ADDRESS,
    },
  });

  return {
    safeLTV: data as bigint | undefined,
    isLoading,
    error,
  };
}
