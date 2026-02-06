"use client";

import { useState, useCallback } from "react";
import { useReadContract, useAccount } from "wagmi";
import { AEGIS_RISK_MANAGER_ADDRESS, AEGIS_RISK_MANAGER_ABI } from "@/lib/wagmi";
import { keccak256, toBytes } from "viem";

export interface RiskScore {
  varScore: bigint;
  safeLTV: bigint;
  timestamp: bigint;
  teeTaskId: `0x${string}`;
  iterations: bigint;
}

export interface SubmitScoreResult {
  success: boolean;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}

/**
 * Read on-chain risk score for an asset (full struct via assetScores mapping)
 */
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
        iterations: data[4],
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

/**
 * Read safe LTV from contract (returns 0 if expired)
 */
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

/**
 * Read full risk score struct from contract
 */
export function useFullRiskScore(assetId: string) {
  const { address } = useAccount();

  const assetIdBytes32 = keccak256(toBytes(assetId));

  const { data, isLoading, error, refetch } = useReadContract({
    address: AEGIS_RISK_MANAGER_ADDRESS,
    abi: AEGIS_RISK_MANAGER_ABI,
    functionName: "getFullRiskScore",
    args: address ? [address, assetIdBytes32] : undefined,
    query: {
      enabled: !!address && !!AEGIS_RISK_MANAGER_ADDRESS,
    },
  });

  const score: RiskScore | null = data
    ? {
        varScore: (data as any).varScore,
        safeLTV: (data as any).safeLTV,
        timestamp: (data as any).timestamp,
        teeTaskId: (data as any).teeTaskId as `0x${string}`,
        iterations: (data as any).iterations,
      }
    : null;

  return {
    score,
    isLoading,
    error,
    refetch,
    hasScore: score && score.timestamp > BigInt(0),
  };
}

/**
 * Check if a risk score is still valid (not expired)
 */
export function useIsScoreValid(assetId: string) {
  const { address } = useAccount();

  const assetIdBytes32 = keccak256(toBytes(assetId));

  const { data, isLoading, error } = useReadContract({
    address: AEGIS_RISK_MANAGER_ADDRESS,
    abi: AEGIS_RISK_MANAGER_ABI,
    functionName: "isScoreValid",
    args: address ? [address, assetIdBytes32] : undefined,
    query: {
      enabled: !!address && !!AEGIS_RISK_MANAGER_ADDRESS,
    },
  });

  return {
    isValid: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Submit risk score to contract via backend API (TEE Oracle pattern)
 * The backend wallet is the authorized teeOracle on the contract.
 */
export function useSubmitRiskScore() {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SubmitScoreResult | null>(null);

  const submitScore = useCallback(
    async (params: {
      assetId: string;
      varScore: number;
      safeLTV: number;
      taskId: string;
      iterations?: number;
    }): Promise<SubmitScoreResult> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        console.log("[RiskManager] Submitting score on-chain via backend...");
        console.log("[RiskManager]   Asset:", params.assetId);
        console.log("[RiskManager]   VaR:", params.varScore, "bps");
        console.log("[RiskManager]   LTV:", params.safeLTV, "bps");

        const response = await fetch('/api/iexec/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerAddress: address,
            assetId: params.assetId,
            varScore: params.varScore,
            safeLTV: params.safeLTV,
            taskId: params.taskId,
            iterations: params.iterations || 5000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit score');
        }

        const result: SubmitScoreResult = await response.json();
        console.log("[RiskManager] ✅ Score submitted on-chain!");
        console.log("[RiskManager]   Tx:", result.txHash);
        console.log("[RiskManager]   Explorer:", result.explorerUrl);

        setLastResult(result);
        return result;
      } catch (err: any) {
        console.error("[RiskManager] ❌ Submit failed:", err);
        const message = err?.message || "Failed to submit score";
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [address]
  );

  return {
    submitScore,
    isSubmitting,
    error,
    lastResult,
  };
}
