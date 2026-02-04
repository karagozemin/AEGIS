import { IExecDataProtector, type ProtectedData } from "@iexec/dataprotector";

// iExec App address (deployed TEE app)
const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS;

export interface AssetData {
  value: number;
  volatility: number;
}

export interface BulkAssetData {
  assets: AssetData[];
  [key: string]: unknown;
}

/**
 * Initialize DataProtector with browser wallet
 */
export function createDataProtector(provider: unknown) {
  return new IExecDataProtector(provider as any);
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
    data: assetData as any,
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
): Promise<any> {
  const grantedAccess = await dataProtector.grantAccess({
    protectedData: protectedDataAddress,
    authorizedApp: appAddress,
    authorizedUser: "0x0000000000000000000000000000000000000000",
    numberOfAccess: 1,
  });

  return grantedAccess;
}

/**
 * Trigger confidential computation on protected data
 */
export async function processProtectedData(
  dataProtector: IExecDataProtector,
  protectedDataAddress: string,
  appAddress: string = IEXEC_APP_ADDRESS || ""
): Promise<{ taskId: string; result: unknown }> {
  const response = await dataProtector.processProtectedData({
    protectedData: protectedDataAddress,
    app: appAddress,
    maxPrice: 0,
  }) as any;

  return { 
    taskId: response.taskId || response, 
    result: response.result || null 
  };
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
  protectedDataAddress: string
): Promise<any> {
  const result = await dataProtector.revokeOneAccess({
    protectedData: protectedDataAddress,
  } as any);

  return result;
}
