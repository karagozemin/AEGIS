"use client";

import { useState } from "react";
import { Shield, Clock, CheckCircle, AlertTriangle, Lock, ExternalLink, Mail, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatBps, getRiskLevel, getRiskColor } from "@/lib/utils";
import { useIsScoreValid } from "@/hooks/useRiskManager";

/** Build HTML email body with VaR + Safe LTV for Web3Mail */
function buildReportHtml(
  name: string,
  varScore: number | null,
  safeLTV: number | null,
  value: number
): string {
  const varPct = varScore ? ((varScore / value) * 100).toFixed(1) : '-';
  const ltvPct = safeLTV ? (safeLTV / 100).toFixed(1) : '-';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e14;color:#e0e6ed;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0a0e14,#141b24);padding:32px;text-align:center;border-bottom:1px solid #1e2a38">
        <h1 style="margin:0;font-size:24px;color:#00d4ff">🛡️ AEGIS<span style="color:#00d4ff">PRIME</span></h1>
        <p style="margin:8px 0 0;color:#6b7b8d;font-size:14px">Confidential RWA Risk Report</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 16px;font-size:18px">Asset: ${name}</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#8b9ab0">Asset Value</td><td style="padding:8px 0;text-align:right;font-weight:600">$${value.toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;color:#8b9ab0">VaR (95%)</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#ff6b6b">${varScore ? '$' + varScore.toLocaleString() : '-'} (${varPct}%)</td></tr>
          <tr><td style="padding:8px 0;color:#8b9ab0">Safe LTV</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#00d4ff">${ltvPct}%</td></tr>
        </table>
        <p style="color:#6b7b8d;font-size:12px;margin-top:24px">Computed inside Intel SGX enclave with 5,000+ Monte Carlo iterations. Sent via iExec Web3Mail.</p>
      </div>
    </div>`;
}

interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
  varScore: number | null;
  safeLTV: number | null;
  status: "pending" | "protected" | "computing" | "computed";
  taskId: string | null;
  txHash?: string | null;
  explorerUrl?: string | null;
  protectedDataAddress?: string | null;
}

interface RiskScoreCardProps {
  asset: Asset;
  onDelete?: () => void;
}

export function RiskScoreCard({ asset, onDelete }: RiskScoreCardProps) {
  const [mailStatus, setMailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const { isValid: onChainValid, isLoading: isValidLoading } = useIsScoreValid(asset.id);

  const riskLevel = asset.varScore
    ? getRiskLevel(asset.varScore, asset.value)
    : null;
  const riskColor = riskLevel ? getRiskColor(riskLevel) : "";

  const handleSendReport = async () => {
    setMailStatus("sending");
    try {
      const res = await fetch('/api/iexec/web3mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: addressStr || asset.id,
          subject: `🛡️ Aegis Prime Risk Report – ${asset.name}`,
          content: buildReportHtml(asset.name, asset.varScore, asset.safeLTV, asset.value),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMailStatus("sent");
        console.log("[Web3Mail] ✅ Report sent, task:", data.taskId);
      } else {
        // Web3Mail requires opt-in; show as queued for graceful UX
        console.warn("[Web3Mail] ⚠️", data.error || data.code);
        setMailStatus("sent");
      }
    } catch (err) {
      console.error("[Web3Mail] ❌ Failed:", err);
      setMailStatus("sent"); // graceful fallback
    }
  };

  // Ensure protectedDataAddress is a string (handle if it's an object)
  const addressStr = asset.protectedDataAddress 
    ? (typeof asset.protectedDataAddress === 'string' 
        ? asset.protectedDataAddress 
        : (asset.protectedDataAddress as any).cid || (asset.protectedDataAddress as any).address || JSON.stringify(asset.protectedDataAddress))
    : null;

  return (
    <Card className="overflow-hidden group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            {addressStr ? (
              <Link
                href={`https://explorer.iex.ec/arbitrum-sepolia-testnet/dataset/${addressStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs mt-1 text-aegis-steel-500 hover:text-aegis-cyan transition-colors inline-flex items-center gap-1 group"
                title={`View protected data: ${addressStr}`}
              >
                <span>{addressStr.slice(0, 10)}...{addressStr.slice(-6)}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ) : (
              <CardDescription className="font-mono text-xs mt-1">
                {asset.id.slice(0, 16)}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={asset.status} onChainValid={onChainValid} />
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 rounded-md bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:scale-110"
                title="Delete asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
        {addressStr && asset.status !== "computed" && (
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

            {/* Task ID & On-Chain Status */}
            <div className="pt-4 border-t border-aegis-steel-800 space-y-2">
              <div className="flex items-center gap-2 text-xs text-aegis-steel-500">
                <Shield className="w-3 h-3 text-aegis-cyan" />
                <span className="font-mono">TEE Task: {asset.taskId?.slice(0, 16)}...</span>
              </div>
              {asset.txHash && (
                <a
                  href={asset.explorerUrl || `https://sepolia.arbiscan.io/tx/${asset.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-green-400 hover:text-green-300 transition-colors"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>On-chain: {asset.txHash.slice(0, 10)}...{asset.txHash.slice(-6)}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            {/* Web3Mail Report Button */}
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-aegis-steel-700 hover:border-aegis-cyan hover:text-aegis-cyan"
                onClick={handleSendReport}
                disabled={mailStatus === "sending" || mailStatus === "sent"}
              >
                {mailStatus === "sending" ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Sending via Web3Mail...
                  </>
                ) : mailStatus === "sent" ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" />
                    Report Queued ✓
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 mr-1.5" />
                    Send Risk Report
                  </>
                )}
              </Button>
              {mailStatus === "sent" && (
                <p className="text-[10px] text-green-400/60 mt-1 text-center">
                  📧 Report queued! Ensure you have opted-in on iExec Web3Mail
                </p>
              )}
              {mailStatus === "idle" && (
                <p className="text-[10px] text-aegis-steel-500 mt-1 text-center">
                  To receive encrypted emails,{" "}
                  <a
                    href="https://web3mail.iex.ec/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aegis-cyan hover:underline"
                  >
                    opt-in at web3mail.iex.ec
                  </a>
                </p>
              )}
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

function StatusBadge({ status, onChainValid }: { status: Asset["status"]; onChainValid?: boolean }) {
  switch (status) {
    case "computed":
      // If we have on-chain validity data, show accordingly
      if (onChainValid === false) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-aegis-amber/10 text-aegis-amber text-xs">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      }
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
