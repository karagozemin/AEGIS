import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/iexec/protect
 * Encrypt and store asset data on IPFS via iExec DataProtector SDK (Server-side)
 */
export async function POST(req: NextRequest) {
  try {
    const { assetValue, assetVolatility, name, userAddress } = await req.json();

    if (!assetValue || !assetVolatility || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[API] Protecting data for user:', userAddress);
    console.log('[API] Asset Value:', assetValue, 'Volatility:', assetVolatility);

    // Dynamically import iExec DataProtector SDK (server-side only)
    const { IExecDataProtectorCore } = await import('@iexec/dataprotector');
    const { utils } = await import('iexec');
    
    // Get private key from environment
    const privateKey = process.env.IEXEC_BACKEND_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('IEXEC_BACKEND_PRIVATE_KEY not configured');
    }

    // Use Arbitrum Sepolia RPC
    const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
    
    // Create signer from private key using iExec utils
    const ethProvider = utils.getSignerFromPrivateKey(RPC_URL, privateKey);
    
    console.log('[API] Initializing DataProtectorCore with Arbitrum Sepolia signer...');
    
    // Initialize DataProtectorCore with the signer
    const dataProtectorCore = new IExecDataProtectorCore(ethProvider);

    console.log('[API] DataProtectorCore initialized, protecting data...');

    // Prepare data for protection
    const dataToProtect = {
      assetValue: Math.round(assetValue * 100), // Store as cents
      assetVolatility: Math.round(assetVolatility * 10000), // Store as basis points
      owner: userAddress,
      timestamp: Date.now(),
    };

    // Protect data using DataProtectorCore
    const protectedData = await dataProtectorCore.protectData({
      data: dataToProtect,
      name: name || 'Asset Data',
    });

    console.log('[API] Data protected successfully!');
    console.log('[API] Protected Data Address:', protectedData.address);
    console.log('[API] Protected Data Name:', protectedData.name);

    return NextResponse.json({
      name: protectedData.name,
      address: protectedData.address,
      owner: userAddress,
      creationTimestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[API] Failed to protect data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to protect data' },
      { status: 500 }
    );
  }
}
