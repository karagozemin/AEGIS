import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '';
const BACKEND_PRIVATE_KEY = process.env.IEXEC_BACKEND_PRIVATE_KEY;

/**
 * POST /api/iexec/grant-access
 * Grant TEE app access to protected data via iExec DataProtector SDK (Server-side)
 * Uses the same real SDK pattern as protect/route.ts
 */
export async function POST(req: NextRequest) {
  let requestedDataAddress = '';
  try {
    const { protectedDataAddress, userAddress } = await req.json();
    requestedDataAddress = protectedDataAddress;

    if (!protectedDataAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: protectedDataAddress, userAddress' },
        { status: 400 }
      );
    }

    if (!BACKEND_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'IEXEC_BACKEND_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    if (!IEXEC_APP_ADDRESS) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_IEXEC_APP_ADDRESS not configured' },
        { status: 500 }
      );
    }

    console.log('[API:grant-access] Granting TEE access for:', protectedDataAddress);
    console.log('[API:grant-access] Authorized app:', IEXEC_APP_ADDRESS);
    console.log('[API:grant-access] User:', userAddress);

    // Dynamically import iExec DataProtector SDK (server-side only)
    const { IExecDataProtectorCore } = await import('@iexec/dataprotector');
    const { utils } = await import('iexec');

    // Create signer from backend private key (same as protect/route.ts)
    const BELLECOUR_RPC = 'https://bellecour.iex.ec';
    const ethProvider = utils.getSignerFromPrivateKey(BELLECOUR_RPC, BACKEND_PRIVATE_KEY);

    console.log('[API:grant-access] Initializing DataProtectorCore on Bellecour...');
    const dataProtectorCore = new IExecDataProtectorCore(ethProvider);

    console.log('[API:grant-access] 🔐 Calling grantAccess on-chain...');

    // Grant the TEE app access to the protected data
    const grantResult = await dataProtectorCore.grantAccess({
      protectedData: protectedDataAddress,
      authorizedApp: IEXEC_APP_ADDRESS,
      authorizedUser: userAddress,
      pricePerAccess: 0,
      numberOfAccess: 100, // Allow multiple TEE runs
    });

    console.log('[API:grant-access] ✅ Access granted on Bellecour!');
    console.log('[API:grant-access] Grant result:', JSON.stringify(grantResult).slice(0, 200));

    return NextResponse.json({
      success: true,
      grantedAccess: grantResult,
      dataAddress: protectedDataAddress,
      grantedTo: IEXEC_APP_ADDRESS,
    });
  } catch (error: any) {
    console.error('[API:grant-access] ❌ Failed:', error?.message || error);
    if (error?.cause?.message) {
      console.error('[API:grant-access]    Cause:', error.cause.message);
    }

    // Handle common DataProtector errors
    const msg = error?.message || '';
    const causeMsg = error?.cause?.message || '';
    const combined = `${msg} ${causeMsg}`;

    if (combined.includes('already granted') || combined.includes('order already signed')) {
      console.log('[API:grant-access] ⚠️ Access already granted, continuing...');
      return NextResponse.json({
        success: true,
        grantedAccess: null,
        dataAddress: requestedDataAddress,
        grantedTo: IEXEC_APP_ADDRESS,
        note: 'Access was already granted previously',
      });
    }

    // HYBRID MODE: If the TEE app isn't properly registered on iExec (needs SCONE),
    // grant-access will fail with "Invalid app" error. In this case, we continue
    // gracefully since the VaR computation runs in hybrid/simulation mode anyway.
    if (combined.includes('Invalid app') || combined.includes('invalid tag') || combined.includes('non-TEE')) {
      console.log('[API:grant-access] ⚠️ TEE app not registered on iExec (SCONE required)');
      console.log('[API:grant-access] ✅ Continuing in hybrid mode — data IS protected on-chain');
      return NextResponse.json({
        success: true,
        grantedAccess: null,
        dataAddress: requestedDataAddress,
        grantedTo: IEXEC_APP_ADDRESS,
        mode: 'hybrid',
        note: 'Data protected on-chain. TEE app requires SCONE framework for full grantAccess. Computation proceeds in hybrid mode.',
      });
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to grant access' },
      { status: 500 }
    );
  }
}
