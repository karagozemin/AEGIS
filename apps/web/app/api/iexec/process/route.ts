import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '';

/**
 * POST /api/iexec/process
 * Process protected data in TEE via iExec DataProtector SDK (Server-side)
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

    if (!IEXEC_APP_ADDRESS) {
      return NextResponse.json(
        { error: 'iExec app address not configured' },
        { status: 500 }
      );
    }

    console.log('[API] Processing data in TEE:', protectedDataAddress);
    console.log('[API] User:', userAddress);
    console.log('[API] App:', IEXEC_APP_ADDRESS);

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

    console.log('[API] DataProtectorCore initialized, processing protected data in TEE...');

    // Process protected data in TEE
    const result = await dataProtectorCore.processProtectedData({
      protectedData: protectedDataAddress,
      app: IEXEC_APP_ADDRESS,
      maxPrice: 0, // Free for hackathon/testnet
      args: '--var-confidence 0.95 --ltv-target 7500', // VaR computation args
    });

    console.log('[API] TEE processing initiated!');
    console.log('[API] Task ID:', result.taskId);

    // For hackathon: poll for result or return task ID for frontend to poll
    // In production, you'd use webhooks or polling mechanism
    
    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      status: 'PENDING',
      message: 'TEE computation initiated. Use taskId to fetch results.',
    });
  } catch (error: any) {
    console.error('[API] Failed to process data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process data' },
      { status: 500 }
    );
  }
}
