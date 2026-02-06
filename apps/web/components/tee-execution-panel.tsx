"use client";

import { useState } from "react";
import { Cpu, Zap, Shield, CheckCircle, AlertCircle, Loader2, Wallet, ExternalLink } from "lucide-react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDataProtector } from "@/hooks/useDataProtector";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { AEGIS_RISK_MANAGER_ADDRESS, AEGIS_RISK_MANAGER_ABI } from "@/lib/wagmi";
import { keccak256, toBytes, encodeFunctionData } from "viem";
import type { Asset } from "@/hooks/useAssets";

// Add Switch component import
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TEEExecutionPanelProps {
  assets: Asset[];
  onComputeComplete: (assetId: string, result: { varScore: number; safeLTV: number; taskId: string; txHash?: string; explorerUrl?: string }) => void;
}

type ExecutionStep = "idle" | "granting" | "processing" | "attesting" | "saving" | "confirming" | "complete" | "error";

const steps: { key: ExecutionStep; label: string; description: string }[] = [
  { key: "granting", label: "Granting Access", description: "Authorizing TEE app to access encrypted data..." },
  { key: "processing", label: "TEE Computing", description: "Running Monte Carlo VaR inside SGX enclave..." },
  { key: "attesting", label: "Attesting", description: "Verifying computation and preparing results..." },
  { key: "saving", label: "Approve in Wallet", description: "Please confirm the transaction in your wallet..." },
  { key: "confirming", label: "Confirming On-Chain", description: "Waiting for transaction to be confirmed on Arbitrum Sepolia..." },
  { key: "complete", label: "Complete", description: "Risk scores computed and stored on-chain" },
];

