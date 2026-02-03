"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, RefreshCw, Mail } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetProtectionForm } from "@/components/asset-protection-form";
import { RiskScoreCard } from "@/components/risk-score-card";
import { TEEExecutionPanel } from "@/components/tee-execution-panel";
import { PortfolioOverview } from "@/components/portfolio-overview";

// Mock data for demo
const mockAssets = [
  {
    id: "0x1234...5678",
    name: "Commercial Real Estate",
    value: 2500000,
    volatility: 0.15,
    varScore: 187500,
    safeLTV: 7200,
    status: "computed" as const,
    taskId: "0xabc...def",
  },
  {
    id: "0x8765...4321",
    name: "Corporate Bond Portfolio",
    value: 1000000,
    volatility: 0.08,
    varScore: 48000,
    safeLTV: 8500,
    status: "computed" as const,
    taskId: "0xfed...cba",
  },
  {
    id: "0x9999...1111",
    name: "Mixed Asset Fund",
    value: 750000,
    volatility: 0.22,
    varScore: null,
    safeLTV: null,
    status: "pending" as const,
    taskId: null,
  },
];

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const [assets, setAssets] = useState(mockAssets);
  const [isAddingAsset, setIsAddingAsset] = useState(false);

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
            <Button
              variant="outline"
              size="sm"
              className="border-aegis-steel-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Setup Web3Mail
            </Button>
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
          <PortfolioOverview assets={assets} />

          {/* Tabs */}
          <Tabs defaultValue="assets" className="mt-8">
            <TabsList className="bg-aegis-steel-900 border border-aegis-steel-800">
              <TabsTrigger value="assets">Protected Assets</TabsTrigger>
              <TabsTrigger value="compute">TEE Compute</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RiskScoreCard asset={asset} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compute" className="mt-6">
              <TEEExecutionPanel
                assets={assets.filter((a) => a.status === "pending")}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="card-industrial rounded-xl border border-aegis-steel-800 p-8 text-center">
                <RefreshCw className="w-12 h-12 text-aegis-steel-600 mx-auto mb-4" />
                <p className="text-aegis-steel-400">
                  Computation history will appear here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Asset Dialog */}
      <AssetProtectionForm
        open={isAddingAsset}
        onOpenChange={setIsAddingAsset}
        onSubmit={(asset) => {
          setAssets([
            ...assets,
            {
              ...asset,
              id: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
              varScore: null,
              safeLTV: null,
              status: "pending" as const,
              taskId: null,
            },
          ]);
          setIsAddingAsset(false);
        }}
      />
    </main>
  );
}
