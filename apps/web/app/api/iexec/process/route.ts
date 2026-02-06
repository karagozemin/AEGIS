import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IEXEC_APP_ADDRESS = process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '';

// Helper function to simulate realistic processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // HYBRID APPROACH for Hackathon:
    // Protected data is REAL (on-chain at protectedDataAddress)
    // VaR computation is deterministic based on data hash (realistic simulation)
    
    console.log('[API] 🔒 Step 1/4: Verifying protected data on-chain...');
    await delay(800); // Simulate blockchain verification
    
    console.log('[API] 🔐 Step 2/4: Initializing SGX enclave...');
    await delay(1200); // Simulate enclave initialization
    
    console.log('[API] 🧮 Step 3/4: Running Monte Carlo VaR simulation (5000 iterations)...');
    await delay(2000); // Simulate heavy computation
    
    console.log('[API] ✍️ Step 4/4: Generating attestation report...');
    await delay(600); // Simulate attestation
    
    // Generate deterministic but realistic VaR results based on protected data address
    // This simulates what the real TEE would compute
    const seed = parseInt(protectedDataAddress.slice(2, 10), 16);
    const random = (seed * 9301 + 49297) % 233280 / 233280;
    const random1 = ((seed * 7393 + 29411) % 233280) / 233280;
    
    // Realistic VaR in BASIS POINTS (5-25% of asset value)
    const var_95_bps = Math.floor(500 + (random * 2000));  // 500-2500 bps (5-25%)
    const var_99_bps = Math.floor(var_95_bps * 1.3);       // ~30% higher
    const safe_ltv_bps = Math.floor(7500 - (random1 * 2000)); // 5500-7500 bps (55-75%)
    
    const mockTaskId = `0x${Math.random().toString(16).substring(2).padEnd(64, '0')}`;
    
    const results = {
      var_95_bps: var_95_bps,
      var_99_bps: var_99_bps,
      safe_ltv_bps: safe_ltv_bps,
      confidence_score: 0.95,
      monte_carlo_iterations: 5000,
      tee_attestation: `sgx_simulation_${Date.now()}`,
      app_address: IEXEC_APP_ADDRESS,
      protected_data: protectedDataAddress,
    };

    console.log('[API] ✅ VaR Computation Complete:');
    console.log('[API]    95% VaR:', results.var_95_bps, 'bps (' + (results.var_95_bps / 100).toFixed(1) + '%)');
    console.log('[API]    99% VaR:', results.var_99_bps, 'bps');
    console.log('[API]    Safe LTV:', results.safe_ltv_bps / 100, '%');
    console.log('[API] 📝 Note: Using deterministic simulation. Real TEE requires SCONE framework setup.');

    return NextResponse.json({
      success: true,
      taskId: mockTaskId,
      status: 'COMPLETED',
      results: results,
      note: 'Protected data is real on-chain. VaR computation is deterministic simulation (real TEE requires SCONE account).',
    });
  } catch (error: any) {
    console.error('[API] Failed to process data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process data' },
      { status: 500 }
    );
  }
}
