"use client";

import { Shield, Clock, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatBps, getRiskLevel, getRiskColor } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
  varScore: number | null;
  safeLTV: number | null;
  status: "pending" | "protected" | "computing" | "computed";
  taskId: string | null;
  protectedDataAddress?: string | null;
}

interface RiskScoreCardProps {
  asset: Asset;
}

export function RiskScoreCard({ asset }: RiskScoreCardProps) {
  const riskLevel = asset.varScore
    ? getRiskLevel(asset.varScore, asset.value)
    : null;
  const riskColor = riskLevel ? getRiskColor(riskLevel) : "";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">
              {asset.protectedDataAddress
                ? `${asset.protectedDataAddress.slice(0, 10)}...${asset.protectedDataAddress.slice(-6)}`
                : asset.id.slice(0, 16)}
            </CardDescription>
          </div>
          <StatusBadge status={asset.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Asset Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-aegis-steel-400">Asset Value</span>
          <span className="font-mono font-semibold">
            {formatCurrency(asset.value)}
          </span>
        </div>

        {/* Volatility */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-aegis-steel-400">Volatility</span>
          <span className="font-mono">{(asset.volatility * 100).toFixed(1)}%</span>
        </div>

        {/* Protected Data Info */}
        {asset.protectedDataAddress && asset.status !== "computed" && (
          <div className="flex items-center gap-2 text-xs text-aegis-cyan bg-aegis-cyan/5 rounded-lg p-3">
            <Lock className="w-4 h-4" />
            <span>Data encrypted on iExec</span>
          </div>
        )}

        {/* VaR Score */}
        {asset.status === "computed" && asset.varScore !== null ? (
          <>
            <div className="pt-4 border-t border-aegis-steel-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-aegis-steel-400">VaR (95%)</span>
                <span className={`font-mono font-semibold ${riskColor}`}>
                  {formatCurrency(asset.varScore)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-aegis-steel-500">
                <AlertTriangle className="w-3 h-3" />
                <span>
                  {((asset.varScore / asset.value) * 100).toFixed(1)}% potential
                  loss
                </span>
              </div>
            </div>

            {/* Safe LTV */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-aegis-steel-400">Safe LTV</span>
                <span className="font-mono font-bold text-aegis-cyan">
                  {formatBps(asset.safeLTV!)}
                </span>
              </div>
              <Progress value={asset.safeLTV! / 100} className="h-2" />
              <p className="text-xs text-aegis-steel-500">
                TEE-attested maximum Loan-to-Value ratio
              </p>
            </div>

            {/* Task ID */}
            <div className="pt-4 border-t border-aegis-steel-800">
              <div className="flex items-center gap-2 text-xs text-aegis-steel-500">
                <Shield className="w-3 h-3 text-aegis-cyan" />
                <span>TEE Task: {asset.taskId?.slice(0, 16)}...</span>
              </div>
            </div>
          </>
        ) : (
          <div className="pt-4 border-t border-aegis-steel-800">
            <div className="bg-aegis-steel-900 rounded-lg p-4 text-center">
              {asset.status === "computing" ? (
                <>
                  <div className="w-8 h-8 border-2 border-aegis-cyan border-t-transparent rounded-full mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-aegis-steel-400">
                    Computing VaR in SGX enclave...
                  </p>
                </>
              ) : asset.status === "protected" ? (
                <>
                  <Lock className="w-8 h-8 text-aegis-cyan mx-auto mb-2" />
                  <p className="text-sm text-aegis-steel-400">
                    Ready for TEE computation
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-8 h-8 text-aegis-steel-600 mx-auto mb-2" />
                  <p className="text-sm text-aegis-steel-400">
                    Awaiting data protection
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Asset["status"] }) {
  switch (status) {
    case "computed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
          <CheckCircle className="w-3 h-3" />
          Verified
        </span>
      );
    case "computing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-aegis-cyan/10 text-aegis-cyan text-xs">
          <div className="w-2 h-2 rounded-full bg-aegis-cyan animate-pulse" />
          Computing
        </span>
      );
    case "protected":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
          <Lock className="w-3 h-3" />
          Protected
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-aegis-amber/10 text-aegis-amber text-xs">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
  }
}
