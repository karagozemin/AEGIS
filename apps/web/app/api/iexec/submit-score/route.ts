import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, keccak256, toBytes, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { AEGIS_RISK_MANAGER_ABI } from '@/lib/contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_PRIVATE_KEY = process.env.IEXEC_BACKEND_PRIVATE_KEY;
const RISK_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_AEGIS_RISK_MANAGER_ADDRESS as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

// Oracle verification at module load — log derived address for debugging
if (BACKEND_PRIVATE_KEY) {
  try {
    const { privateKeyToAccount: pka } = require('viem/accounts');
    const acct = pka(`0x${BACKEND_PRIVATE_KEY.replace('0x', '')}`);
    console.log('[Oracle Check] Backend key derives to:', acct.address);
    console.log('[Oracle Check] Expected teeOracle on contract: should match ^');
  } catch { /* non-fatal */ }
}

/**
 * POST /api/iexec/submit-score
 * Submit TEE-computed risk score to AegisRiskManager contract on Arbitrum Sepolia
 * 
 * The backend wallet acts as the TEE Oracle (authorized to call submitRiskScore).
 * This pattern is used because the contract has onlyTEE modifier.
 */
export async function POST(req: NextRequest) {
  try {
    if (!BACKEND_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Backend private key not configured' },
        { status: 500 }
      );
    }

    if (!RISK_MANAGER_ADDRESS) {
      return NextResponse.json(
        { error: 'Risk manager contract address not configured' },
        { status: 500 }
      );
    }

    const { 
      ownerAddress,
      assetId,
      varScore,
      safeLTV,
      taskId,
      iterations = 5000,
    } = await req.json();

    if (!ownerAddress || !assetId || varScore === undefined || safeLTV === undefined || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields: ownerAddress, assetId, varScore, safeLTV, taskId' },
        { status: 400 }
      );
    }

    console.log('[API:submit-score] Submitting risk score on-chain...');
    console.log('[API:submit-score]   Owner:', ownerAddress);
    console.log('[API:submit-score]   AssetId:', assetId);
    console.log('[API:submit-score]   VaR Score:', varScore, 'bps');
    console.log('[API:submit-score]   Safe LTV:', safeLTV, 'bps');
    console.log('[API:submit-score]   Task ID:', taskId);
    console.log('[API:submit-score]   Iterations:', iterations);

    // Create wallet client from backend private key (this IS the teeOracle)
    const account = privateKeyToAccount(`0x${BACKEND_PRIVATE_KEY.replace('0x', '')}`);
    
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(RPC_URL),
    });

    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(RPC_URL),
    });

    // Verify this account is the teeOracle
    const teeOracle = await publicClient.readContract({
      address: RISK_MANAGER_ADDRESS,
      abi: AEGIS_RISK_MANAGER_ABI,
      functionName: 'teeOracle',
    });

    if (teeOracle.toLowerCase() !== account.address.toLowerCase()) {
      console.error('[API:submit-score] ❌ Account is not the TEE oracle!');
      console.error('[API:submit-score]   Expected:', teeOracle);
      console.error('[API:submit-score]   Got:', account.address);
      return NextResponse.json(
        { error: 'Backend wallet is not authorized as TEE oracle' },
        { status: 403 }
      );
    }

    console.log('[API:submit-score] ✅ TEE Oracle verified:', account.address);

    // Convert assetId string to bytes32 (hash it like frontend does)
    const assetIdBytes32 = assetId.startsWith('0x') && assetId.length === 66
      ? assetId as `0x${string}`
      : keccak256(toBytes(assetId));

    // Convert taskId to bytes32
    const taskIdBytes32 = taskId.startsWith('0x') && taskId.length === 66
      ? taskId as `0x${string}`
      : keccak256(toBytes(taskId));

    // Submit the risk score on-chain
    const hash = await walletClient.writeContract({
      address: RISK_MANAGER_ADDRESS,
      abi: AEGIS_RISK_MANAGER_ABI,
      functionName: 'submitRiskScore',
      args: [
        ownerAddress as `0x${string}`,
        assetIdBytes32,
        BigInt(varScore),
        BigInt(safeLTV),
        taskIdBytes32,
        BigInt(iterations),
      ],
    });

    console.log('[API:submit-score] ⏳ Transaction sent:', hash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log('[API:submit-score] ✅ Transaction confirmed!');
    console.log('[API:submit-score]   Block:', receipt.blockNumber);
    console.log('[API:submit-score]   Gas used:', receipt.gasUsed.toString());
    console.log('[API:submit-score]   Status:', receipt.status);

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `https://sepolia.arbiscan.io/tx/${hash}`,
    });

  } catch (error: any) {
    console.error('[API:submit-score] ❌ Failed:', error);

    // Handle specific contract errors
    if (error?.message?.includes('UnauthorizedOracle')) {
      return NextResponse.json(
        { error: 'Backend wallet not authorized as TEE oracle. Run setTEEOracle on contract.' },
        { status: 403 }
      );
    }
    if (error?.message?.includes('InsufficientIterations')) {
      return NextResponse.json(
        { error: 'Minimum 5000 Monte Carlo iterations required' },
        { status: 400 }
      );
    }
    if (error?.message?.includes('InvalidVaRScore')) {
      return NextResponse.json(
        { error: 'VaR score exceeds maximum (10000 bps)' },
        { status: 400 }
      );
    }
    if (error?.message?.includes('InvalidLTV')) {
      return NextResponse.json(
        { error: 'LTV exceeds maximum (10000 bps)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to submit score on-chain' },
      { status: 500 }
    );
  }
}
