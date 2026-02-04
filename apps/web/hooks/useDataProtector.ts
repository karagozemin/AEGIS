"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";

export interface ProtectedAsset {
  address: string;
  name: string;
  owner: string;
  creationTimestamp: number;
}

/**
 * Hook for iExec DataProtector operations via Backend API
 * This bypasses MetaMask SES lockdown by running iExec SDK on the server
 */
export function useDataProtector() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const protectData = useCallback(
    async (data: { value: number; volatility: number }, name: string) => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("[iExec API] Protecting data:", { data, name });
        
        const response = await fetch('/api/iexec/protect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetValue: data.value,
            assetVolatility: data.volatility,
            name,
            userAddress: address,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to protect data');
        }

        const result = await response.json();
        console.log("[iExec API] Data protected:", result);
        
        // Ensure address is a string (handle if it's an object)
        if (result.address && typeof result.address === 'object') {
          result.address = result.address.cid || result.address.address || JSON.stringify(result.address);
        }
        
        return result;
      } catch (err: any) {
        console.error("[iExec API] Protect data failed:", err);
        const message = err?.message || "Failed to protect data";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address]
  );

  const grantAccess = useCallback(
    async (protectedDataAddress: string) => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("[iExec API] Granting access for:", protectedDataAddress);
        
        const response = await fetch('/api/iexec/grant-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protectedDataAddress,
            userAddress: address,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to grant access');
        }

        const result = await response.json();
        console.log("[iExec API] Access granted:", result);
        
        return result;
      } catch (err: any) {
        console.error("[iExec API] Grant access failed:", err);
        const message = err?.message || "Failed to grant access";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address]
  );

  const processData = useCallback(
    async (protectedDataAddress: string) => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("[iExec API] Processing data in TEE:", protectedDataAddress);
        
        const response = await fetch('/api/iexec/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protectedDataAddress,
            userAddress: address,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process data');
        }

        const result = await response.json();
        console.log("[iExec API] Processing complete:", result);
        
        return { taskId: result.taskId, result: result.deal };
      } catch (err: any) {
        console.error("[iExec API] Process data failed:", err);
        const message = err?.message || "Failed to process data";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address]
  );

  const fetchMyProtectedData = useCallback(async () => {
    if (!isConnected || !address) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[iExec API] Fetching protected data not yet implemented");
      return [];
    } catch (err: any) {
      console.error("[iExec API] Fetch protected data failed:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  return {
    protectData,
    grantAccess,
    processData,
    fetchMyProtectedData,
    isLoading,
    error,
    isReady: isConnected, // Ready when wallet is connected (no SDK initialization needed)
    isDemoMode: false,
  };
}
