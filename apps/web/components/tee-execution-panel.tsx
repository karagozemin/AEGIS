"use client";

import { useState } from "react";
import { Cpu, Zap, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
}

interface TEEExecutionPanelProps {
  assets: Asset[];
}

type ExecutionStep = "idle" | "preparing" | "encrypting" | "computing" | "attesting" | "complete";

const steps: { key: ExecutionStep; label: string; description: string }[] = [
  { key: "preparing", label: "Preparing", description: "Initializing TEE task..." },
  { key: "encrypting", label: "Encrypting", description: "Securing data with DataProtector..." },
  { key: "computing", label: "Computing", description: "Running Monte Carlo simulation (5000 iterations)..." },
  { key: "attesting", label: "Attesting", description: "Writing results to Arbitrum Sepolia..." },
  { key: "complete", label: "Complete", description: "Risk scores verified and stored on-chain" },
];

export function TEEExecutionPanel({ assets }: TEEExecutionPanelProps) {
  const [executionStep, setExecutionStep] = useState<ExecutionStep>("idle");
  const [progress, setProgress] = useState(0);

  const executeComputation = async () => {
    if (assets.length === 0) return;

    // Simulate TEE execution steps
    for (let i = 0; i < steps.length; i++) {
      setExecutionStep(steps[i].key);
      setProgress((i + 1) * 20);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Reset after completion
    setTimeout(() => {
      setExecutionStep("idle");
      setProgress(0);
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
            Process {assets.length} asset{assets.length > 1 ? "s" : ""} in a
            single SGX enclave execution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assets to process */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-aegis-steel-300">
              Assets to Process:
            </p>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between bg-aegis-steel-900 rounded-lg p-3"
                >
                  <span className="text-sm">{asset.name}</span>
                  <span className="text-xs font-mono text-aegis-steel-500">
                    {asset.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Progress */}
          {executionStep !== "idle" && (
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
                      <div className="w-4 h-4 rounded-full border-2 border-aegis-cyan border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-aegis-steel-600" />
                    )}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execute Button */}
          <Button
            onClick={executeComputation}
            disabled={executionStep !== "idle"}
            className="w-full bg-aegis-cyan hover:bg-aegis-cyan-light"
          >
            {executionStep === "idle" ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Execute Gasless (Pimlico)
              </>
            ) : executionStep === "complete" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Computation Complete
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-2 animate-pulse" />
                Processing...
              </>
            )}
          </Button>

          {/* Gasless Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-aegis-steel-500">
            <Shield className="w-3 h-3" />
            <span>Sponsored by Pimlico Paymaster - No gas fees</span>
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
              <p className="font-medium text-aegis-steel-200">Data Encryption</p>
              <p>
                Your asset data is encrypted client-side using iExec
                DataProtector before leaving your browser.
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
                The encrypted data is sent to an Intel SGX enclave where it's
                decrypted in a secure memory region.
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
                5,000+ Monte Carlo iterations compute the 95% Value-at-Risk and
                derive a safe LTV ratio.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-aegis-cyan/10 flex items-center justify-center flex-shrink-0">
              <span className="text-aegis-cyan font-bold">4</span>
            </div>
            <div>
              <p className="font-medium text-aegis-steel-200">On-Chain Attestation</p>
              <p>
                Results are cryptographically signed and stored on Arbitrum
                Sepolia via gasless transaction.
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
