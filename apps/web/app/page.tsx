"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Cpu, ArrowRight, ExternalLink, FileCheck, Zap, Eye, EyeOff, Database, Link2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gradient-industrial">
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-aegis-steel-800 bg-aegis-steel-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/aegis-logo.png"
              alt="Aegis Prime Logo"
              width={56}
              height={56}
              className="w-14 h-14 transition-transform group-hover:scale-110"
            />
            <span className="text-2xl font-bold tracking-tight">
              AEGIS<span className="text-aegis-cyan">PRIME</span>
            </span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aegis-steel-800/50 border border-aegis-steel-700 text-sm text-aegis-steel-300">
              <span className="w-2 h-2 rounded-full bg-aegis-cyan animate-pulse" />
              iExec Hack4Privacy Hackathon
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Confidential RWA
            <br />
            <span className="text-glow-cyan text-aegis-cyan">Risk Engine</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-aegis-steel-400 max-w-3xl mx-auto mb-4"
          >
            Prove your solvency to DeFi lenders <strong className="text-white">without revealing sensitive financial data</strong>.
            Asset values are encrypted with iExec DataProtector, risk scores are computed via Monte Carlo simulation,
            and results are written on-chain — all while your data stays confidential.
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-sm text-aegis-steel-500 max-w-2xl mx-auto mb-10"
          >
            The first protocol to combine encrypted data storage, confidential computing,
            and on-chain risk attestation into a single verifiable pipeline.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isConnected ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan"
                >
                  Launch Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button
                    size="lg"
                    onClick={openConnectModal}
                    className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan"
                  >
                    Connect Wallet to Start
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
            <Link
              href="https://github.com/karagozemin/AEGIS"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-aegis-steel-700 hover:bg-aegis-steel-800"
              >
                View on GitHub
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* The Problem → Solution Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-12">
            The Problem We Solve
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Today&apos;s DeFi Lending</h3>
              </div>
              <ul className="space-y-3 text-aegis-steel-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Asset owners must expose sensitive financials to get a risk score</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Risk calculations happen in centralized black boxes — unverifiable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Scores are off-chain — DeFi protocols can&apos;t read or trust them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>No way to prove &quot;I&apos;m solvent&quot; without revealing how much you own</span>
                </li>
              </ul>
            </motion.div>

            {/* Solution */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-aegis-cyan/20 bg-aegis-cyan/5 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <EyeOff className="w-5 h-5 text-aegis-cyan" />
                <h3 className="text-lg font-semibold text-aegis-cyan">With Aegis Prime</h3>
              </div>
              <ul className="space-y-3 text-aegis-steel-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-aegis-cyan mt-0.5">✓</span>
                  <span>Data is <strong className="text-white">encrypted before leaving your browser</strong> via iExec DataProtector</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aegis-cyan mt-0.5">✓</span>
                  <span>Risk computed inside <strong className="text-white">Intel SGX enclaves</strong> — even Aegis can&apos;t see your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aegis-cyan mt-0.5">✓</span>
                  <span>Scores are <strong className="text-white">written on-chain</strong> with 7-day validity — any DeFi protocol can read</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aegis-cyan mt-0.5">✓</span>
                  <span>Prove solvency with a <strong className="text-white">verifiable VaR score</strong> — zero data exposure</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works — Pipeline */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-4">
            How It Works
          </motion.h2>
          <motion.p variants={itemVariants} className="text-center text-aegis-steel-400 mb-12 max-w-2xl mx-auto">
            A four-step pipeline from raw data to on-chain verified risk score — your data stays encrypted throughout.
          </motion.p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Lock,
                title: "Encrypt & Protect",
                desc: "Asset data (value, volatility) is AES-encrypted via iExec DataProtector and stored on IPFS. Only authorized TEE enclaves can decrypt it.",
                tech: "iExec DataProtector · Bellecour",
                color: "text-blue-400",
                borderColor: "border-blue-500/20",
              },
              {
                step: "02",
                icon: Cpu,
                title: "TEE Computation",
                desc: "5,000+ Monte Carlo simulations run inside an Intel SGX enclave. The enclave computes 95% VaR and derives Safe LTV ratios.",
                tech: "Intel SGX · Python · NumPy",
                color: "text-aegis-cyan",
                borderColor: "border-aegis-cyan/20",
              },
              {
                step: "03",
                icon: FileCheck,
                title: "On-Chain Attestation",
                desc: "Risk scores are written to AegisRiskManager smart contract on Arbitrum Sepolia. Each score has a 7-day validity period.",
                tech: "Solidity · Arbitrum Sepolia",
                color: "text-green-400",
                borderColor: "border-green-500/20",
              },
              {
                step: "04",
                icon: Zap,
                title: "DeFi Ready",
                desc: "Any DeFi lending protocol can call isScoreValid() to check if a borrower's collateral is healthy — no data exposure needed.",
                tech: "On-Chain · Composable",
                color: "text-aegis-amber",
                borderColor: "border-aegis-amber/20",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={itemVariants}
                className={`card-industrial rounded-xl border ${item.borderColor} p-6 relative`}
              >
                <span className={`text-5xl font-black ${item.color} opacity-10 absolute top-4 right-4`}>
                  {item.step}
                </span>
                <div className={`w-10 h-10 rounded-lg bg-aegis-steel-800 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-aegis-steel-400 text-sm mb-4">{item.desc}</p>
                <span className="text-xs text-aegis-steel-500 font-mono">{item.tech}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Live Contract Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-4">
            Live On-Chain
          </motion.h2>
          <motion.p variants={itemVariants} className="text-center text-aegis-steel-400 mb-10">
            Every component is deployed, verified, and auditable. No mock contracts.
          </motion.p>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {/* Smart Contract */}
            <Link
              href="https://sepolia.arbiscan.io/address/0xaE37446b0e680E524A41D21C41206Cd4d5d03E0C"
              target="_blank"
              rel="noopener noreferrer"
              className="card-industrial rounded-xl border border-aegis-steel-800 p-6 hover:border-aegis-cyan/40 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-aegis-cyan" />
                <h3 className="font-semibold">AegisRiskManager</h3>
                <ExternalLink className="w-3 h-3 text-aegis-steel-500 group-hover:text-aegis-cyan ml-auto" />
              </div>
              <p className="font-mono text-xs text-aegis-steel-500 mb-3 break-all">
                0xaE37...E0C
              </p>
              <div className="space-y-2 text-sm text-aegis-steel-400">
                <div className="flex justify-between">
                  <span>Network</span>
                  <span className="text-white">Arbitrum Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span>Tests</span>
                  <span className="text-green-400">27/27 passing</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity</span>
                  <span className="text-white">7 days per score</span>
                </div>
              </div>
            </Link>

            {/* Data Protection */}
            <div className="card-industrial rounded-xl border border-aegis-steel-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Data Protection</h3>
              </div>
              <p className="text-xs text-aegis-steel-500 mb-3">
                iExec DataProtector on Bellecour
              </p>
              <div className="space-y-2 text-sm text-aegis-steel-400">
                <div className="flex justify-between">
                  <span>Encryption</span>
                  <span className="text-white">AES-256</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage</span>
                  <span className="text-white">Encrypted IPFS</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-green-400">✓ Live</span>
                </div>
              </div>
            </div>

            {/* TEE App */}
            <Link
              href="https://hub.docker.com/r/karagozemin/aegis-var-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="card-industrial rounded-xl border border-aegis-steel-800 p-6 hover:border-aegis-cyan/40 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold">TEE Application</h3>
                <ExternalLink className="w-3 h-3 text-aegis-steel-500 group-hover:text-aegis-cyan ml-auto" />
              </div>
              <p className="text-xs text-aegis-steel-500 mb-3">
                Monte Carlo VaR Engine
              </p>
              <div className="space-y-2 text-sm text-aegis-steel-400">
                <div className="flex justify-between">
                  <span>Iterations</span>
                  <span className="text-white">5,000+</span>
                </div>
                <div className="flex justify-between">
                  <span>Metrics</span>
                  <span className="text-white">VaR 95% · Safe LTV</span>
                </div>
                <div className="flex justify-between">
                  <span>Runtime</span>
                  <span className="text-white">Python · NumPy</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* VaR Explanation */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-4">
            What We Compute
          </motion.h2>
          <motion.p variants={itemVariants} className="text-center text-aegis-steel-400 mb-10 max-w-2xl mx-auto">
            Two critical metrics that DeFi lending protocols need to safely accept Real-World Assets as collateral.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              variants={itemVariants}
              className="card-industrial rounded-xl border border-aegis-steel-800 p-8"
            >
              <h3 className="text-xl font-bold mb-2">
                <span className="text-aegis-amber">VaR</span> — Value at Risk (95%)
              </h3>
              <p className="text-aegis-steel-400 text-sm mb-4">
                &quot;In the worst 5% of scenarios, what is the maximum loss this asset could face?&quot;
              </p>
              <div className="bg-aegis-steel-900 rounded-lg p-4 font-mono text-sm mb-4">
                <span className="text-aegis-cyan">VaR</span>
                <sub className="text-aegis-amber">95%</sub>
                <span className="text-aegis-steel-300"> = Percentile(simulated_returns, 5%)</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-aegis-steel-400">Low Risk: &lt;10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-aegis-amber" />
                  <span className="text-aegis-steel-400">Medium: 10-20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-aegis-steel-400">High: &gt;20%</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="card-industrial rounded-xl border border-aegis-steel-800 p-8"
            >
              <h3 className="text-xl font-bold mb-2">
                <span className="text-aegis-cyan">Safe LTV</span> — Loan-to-Value
              </h3>
              <p className="text-aegis-steel-400 text-sm mb-4">
                &quot;How much can you safely borrow against this asset without risking liquidation?&quot;
              </p>
              <div className="bg-aegis-steel-900 rounded-lg p-4 font-mono text-sm mb-4">
                <span className="text-aegis-cyan">SafeLTV</span>
                <span className="text-aegis-steel-300"> = max(75% − VaR × adjustment, 55%)</span>
              </div>
              <p className="text-sm text-aegis-steel-400">
                <strong className="text-white">Example:</strong> A $1M asset with 62% Safe LTV means you can
                safely borrow up to <span className="text-aegis-cyan font-semibold">$620,000</span> against
                it. Higher risk assets get lower LTV limits.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Tech Stack Strip */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-10">
            Built With
          </motion.h2>
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "iExec DataProtector", desc: "Encrypt & protect asset data", color: "border-yellow-500/20" },
              { name: "iExec TEE (SGX)", desc: "Confidential computing", color: "border-blue-500/20" },
              { name: "iExec Web3Mail", desc: "Privacy-preserving notifications", color: "border-purple-500/20" },
              { name: "Arbitrum Sepolia", desc: "L2 on-chain risk scores", color: "border-blue-400/20" },
              { name: "Solidity + Foundry", desc: "Smart contract · 27/27 tests", color: "border-green-500/20" },
              { name: "Pimlico AA", desc: "Account abstraction · gasless", color: "border-pink-500/20" },
              { name: "Next.js 14", desc: "App Router · API Routes", color: "border-white/10" },
              { name: "Wagmi v2 + Viem", desc: "Web3 interaction layer", color: "border-aegis-cyan/20" },
            ].map((tech) => (
              <div
                key={tech.name}
                className={`rounded-lg border ${tech.color} bg-aegis-steel-900/50 p-4 text-center`}
              >
                <p className="font-semibold text-sm mb-1">{tech.name}</p>
                <p className="text-xs text-aegis-steel-500">{tech.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Privacy Architecture Diagram */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-industrial rounded-xl border border-aegis-steel-800 p-8"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Privacy Architecture</h2>
          <div className="space-y-4 font-mono text-sm">
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-aegis-steel-500">Your Data</div>
              <div className="flex-1 h-px bg-gradient-to-r from-red-500 to-aegis-steel-700" />
              <div className="px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                Plaintext — visible to you only
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-aegis-steel-500">After Protect</div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500 to-aegis-steel-700" />
              <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                AES-encrypted on IPFS — nobody can read
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-aegis-steel-500">Inside TEE</div>
              <div className="flex-1 h-px bg-gradient-to-r from-aegis-cyan to-aegis-steel-700" />
              <div className="px-3 py-1 rounded bg-aegis-cyan/10 text-aegis-cyan border border-aegis-cyan/20 text-xs">
                Decrypted only inside SGX enclave — even we can&apos;t see
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-right text-aegis-steel-500">On-Chain</div>
              <div className="flex-1 h-px bg-gradient-to-r from-green-500 to-aegis-steel-700" />
              <div className="px-3 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
                Only VaR score + Safe LTV — no raw data exposed
              </div>
            </div>
          </div>
          <p className="text-center text-aegis-steel-500 text-xs mt-6">
            Your raw financial data is never stored unencrypted, never transmitted in plaintext,
            and never visible to anyone — including Aegis Prime.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to protect your assets?
          </h2>
          <p className="text-aegis-steel-400 mb-8">
            Connect your wallet, encrypt your asset data, and get a verifiable on-chain risk score in minutes.
          </p>
          {isConnected ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan"
              >
                Launch Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  size="lg"
                  onClick={openConnectModal}
                  className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan"
                >
                  Connect Wallet to Start
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </ConnectButton.Custom>
          )}
        </motion.div>
      </section>

    </main>
  );
}
