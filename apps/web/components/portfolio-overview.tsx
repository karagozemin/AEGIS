"use client";

import { TrendingUp, Shield, AlertTriangle, DollarSign, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatBps } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
  varScore: number | null;
  safeLTV: number | null;
  status: "pending" | "protected" | "computing" | "computed";
}

interface PortfolioOverviewProps {
  assets: Asset[];
}

export function PortfolioOverview({ assets }: PortfolioOverviewProps) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const computedAssets = assets.filter((a) => a.status === "computed");
  const protectedAssets = assets.filter((a) => a.status === "protected" || a.status === "computed");
  const totalVaR = computedAssets.reduce(
    (sum, asset) => sum + (asset.varScore || 0),
    0
  );
  const avgLTV =
    computedAssets.length > 0
      ? computedAssets.reduce((sum, asset) => sum + (asset.safeLTV || 0), 0) /
        computedAssets.length
      : 0;
  const pendingCount = assets.filter((a) => a.status === "pending" || a.status === "protected").length;

  const stats = [
    {
      label: "Total Portfolio Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: "text-aegis-steel-200",
    },
    {
      label: "Aggregate VaR (95%)",
      value: totalVaR > 0 ? formatCurrency(totalVaR) : "—",
      icon: AlertTriangle,
      color: totalVaR > 0 ? "text-aegis-amber" : "text-aegis-steel-500",
    },
    {
      label: "Average Safe LTV",
      value: avgLTV > 0 ? formatBps(avgLTV) : "—",
      icon: TrendingUp,
      color: avgLTV > 0 ? "text-aegis-cyan" : "text-aegis-steel-500",
    },
    {
      label: "Protected / Computed",
      value: `${protectedAssets.length} / ${computedAssets.length}`,
      icon: Shield,
      color:
        computedAssets.length === assets.length && assets.length > 0
          ? "text-green-400"
          : protectedAssets.length > 0
            ? "text-aegis-cyan"
            : "text-aegis-steel-500",
      subtext: pendingCount > 0 
        ? `${pendingCount} ready for compute` 
        : assets.length === 0 
          ? "No assets yet"
          : "All computed",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-aegis-steel-400">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
                {stat.subtext && (
                  <p className="text-xs text-aegis-steel-500 mt-1">
                    {stat.subtext}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-aegis-steel-800 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
