"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetProtectionForm } from "@/components/asset-protection-form";
import { RiskScoreCard } from "@/components/risk-score-card";
import { TEEExecutionPanel } from "@/components/tee-execution-panel";
import { PortfolioOverview } from "@/components/portfolio-overview";
import { useAssets } from "@/hooks/useAssets";

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const { assets, addAsset, updateAsset, removeAsset, isLoading } = useAssets();
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const handleAssetSubmit = (assetData: {
    name: string;
    value: number;
    volatility: number;
    protectedDataAddress: string;
  }) => {
    // Create asset with protected data address already set
    const newAsset = addAsset({
      name: assetData.name,
      value: assetData.value,
      volatility: assetData.volatility,
    });

    // Immediately update with protected data address
    updateAsset(newAsset.id, {
      protectedDataAddress: assetData.protectedDataAddress,
      status: "protected",
    });

    setIsAddingAsset(false);
  };

  const handleComputeComplete = (
    assetId: string,
    result: { varScore: number; safeLTV: number; taskId: string }
  ) => {
    updateAsset(assetId, {
      varScore: result.varScore,
      safeLTV: result.safeLTV,
      taskId: result.taskId,
      status: "computed",
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      removeAsset(assetId);
    }
  };

  // Convert Asset to display format
  const displayAssets = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    value: asset.value,
    volatility: asset.volatility,
    varScore: asset.varScore,
    safeLTV: asset.safeLTV,
    status: asset.status,
    taskId: asset.taskId,
    protectedDataAddress: asset.protectedDataAddress,
  }));

  const pendingAssets = assets.filter(
    (a) => a.status === "pending" || a.status === "protected"
  );

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-industrial">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <Shield className="w-16 h-16 text-aegis-cyan mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-aegis-steel-400 mb-8">
            Please connect your wallet to access the dashboard
          </p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-industrial">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-aegis-steel-800 sticky top-0 bg-aegis-steel-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-aegis-cyan" />
            <span className="text-xl font-bold tracking-tight">
              AEGIS<span className="text-aegis-cyan">PRIME</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Risk Dashboard</h1>
              <p className="text-aegis-steel-400">
                Manage your protected assets and view TEE-attested risk scores
              </p>
            </div>
            <Button
              onClick={() => setIsAddingAsset(true)}
              className="bg-aegis-cyan hover:bg-aegis-cyan-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          {/* Portfolio Overview */}
          <PortfolioOverview assets={displayAssets} />

          {/* Tabs */}
          <Tabs defaultValue="assets" className="mt-8">
            <TabsList className="bg-aegis-steel-900 border border-aegis-steel-800">
              <TabsTrigger value="assets">
                Protected Assets ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="compute">
                TEE Compute ({pendingAssets.length} pending)
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-aegis-cyan mx-auto animate-spin mb-4" />
                  <p className="text-aegis-steel-400">Loading assets...</p>
                </div>
              ) : assets.length === 0 ? (
                <div className="card-industrial rounded-xl border border-aegis-steel-800 p-12 text-center">
                  <Shield className="w-12 h-12 text-aegis-steel-600 mx-auto mb-4" />
                  <p className="text-aegis-steel-300 font-medium mb-2">
                    No assets yet
                  </p>
                  <p className="text-aegis-steel-500 text-sm mb-6">
                    Add your first asset to start computing risk scores
                  </p>
                  <Button
                    onClick={() => setIsAddingAsset(true)}
                    className="bg-aegis-cyan hover:bg-aegis-cyan-light"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Asset
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayAssets.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <RiskScoreCard asset={asset} />
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="compute" className="mt-6">
              <TEEExecutionPanel
                assets={pendingAssets}
                onComputeComplete={handleComputeComplete}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="card-industrial rounded-xl border border-aegis-steel-800 p-8">
                <h3 className="font-medium mb-4">Computed Assets</h3>
                {assets.filter((a) => a.status === "computed").length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-aegis-steel-600 mx-auto mb-4" />
                    <p className="text-aegis-steel-400">
                      No computed assets yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets
                      .filter((a) => a.status === "computed")
                      .map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between bg-aegis-steel-900 rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-aegis-steel-500">
                              Task: {asset.taskId?.slice(0, 16)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-aegis-cyan font-mono">
                              {asset.safeLTV
                                ? `${(asset.safeLTV / 100).toFixed(1)}% LTV`
                                : "-"}
                            </p>
                            <p className="text-sm text-aegis-steel-500">
                              VaR: $
                              {asset.varScore?.toLocaleString() || "-"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Asset Dialog */}
      <AssetProtectionForm
        open={isAddingAsset}
        onOpenChange={setIsAddingAsset}
        onSubmit={handleAssetSubmit}
      />
    </main>
  );
}
