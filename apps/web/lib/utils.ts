import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format basis points to percentage string
 */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Generate asset ID from data
 */
export function generateAssetId(
  ownerAddress: string,
  value: number,
  timestamp: number
): string {
  const data = `${ownerAddress}-${value}-${timestamp}`;
  // Simple hash for demo - use proper hashing in production
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

/**
 * Get risk level from VaR score
 */
export function getRiskLevel(
  varScore: number,
  totalValue: number
): "low" | "medium" | "high" {
  const varPercentage = (varScore / totalValue) * 100;
  if (varPercentage < 10) return "low";
  if (varPercentage < 25) return "medium";
  return "high";
}

/**
 * Get color class for risk level
 */
export function getRiskColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-aegis-amber";
    case "high":
      return "text-red-400";
  }
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