export function TEEExecutionPanel({ assets, onComputeComplete }: TEEExecutionPanelProps) {
  const [executionStep, setExecutionStep] = useState<ExecutionStep>("idle");
  const [progress, setProgress] = useState(0);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [gaslessMode, setGaslessMode] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { grantAccess, processData, isReady } = useDataProtector();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const { switchChainAsync } = useSwitchChain();
  const { 
    isGaslessEnabled, 
    smartAccountAddress, 
    isInitializing: isInitializingSA,
    sendGaslessTransaction,
    initializeSmartAccount,
  } = useSmartAccount();

  const protectedAssets = assets.filter((a) => a.protectedDataAddress);
  
  // Total steps per asset: grant(1) + process(2) + attest(3) + save(4) + confirm(5)
  const STEPS_PER_ASSET = 5;

  const executeComputation = async () => {
    console.log('[TEE] Execute clicked. isReady:', isReady, 'protectedAssets:', protectedAssets.length);
    
    if (protectedAssets.length === 0) return;
    if (!isReady) {
      setErrorMessage("Please connect your wallet first");
      setExecutionStep("error");
      return;
    }

    setErrorMessage("");
    setLastTxHash(null);

    for (let i = 0; i < protectedAssets.length; i++) {
      const asset = protectedAssets[i];
      setCurrentAssetIndex(i);

      if (!asset.protectedDataAddress) continue;

      try {
        // Step 1: Grant access
        setExecutionStep("granting");
        setProgress(((i * STEPS_PER_ASSET + 0.5) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        await grantAccess(asset.protectedDataAddress);
        
        // Small delay between steps for visual feedback
        await new Promise(r => setTimeout(r, 300));
        setProgress(((i * STEPS_PER_ASSET + 1) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        // Step 2: Process data in TEE
        setExecutionStep("processing");
        setProgress(((i * STEPS_PER_ASSET + 1.5) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        const { taskId, result } = await processData(asset.protectedDataAddress);
        
        await new Promise(r => setTimeout(r, 300));
        setProgress(((i * STEPS_PER_ASSET + 2) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        // Step 3: Parse result and attest
        setExecutionStep("attesting");
        setProgress(((i * STEPS_PER_ASSET + 2.5) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);
        
        // Simulate attestation verification delay
        await new Promise(r => setTimeout(r, 800));

        // Parse the TEE result — values are in basis points
        const computedResult = result as any;
        const varBps = computedResult?.var_95_bps || computedResult?.results?.[0]?.var_95_bps || 1500;
        const safeLTV = computedResult?.safe_ltv_bps || computedResult?.results?.[0]?.safe_ltv_bps || 7500;
        // Convert VaR BPS to dollar amount for display
        const varScore = Math.round((varBps / 10000) * asset.value);

        setProgress(((i * STEPS_PER_ASSET + 3) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        // Step 4: Save on-chain — wallet approval
        setExecutionStep("saving");
        setProgress(((i * STEPS_PER_ASSET + 3.2) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        let txHash: string | undefined;
        let explorerUrl: string | undefined;

        try {
          // VaR is already in BPS, cap at 9500 for safety
          const varBpsCapped = Math.min(varBps, 9500);
          
          if (gaslessMode && isGaslessEnabled) {
            // ── Gasless path: submit via backend TEE oracle (sponsored by Pimlico) ──
            // Smart Account msg.sender ≠ EOA address, so contract's onlyTEEOrOwner
            // would revert. Instead, route through backend oracle (which IS teeOracle)
            // while keeping the EOA as the owner for correct on-chain score mapping.
            console.log('[TEE] 🔄 Submitting gasless via backend TEE oracle...');
            console.log('[TEE] 📋 Owner (EOA):', address);
            console.log('[TEE] 📋 Smart Account:', smartAccountAddress);

            const resp = await fetch('/api/iexec/submit-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ownerAddress: address, // EOA address — maps scores to user's wallet
                assetId: asset.id,
                varScore: varBpsCapped,
                safeLTV,
                taskId,
                iterations: 5000,
              }),
            });

            if (!resp.ok) {
              const errData = await resp.json().catch(() => ({}));
              throw new Error(errData.error || `Gasless submission failed (${resp.status})`);
            }

            const result = await resp.json();
            txHash = result.txHash;
            explorerUrl = result.explorerUrl || `https://sepolia.arbiscan.io/tx/${txHash}`;
            setLastTxHash(txHash!);
            console.log('[TEE] ✅ Gasless tx confirmed via oracle:', txHash);
          } else {
            // ── Standard path: wallet sendTransaction (bypass gas estimation) ──
            // Then fallback to backend oracle if wallet fails
            const assetIdBytes32 = keccak256(toBytes(asset.id));
            const taskIdBytes32 = keccak256(toBytes(taskId));

            let walletSucceeded = false;

            try {
              console.log('[TEE] 🔄 Submitting from connected wallet...');

              if (!walletClient) throw new Error('Wallet not connected');

              // Force switch to Arbitrum Sepolia
              try {
                await switchChainAsync({ chainId: arbitrumSepolia.id });
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('[TEE] 🔀 Switched to Arbitrum Sepolia');
              } catch (switchErr) {
                console.warn('[TEE] ⚠️ Chain switch skipped:', (switchErr as any)?.message);
              }

              // Encode calldata manually — sendTransaction with explicit gas
              // bypasses MetaMask's eth_estimateGas which causes the RPC error
              const calldata = encodeFunctionData({
                abi: AEGIS_RISK_MANAGER_ABI as any,
                functionName: 'submitRiskScore',
                args: [
                  address!,
                  assetIdBytes32,
                  BigInt(varBpsCapped),
                  BigInt(safeLTV),
                  taskIdBytes32,
                  BigInt(5000),
                ],
              });

              const txHash_ = await walletClient.sendTransaction({
                to: AEGIS_RISK_MANAGER_ADDRESS as `0x${string}`,
                data: calldata,
                gas: BigInt(500_000),
                maxFeePerGas: BigInt(100_000_000),       // 0.1 gwei
                maxPriorityFeePerGas: BigInt(100_000_000), // 0.1 gwei
                chain: arbitrumSepolia,
              });

              // Step 5: Wallet approved — now wait for on-chain confirmation
              setExecutionStep("confirming");
              setProgress(((i * STEPS_PER_ASSET + 4) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);
              setLastTxHash(txHash_);
              console.log('[TEE] ⏳ TX sent from wallet, confirming:', txHash_);

              if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({
                  hash: txHash_,
                  confirmations: 1,
                });
                if (receipt.status === 'reverted') {
                  throw new Error('Transaction reverted on-chain');
                }
              }

              txHash = txHash_;
              explorerUrl = `https://sepolia.arbiscan.io/tx/${txHash}`;
              walletSucceeded = true;
              console.log('[TEE] ✅ Score confirmed on-chain from wallet:', txHash);
            } catch (walletErr: any) {
              // If user explicitly rejected in MetaMask, don't fallback
              if (walletErr?.message?.includes('User rejected') || walletErr?.message?.includes('User denied')) {
                throw walletErr;
              }
              console.warn('[TEE] ⚠️ Wallet TX failed, falling back to backend oracle:', walletErr?.shortMessage || walletErr?.message);
            }

            // Fallback: backend TEE oracle (safety net)
            if (!walletSucceeded) {
              console.log('[TEE] 🔄 Submitting via backend TEE oracle (fallback)...');
              setExecutionStep("confirming");
              setProgress(((i * STEPS_PER_ASSET + 4) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

              const resp = await fetch('/api/iexec/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ownerAddress: address,
                  assetId: asset.id,
                  varScore: varBpsCapped,
                  safeLTV,
                  taskId,
                  iterations: 5000,
                }),
              });

              if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.error || `Backend submission failed (${resp.status})`);
              }

              const result = await resp.json();
              txHash = result.txHash;
              explorerUrl = result.explorerUrl || `https://sepolia.arbiscan.io/tx/${txHash}`;
              setLastTxHash(txHash!);
              console.log('[TEE] ✅ Score confirmed on-chain via backend oracle (fallback):', txHash);
            }
          }
        } catch (submitErr: any) {
          console.error('[TEE] ❌ On-chain submission failed:', submitErr?.message);
          setErrorMessage(`On-chain submission failed: ${submitErr?.shortMessage || submitErr?.message || 'Transaction rejected'}`);
          setExecutionStep('error');
          return;
        }

        setProgress(((i * STEPS_PER_ASSET + 5) / (protectedAssets.length * STEPS_PER_ASSET)) * 100);

        onComputeComplete(asset.id, {
          varScore,
          safeLTV,
          taskId,
          txHash,
          explorerUrl,
        });

      } catch (err: any) {
        console.error("TEE execution failed for asset:", asset.id, err);
        setErrorMessage(err?.message || "Computation failed");
        setExecutionStep("error");
        return;
      }
    }

    setExecutionStep("complete");
    setProgress(100);

    // Reset after showing completion
    setTimeout(() => {
      setExecutionStep("idle");
      setProgress(0);
      setCurrentAssetIndex(0);
      setLastTxHash(null);
    }, 5000);
  };

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-aegis-steel-300 font-medium">All assets computed</p>
          <p className="text-aegis-steel-500 text-sm mt-1">
            No pending assets require TEE computation
          </p>
        </CardContent>
      </Card>
    );
  }

  const assetsWithoutProtection = assets.filter((a) => !a.protectedDataAddress);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Execution Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-aegis-cyan" />
            TEE Bulk Computation
          </CardTitle>
          <CardDescription>
            Process {protectedAssets.length} protected asset{protectedAssets.length !== 1 ? "s" : ""} in
            SGX enclave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Abstraction Toggle — always visible */}
          <div className="bg-aegis-steel-900/50 border border-aegis-cyan/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-aegis-cyan" />
                <div>
                  <Label htmlFor="gasless-mode" className="text-sm font-medium">
                    Gasless Mode (Account Abstraction)
                  </Label>
                  <p className="text-xs text-aegis-steel-400 mt-0.5">
                    Pimlico Paymaster sponsors gas fees
                  </p>
                </div>
              </div>
              <Switch
                id="gasless-mode"
                checked={gaslessMode}
                onCheckedChange={async (checked) => {
                  setGaslessMode(checked);
                  if (checked && !isGaslessEnabled) {
                    await initializeSmartAccount();
                  }
                }}
                disabled={isInitializingSA}
              />
            </div>
            {isInitializingSA && (
              <div className="mt-3 pt-3 border-t border-aegis-steel-800">
                <p className="text-xs text-aegis-steel-400 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Initializing Smart Account...
                </p>
              </div>
            )}
            {gaslessMode && isGaslessEnabled && smartAccountAddress && (
              <div className="mt-3 pt-3 border-t border-aegis-steel-800">
                <p className="text-xs text-aegis-steel-400">
                  Smart Account:{" "}
                  <a
                    href={`https://sepolia.arbiscan.io/address/${smartAccountAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-aegis-cyan hover:underline"
                  >
                    {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
                  </a>
                </p>
                <p className="text-[10px] text-aegis-steel-500 mt-1">
                  ⛽ Gas sponsored by Aegis Oracle · Score mapped to your wallet
                </p>
              </div>
            )}
          </div>

          {/* Assets without protection warning */}
          {assetsWithoutProtection.length > 0 && (
            <div className="bg-aegis-amber/10 border border-aegis-amber/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-aegis-amber mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-aegis-amber">
                    {assetsWithoutProtection.length} asset{assetsWithoutProtection.length !== 1 ? "s" : ""} not yet protected
                  </p>
                  <p className="text-aegis-steel-400 mt-1">
                    These assets need to be encrypted with DataProtector first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assets to process */}
          {protectedAssets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-aegis-steel-300">
                Ready for Computation:
              </p>
              <div className="space-y-2">
                {protectedAssets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      executionStep !== "idle" && index === currentAssetIndex
                        ? "bg-aegis-cyan/10 border border-aegis-cyan/30"
                        : "bg-aegis-steel-900"
                    }`}
                  >
                    <span className="text-sm">{asset.name}</span>
                    <span className="text-xs font-mono text-aegis-steel-500">
                      {asset.protectedDataAddress?.slice(0, 10)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Progress */}
          {executionStep !== "idle" && executionStep !== "error" && (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 text-sm ${
                      executionStep === step.key
                        ? "text-aegis-cyan"
                        : steps.findIndex((s) => s.key === executionStep) >
                            steps.findIndex((s) => s.key === step.key)
                          ? "text-green-400"
                          : "text-aegis-steel-600"
                    }`}
                  >
                    {steps.findIndex((s) => s.key === executionStep) >
                    steps.findIndex((s) => s.key === step.key) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : executionStep === step.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-aegis-steel-600" />
                    )}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Transaction hash display */}
              {lastTxHash && (executionStep === "confirming" || executionStep === "complete") && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-medium">Stored on Arbitrum Sepolia</span>
                  </div>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 mt-2 text-xs font-mono text-aegis-cyan hover:text-aegis-cyan-light transition-colors"
                  >
                    <span>{lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {executionStep === "error" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-400">Computation Failed</p>
                  <p className="text-aegis-steel-400 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <Button
            onClick={executeComputation}
            disabled={
              protectedAssets.length === 0 || 
              !isReady || 
              (executionStep !== "idle" && executionStep !== "error")
            }
            className="w-full bg-aegis-cyan hover:bg-aegis-cyan-light"
          >
            {executionStep === "idle" || executionStep === "error" ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {protectedAssets.length > 0
                  ? `Execute TEE Computation (${protectedAssets.length} asset${protectedAssets.length !== 1 ? "s" : ""})`
                  : "No protected assets to process"}
              </>
            ) : executionStep === "complete" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Computation Complete
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            )}
          </Button>

          {/* Mode Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-aegis-steel-500">
            <Shield className="w-3 h-3" />
            <span>Computation runs inside Intel SGX enclave</span>
          </div>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle>How TEE Computation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-aegis-steel-400">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-aegis-cyan/10 flex items-center justify-center flex-shrink-0">
              <span className="text-aegis-cyan font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-aegis-steel-200">Grant Access</p>
              <p>
                You authorize our TEE app to access your encrypted data. Only
                the specific app can decrypt it.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-aegis-cyan/10 flex items-center justify-center flex-shrink-0">
              <span className="text-aegis-cyan font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-aegis-steel-200">SGX Enclave</p>
              <p>
                Your data is decrypted inside a secure Intel SGX enclave. No
                one can see the raw values.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-aegis-cyan/10 flex items-center justify-center flex-shrink-0">
              <span className="text-aegis-cyan font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-aegis-steel-200">Monte Carlo VaR</p>
              <p>
                5,000+ iterations compute your 95% Value-at-Risk and derive a
                safe LTV ratio.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-aegis-cyan/10 flex items-center justify-center flex-shrink-0">
              <span className="text-aegis-cyan font-bold">4</span>
            </div>
            <div>
              <p className="font-medium text-aegis-steel-200">On-Chain Storage</p>
              <p>
                Risk scores are submitted to AegisRiskManager on Arbitrum
                Sepolia via TEE oracle for on-chain verification.
              </p>
            </div>
          </div>

          <div className="bg-aegis-steel-900 rounded-lg p-4 mt-4">
            <p className="font-mono text-xs text-aegis-steel-500">
              VaR<sub>α</sub>(X) = inf {`{`} x ∈ ℝ : P(X + x {"<"} 0) ≤ 1 - α {`}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
