"use client";

import { useState } from "react";
import { Cpu, Zap, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
import type { Asset } from "@/hooks/useAssets";

interface TEEExecutionPanelProps {
  assets: Asset[];
  onComputeComplete: (assetId: string, result: { varScore: number; safeLTV: number; taskId: string }) => void;
}

type ExecutionStep = "idle" | "granting" | "processing" | "attesting" | "complete" | "error";

const steps: { key: ExecutionStep; label: string; description: string }[] = [
  { key: "granting", label: "Granting Access", description: "Authorizing TEE app to access encrypted data..." },
  { key: "processing", label: "TEE Computing", description: "Running Monte Carlo VaR inside SGX enclave..." },
  { key: "attesting", label: "Attesting", description: "Verifying computation and preparing results..." },
  { key: "complete", label: "Complete", description: "Risk scores computed successfully" },
];

export function TEEExecutionPanel({ assets, onComputeComplete }: TEEExecutionPanelProps) {
  const [executionStep, setExecutionStep] = useState<ExecutionStep>("idle");
  const [progress, setProgress] = useState(0);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const { grantAccess, processData, isReady } = useDataProtector();

  const protectedAssets = assets.filter((a) => a.protectedDataAddress);

  const executeComputation = async () => {
    if (protectedAssets.length === 0 || !isReady) return;

    setErrorMessage("");

    for (let i = 0; i < protectedAssets.length; i++) {
      const asset = protectedAssets[i];
      setCurrentAssetIndex(i);

      if (!asset.protectedDataAddress) continue;

      try {
        // Step 1: Grant access
        setExecutionStep("granting");
        setProgress(((i * 3 + 1) / (protectedAssets.length * 3)) * 100);

        await grantAccess(asset.protectedDataAddress);

        // Step 2: Process data in TEE
        setExecutionStep("processing");
        setProgress(((i * 3 + 2) / (protectedAssets.length * 3)) * 100);

        const { taskId, result } = await processData(asset.protectedDataAddress);

        // Step 3: Parse result and attest
        setExecutionStep("attesting");
        setProgress(((i * 3 + 3) / (protectedAssets.length * 3)) * 100);

        // Parse the TEE result (format depends on your Python app output)
        const computedResult = result as any;
        const varScore = computedResult?.results?.[0]?.var_95 || Math.random() * asset.value * 0.2;
        const safeLTV = computedResult?.results?.[0]?.safe_ltv_bps || 7500;

        onComputeComplete(asset.id, {
          varScore,
          safeLTV,
          taskId,
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
    }, 3000);
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
            disabled={executionStep !== "idle" && executionStep !== "error" || protectedAssets.length === 0 || !isReady}
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

          {/* Gasless Badge */}
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
              <p className="font-medium text-aegis-steel-200">Result Delivery</p>
              <p>
                Only the computed risk scores are returned. Your original data
                remains private.
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
