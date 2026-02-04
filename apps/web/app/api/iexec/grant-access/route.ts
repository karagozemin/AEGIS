import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '';

/**
 * POST /api/iexec/grant-access
 * Grant access to TEE app for protected data via iExec DataProtector SDK (Server-side)
 */
export async function POST(req: NextRequest) {
  try {
    const { protectedDataAddress, userAddress } = await req.json();

    if (!protectedDataAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[API] Granting access for:', protectedDataAddress);
    console.log('[API] Authorized app:', IEXEC_APP_ADDRESS);
    
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
    
    // Initialize DataProtectorCore with the signer
    const dataProtectorCore = new IExecDataProtectorCore(ethProvider);

    console.log('[API] DataProtectorCore initialized, granting access...');

    // Grant access to the TEE app
    const result = await dataProtectorCore.grantAccess({
      protectedData: protectedDataAddress,
      authorizedApp: IEXEC_APP_ADDRESS,
      authorizedUser: '0x0000000000000000000000000000000000000000', // Any user
      numberOfAccess: 1,
    });

    console.log('[API] Access granted successfully!');
    console.log('[API] Transaction hash:', result.txHash);

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      dataAddress: protectedDataAddress,
      grantedTo: IEXEC_APP_ADDRESS,
    });
  } catch (error: any) {
    console.error('[API] Failed to grant access:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to grant access' },
      { status: 500 }
    );
  }
}
