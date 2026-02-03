import { IExecDataProtector, type ProtectedData } from "@iexec/dataprotector";
import type { BrowserProvider } from "ethers";

// iExec App address (deployed TEE app)
const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS;

export interface AssetData {
  value: number;
  volatility: number;
}

export interface BulkAssetData {
  assets: AssetData[];
}

/**
 * Initialize DataProtector with browser wallet
 */
export function createDataProtector(provider: BrowserProvider) {
  return new IExecDataProtector(provider);
}

/**
 * Encrypt and protect asset data
 * Returns the protected data address for later computation
 */
export async function protectAssetData(
  dataProtector: IExecDataProtector,
  assetData: BulkAssetData,
  name: string
): Promise<ProtectedData> {
  const protectedData = await dataProtector.protectData({
    data: assetData,
    name,
  });

  return protectedData;
}

/**
 * Grant compute access to the TEE app for protected data
 */
export async function grantComputeAccess(
  dataProtector: IExecDataProtector,
  protectedDataAddress: string,
  appAddress: string = IEXEC_APP_ADDRESS || ""
): Promise<string> {
  const grantedAccess = await dataProtector.grantAccess({
    protectedData: protectedDataAddress,
    authorizedApp: appAddress,
    authorizedUser: "0x0000000000000000000000000000000000000000", // Any user
    numberOfAccess: 1,
  });

  return grantedAccess.txHash;
}

/**
 * Trigger confidential computation on protected data
 */
export async function processProtectedData(
  dataProtector: IExecDataProtector,
  protectedDataAddress: string,
  appAddress: string = IEXEC_APP_ADDRESS || ""
): Promise<{ taskId: string; result: unknown }> {
  const { taskId, result } = await dataProtector.processProtectedData({
    protectedData: protectedDataAddress,
    app: appAddress,
    maxPrice: 0, // Will be sponsored
  });

  return { taskId, result };
}

/**
 * Get all protected data owned by an address
 */
export async function getOwnedProtectedData(
  dataProtector: IExecDataProtector,
  ownerAddress: string
): Promise<ProtectedData[]> {
  const protectedDataList = await dataProtector.fetchProtectedData({
    owner: ownerAddress,
  });

  return protectedDataList;
}

/**
 * Revoke access to protected data
 */
export async function revokeAccess(
  dataProtector: IExecDataProtector,
  protectedDataAddress: string,
  appAddress: string = IEXEC_APP_ADDRESS || ""
): Promise<string> {
  const { txHash } = await dataProtector.revokeAllAccess({
    protectedData: protectedDataAddress,
  });

  return txHash;
}
