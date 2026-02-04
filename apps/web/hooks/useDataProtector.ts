"use client";

import { useState, useCallback, useEffect } from "react";
import { useWalletClient } from "wagmi";

const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || "";

export interface ProtectedAsset {
  address: string;
  name: string;
  owner: string;
  creationTimestamp: number;
}

// Custom provider adapter for iExec SDK
function createIExecProvider(walletClient: any) {
  return {
    request: async ({ method, params }: { method: string; params?: any[] }) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") {
        return [walletClient.account.address];
      }
      if (method === "eth_chainId") {
        return `0x${walletClient.chain.id.toString(16)}`;
      }
      if (method === "personal_sign" || method === "eth_sign") {
        const [message, address] = params || [];
        return walletClient.signMessage({ message, account: address });
      }
      if (method === "eth_signTypedData_v4") {
        const [address, typedData] = params || [];
        const parsed = typeof typedData === "string" ? JSON.parse(typedData) : typedData;
        return walletClient.signTypedData({
          account: address,
          domain: parsed.domain,
          types: parsed.types,
          primaryType: parsed.primaryType,
          message: parsed.message,
        });
      }
      // Forward other requests to the underlying transport
      return walletClient.transport.request({ method, params });
    },
  };
}

export function useDataProtector() {
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataProtector, setDataProtector] = useState<any>(null);

  // Dynamically load DataProtector on client side only
  useEffect(() => {
    if (!walletClient) {
      setDataProtector(null);
      return;
    }

    const initDataProtector = async () => {
      try {
        const { IExecDataProtector } = await import("@iexec/dataprotector");
        const provider = createIExecProvider(walletClient);
        const dp = new IExecDataProtector(provider as any);
        setDataProtector(dp);
      } catch (err) {
        console.error("Failed to create DataProtector:", err);
        setDataProtector(null);
      }
    };

    initDataProtector();
  }, [walletClient]);

  const protectData = useCallback(
    async (data: { value: number; volatility: number }, name: string) => {
      if (!dataProtector) {
        throw new Error("DataProtector not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const protectedData = await dataProtector.protectData({
          data: {
            assetValue: Math.round(data.value * 100), // Store as cents
            assetVolatility: Math.round(data.volatility * 10000), // Store as basis points
          },
          name,
        });

        return protectedData;
      } catch (err: any) {
        console.error("Protect data failed:", err);
        const message = err?.message || "Failed to protect data";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [dataProtector]
  );

  const grantAccess = useCallback(
    async (protectedDataAddress: string) => {
      if (!dataProtector) {
        throw new Error("DataProtector not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await dataProtector.grantAccess({
          protectedData: protectedDataAddress,
          authorizedApp: IEXEC_APP_ADDRESS,
          authorizedUser: "0x0000000000000000000000000000000000000000",
          numberOfAccess: 1,
        });

        return result;
      } catch (err: any) {
        console.error("Grant access failed:", err);
        const message = err?.message || "Failed to grant access";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [dataProtector]
  );

  const processData = useCallback(
    async (protectedDataAddress: string) => {
      if (!dataProtector) {
        throw new Error("DataProtector not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const { taskId, result } = await dataProtector.processProtectedData({
          protectedData: protectedDataAddress,
          app: IEXEC_APP_ADDRESS,
          maxPrice: 0,
        });

        return { taskId, result };
      } catch (err: any) {
        console.error("Process data failed:", err);
        const message = err?.message || "Failed to process data";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [dataProtector]
  );

  const fetchMyProtectedData = useCallback(async () => {
    if (!dataProtector || !walletClient?.account?.address) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await dataProtector.fetchProtectedData({
        owner: walletClient.account.address,
      });

      return data;
    } catch (err: any) {
      console.error("Fetch protected data failed:", err);
      const message = err?.message || "Failed to fetch protected data";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [dataProtector, walletClient]);

  return {
    protectData,
    grantAccess,
    processData,
    fetchMyProtectedData,
    isLoading,
    error,
    isReady: !!dataProtector,
  };
}
