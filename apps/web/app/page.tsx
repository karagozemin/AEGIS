"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Cpu, ArrowRight } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Lock,
    title: "Encrypted Data",
    description:
      "Your financial documents are encrypted using iExec DataProtector before any computation.",
  },
  {
    icon: Cpu,
    title: "TEE Computing",
    description:
      "Monte Carlo VaR calculations run inside Intel SGX enclaves - nobody can see your data.",
  },
  {
    icon: Shield,
    title: "On-Chain Attestation",
    description:
      "Risk scores are cryptographically attested and stored on Arbitrum Sepolia.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gradient-industrial">
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-aegis-steel-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-aegis-cyan" />
            <span className="text-xl font-bold tracking-tight">
              AEGIS<span className="text-aegis-cyan">PRIME</span>
            </span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aegis-steel-800/50 border border-aegis-steel-700 text-sm text-aegis-steel-300">
              <span className="w-2 h-2 rounded-full bg-aegis-cyan animate-pulse" />
              Powered by iExec Confidential Computing
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
            className="text-xl text-aegis-steel-400 max-w-2xl mx-auto mb-12"
          >
            Prove your solvency to DeFi lenders without revealing sensitive
            financial documents. Monte Carlo VaR computed inside TEE enclaves.
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
            <Button
              variant="outline"
              size="lg"
              className="border-aegis-steel-700 hover:bg-aegis-steel-800"
            >
              View Documentation
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="card-industrial rounded-xl border border-aegis-steel-800 p-8"
            >
              <div className="w-12 h-12 rounded-lg bg-aegis-cyan/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-aegis-cyan" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-aegis-steel-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* VaR Formula Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-industrial rounded-xl border border-aegis-steel-800 p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-6">
            Monte Carlo Value-at-Risk Computation
          </h2>
          <div className="bg-aegis-steel-900 rounded-lg p-6 font-mono text-lg">
            <span className="text-aegis-cyan">VaR</span>
            <sub className="text-aegis-amber">α</sub>
            <span className="text-aegis-steel-300">(X) = inf</span>
            <span className="text-aegis-steel-500">{" { "}</span>
            <span className="text-white">x ∈ ℝ</span>
            <span className="text-aegis-steel-500">{" : "}</span>
            <span className="text-aegis-cyan">P</span>
            <span className="text-aegis-steel-300">(X + x {"<"} 0)</span>
            <span className="text-aegis-steel-500">{" ≤ "}</span>
            <span className="text-aegis-amber">1 - α</span>
            <span className="text-aegis-steel-500">{" }"}</span>
          </div>
          <p className="text-aegis-steel-400 mt-6">
            5,000+ Monte Carlo iterations computed securely inside Intel SGX
            enclaves
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-aegis-steel-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-aegis-steel-500">
          <p>Built for iExec Hack4Privacy Hackathon</p>
        </div>
      </footer>
    </main>
  );
}
