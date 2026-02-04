"use client";

import { useState, useCallback, useEffect } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { createGaslessClient, bundlerClient } from "@/lib/pimlico";
import type { SmartAccountClient } from "permissionless";
import type { Abi, Address } from "viem";

/**
 * Hook for Account Abstraction with Pimlico Paymaster
 * 
 * Enables gasless transactions for TEE execution by:
 * 1. Creating a Smart Account from user's EOA
 * 2. Using Pimlico Paymaster to sponsor gas fees
 * 3. Bundling operations via ERC-4337
 */
export function useSmartAccount() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [smartAccountClient, setSmartAccountClient] = useState<
    Awaited<ReturnType<typeof createGaslessClient>> | null
  >(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGaslessEnabled, setIsGaslessEnabled] = useState(false);

  /**
   * Initialize Smart Account from connected wallet
   */
  const initializeSmartAccount = useCallback(async () => {
    if (!walletClient || !address || !isConnected) {
      setError("Wallet not connected");
      return false;
    }

    // Check if Pimlico API key is configured
    if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
      console.warn("[SmartAccount] Pimlico API key not configured - using standard transactions");
      setIsGaslessEnabled(false);
      return false;
    }

    setIsInitializing(true);
    setError(null);

    try {
      console.log("[SmartAccount] Initializing gasless client...");
      
      const smartClient = await createGaslessClient(walletClient as any);
      const smartAddress = smartClient.account.address;

      setSmartAccountClient(smartClient);
      setSmartAccountAddress(smartAddress);
      setIsGaslessEnabled(true);

      console.log("[SmartAccount] ✅ Smart Account created:", smartAddress);
      console.log("[SmartAccount] ✅ Gasless transactions enabled");

      return true;
    } catch (err: any) {
      console.error("[SmartAccount] Failed to initialize:", err);
      setError(err?.message || "Failed to initialize smart account");
      setIsGaslessEnabled(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address, isConnected]);

  /**
   * Send gasless transaction via Smart Account
   */
  const sendGaslessTransaction = useCallback(
    async (params: {
      to: Address;
      abi: Abi;
      functionName: string;
      args?: any[];
      value?: bigint;
    }) => {
      if (!smartAccountClient) {
        throw new Error("Smart account not initialized");
      }

      const { to, abi, functionName, args = [], value = BigInt(0) } = params;

      console.log("[SmartAccount] Preparing gasless transaction...");
      console.log(`[SmartAccount] Function: ${functionName}`);
      console.log(`[SmartAccount] To: ${to}`);

      try {
        // Encode function call
        const { encodeFunctionData } = await import("viem");
        const callData = encodeFunctionData({
          abi,
          functionName,
          args,
        });

        // Send user operation
        const txHash = await smartAccountClient.sendUserOperation({
          userOperation: {
            callData: await smartAccountClient.account.encodeCallData([
              {
                to,
                data: callData,
                value,
              },
            ]),
          },
        });

        console.log("[SmartAccount] ✅ UserOp hash:", txHash);

        // Wait for transaction to be included
        console.log("[SmartAccount] Waiting for transaction...");
        const receipt = await bundlerClient.waitForUserOperationReceipt({
          hash: txHash,
        });

        console.log("[SmartAccount] ✅ Transaction confirmed:", receipt.receipt.transactionHash);

        return {
          hash: txHash,
          receipt: receipt.receipt,
        };
      } catch (err: any) {
        console.error("[SmartAccount] Transaction failed:", err);
        throw new Error(err?.message || "Gasless transaction failed");
      }
    },
    [smartAccountClient]
  );

  /**
   * Estimate gas for display purposes
   */
  const estimateGas = useCallback(
    async (params: {
      to: Address;
      abi: Abi;
      functionName: string;
      args?: any[];
    }) => {
      if (!smartAccountClient) {
        return null;
      }

      try {
        const { encodeFunctionData } = await import("viem");
        const callData = encodeFunctionData({
          abi: params.abi,
          functionName: params.functionName,
          args: params.args || [],
        });

        const { estimateUserOperationGas } = await import("@/lib/pimlico");
        
        const gasEstimate = await estimateUserOperationGas(smartAccountClient, [
          {
            to: params.to,
            data: callData,
          },
        ]);

        return gasEstimate;
      } catch (err) {
        console.error("[SmartAccount] Gas estimation failed:", err);
        return null;
      }
    },
    [smartAccountClient]
  );

  /**
   * Reset smart account state
   */
  const reset = useCallback(() => {
    setSmartAccountClient(null);
    setSmartAccountAddress(null);
    setIsGaslessEnabled(false);
    setError(null);
  }, []);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (isConnected && walletClient && !smartAccountClient && !isInitializing) {
      // Auto-initialize in the background
      initializeSmartAccount().catch(console.error);
    }
  }, [isConnected, walletClient, smartAccountClient, isInitializing, initializeSmartAccount]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      reset();
    }
  }, [isConnected, reset]);

  return {
    // State
    smartAccountClient,
    smartAccountAddress,
    isInitializing,
    isGaslessEnabled,
    error,

    // Actions
    initializeSmartAccount,
    sendGaslessTransaction,
    estimateGas,
    reset,
  };
}
