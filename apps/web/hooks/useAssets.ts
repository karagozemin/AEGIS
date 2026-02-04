"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

export interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
  protectedDataAddress: string | null;
  varScore: number | null;
  safeLTV: number | null;
  status: "pending" | "protected" | "computing" | "computed";
  taskId: string | null;
  createdAt: number;
}

const STORAGE_KEY = "aegis_assets";

function getStorageKey(address: string) {
  return `${STORAGE_KEY}_${address.toLowerCase()}`;
}

export function useAssets() {
  const { address } = useAccount();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load assets from localStorage when wallet connects
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(getStorageKey(address));
      if (stored) {
        try {
          setAssets(JSON.parse(stored));
        } catch {
          setAssets([]);
        }
      } else {
        setAssets([]);
      }
    } else {
      setAssets([]);
    }
    setIsLoading(false);
  }, [address]);

  // Save assets to localStorage whenever they change
  useEffect(() => {
    if (address && !isLoading) {
      localStorage.setItem(getStorageKey(address), JSON.stringify(assets));
    }
  }, [assets, address, isLoading]);

  const addAsset = useCallback(
    (asset: Omit<Asset, "id" | "createdAt" | "status" | "varScore" | "safeLTV" | "taskId" | "protectedDataAddress">) => {
      const newAsset: Asset = {
        ...asset,
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        protectedDataAddress: null,
        varScore: null,
        safeLTV: null,
        status: "pending",
        taskId: null,
        createdAt: Date.now(),
      };

      setAssets((prev) => [...prev, newAsset]);
      return newAsset;
    },
    []
  );

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset))
    );
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  }, []);

  const getAssetById = useCallback(
    (id: string) => {
      return assets.find((asset) => asset.id === id);
    },
    [assets]
  );

  const getPendingAssets = useCallback(() => {
    return assets.filter((asset) => asset.status === "pending" || asset.status === "protected");
  }, [assets]);

  const getComputedAssets = useCallback(() => {
    return assets.filter((asset) => asset.status === "computed");
  }, [assets]);

  return {
    assets,
    addAsset,
    updateAsset,
    removeAsset,
    getAssetById,
    getPendingAssets,
    getComputedAssets,
    isLoading,
  };
}
