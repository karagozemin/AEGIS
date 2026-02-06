"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

/* ───── animation helpers ───── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const rise = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

/* ───── pipeline steps ───── */
const PIPELINE = [
  {
    n: "01",
    label: "ENCRYPT",
    mono: "dataProtector.protectData()",
    sub: "AES-256 → IPFS → Bellecour",
    gradient: "from-blue-500 to-blue-900",
    dot: "bg-blue-400",
  },
  {
    n: "02",
    label: "COMPUTE",
    mono: "sgx_enclave.run(monte_carlo)",
    sub: "5 000 iterations · Intel SGX",
    gradient: "from-aegis-cyan to-teal-900",
    dot: "bg-aegis-cyan",
  },
  {
    n: "03",
    label: "ATTEST",
    mono: "submitRiskScore(owner, VaR, LTV)",
    sub: "Solidity · Arbitrum Sepolia",
    gradient: "from-green-500 to-green-900",
    dot: "bg-green-400",
  },
  {
    n: "04",
    label: "COMPOSE",
    mono: "isScoreValid(owner, assetId)",
    sub: "Any DeFi protocol can call",
    gradient: "from-aegis-amber to-orange-900",
    dot: "bg-aegis-amber",
  },
];

export default function Home() {
  const { isConnected } = useAccount();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <main className="min-h-screen bg-[#060a10] text-white overflow-x-hidden">
      {/* subtle grid */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-20" />

      {/* ══════ NAV ══════ */}
      <nav className="relative z-20 border-b border-white/5 bg-[#060a10]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <Image src="/aegis-logo.png" alt="Aegis" width={48} height={48} className="transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight">
              AEGIS<span className="text-aegis-cyan">PRIME</span>
            </span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section ref={heroRef} className="relative z-10">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-aegis-cyan/[0.07] blur-[120px]" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="mx-auto max-w-4xl px-6 pt-28 pb-20 text-center"
        >
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span
              variants={rise}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs tracking-wide text-aegis-steel-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-aegis-cyan animate-pulse" />
              iExec Hack4Privacy Hackathon
            </motion.span>

            <motion.h1
              variants={rise}
              className="mt-2 text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-7xl"
            >
              Prove solvency.
              <br />
              <span className="text-glow-cyan bg-gradient-to-r from-aegis-cyan to-teal-400 bg-clip-text text-transparent">
                Reveal nothing.
              </span>
            </motion.h1>

            <motion.p
              variants={rise}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-aegis-steel-400"
            >
              Aegis Prime encrypts your RWA data, computes Monte&nbsp;Carlo VaR
              inside an Intel&nbsp;SGX enclave, and writes a verifiable risk
              score on-chain&nbsp;— <em className="text-white not-italic">without&nbsp;ever exposing your financials</em>.
            </motion.p>

            <motion.div variants={rise} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isConnected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan h-12 px-8 text-base">
                    Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button size="lg" onClick={openConnectModal} className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan h-12 px-8 text-base">
                      Connect Wallet <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
              <Link href="https://github.com/karagozemin/AEGIS" target="_blank">
                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 h-12 px-8 text-base">
                  GitHub <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ PROBLEM → SOLUTION (terminal style) ══════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
          <motion.h2 variants={rise} className="text-center text-3xl font-bold mb-12">
            Why does this matter?
          </motion.h2>

          <motion.div variants={rise} className="rounded-xl border border-white/[0.06] bg-[#0b1018] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-aegis-steel-500 font-mono">the_problem.sh</span>
            </div>
            <div className="p-6 font-mono text-sm leading-7 space-y-1">
              <p><span className="text-red-400">$</span> <span className="text-aegis-steel-400">defi_lender.require(</span><span className="text-aegis-amber">&quot;risk_score&quot;</span><span className="text-aegis-steel-400">)</span></p>
              <p className="text-aegis-steel-500 pl-4">→ Borrower must expose asset value, volatility, financials…</p>
              <p className="text-aegis-steel-500 pl-4">→ Risk computed in centralized black box — unverifiable</p>
              <p className="text-aegis-steel-500 pl-4">→ Score stays off-chain — DeFi can&apos;t read it</p>
              <div className="my-4 border-t border-dashed border-white/[0.06]" />
              <p><span className="text-aegis-cyan">$</span> <span className="text-white">aegis_prime.protect(</span><span className="text-aegis-amber">&quot;asset_data&quot;</span><span className="text-white">)</span></p>
              <p className="text-green-400 pl-4">✓ Data encrypted via iExec DataProtector (AES-256)</p>
              <p className="text-green-400 pl-4">✓ VaR computed inside Intel SGX — nobody sees your data</p>
              <p className="text-green-400 pl-4">✓ Score written on Arbitrum — any protocol can verify</p>
              <p className="text-green-400 pl-4">✓ Prove solvency with zero data exposure</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ PIPELINE ══════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
          <motion.h2 variants={rise} className="text-center text-3xl font-bold">
            The Pipeline
          </motion.h2>
          <motion.p variants={rise} className="mx-auto mt-3 max-w-xl text-center text-aegis-steel-400 mb-14">
            From raw data to on-chain proof in four steps. Your data stays encrypted at every stage.
          </motion.p>

          <div className="grid gap-5 md:grid-cols-4">
            {PIPELINE.map((s, i) => (
              <motion.div
                key={s.n}
                variants={rise}
                className="group relative rounded-xl border border-white/[0.06] bg-[#0b1018] p-5 transition-colors hover:border-white/10"
              >
                <span className="absolute -top-3 -right-2 text-6xl font-black opacity-[0.04] pointer-events-none select-none">
                  {s.n}
                </span>

                <div className="mb-4 flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot} ring-4 ring-[#0b1018]`} />
                  {i < PIPELINE.length - 1 && (
                    <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                  <span className="text-[10px] font-bold tracking-widest text-aegis-steel-500">{s.label}</span>
                </div>

                <div className={`rounded-md bg-gradient-to-br ${s.gradient} bg-opacity-10 px-3 py-2 mb-3`}>
                  <code className="text-xs text-white/80 break-all">{s.mono}</code>
                </div>

                <p className="text-xs text-aegis-steel-500 leading-relaxed">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════ LIVE DEPLOYMENTS ══════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
          <motion.h2 variants={rise} className="text-center text-3xl font-bold">
            Deployed &amp; Verifiable
          </motion.h2>
          <motion.p variants={rise} className="mx-auto mt-3 max-w-lg text-center text-aegis-steel-400 mb-14">
            Not a whitepaper. Every component is live, open-source, and auditable right now.
          </motion.p>

          <div className="grid gap-5 md:grid-cols-3">
            <motion.div variants={rise}>
              <Link
                href="https://sepolia.arbiscan.io/address/0xaE37446b0e680E524A41D21C41206Cd4d5d03E0C"
                target="_blank"
                className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-[#0b1018] p-5 transition-colors hover:border-aegis-cyan/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-md bg-aegis-cyan/10 px-2 py-1 text-[10px] font-bold tracking-widest text-aegis-cyan">
                    SMART CONTRACT
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-aegis-steel-600 group-hover:text-aegis-cyan transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">AegisRiskManager</h3>
                <p className="font-mono text-xs text-aegis-steel-600 mb-4">0xaE37...E0C</p>
                <div className="mt-auto space-y-2 text-xs">
                  <Row label="Network" value="Arbitrum Sepolia" />
                  <Row label="Forge Tests" value="27/27 ✓" valueClass="text-green-400" />
                  <Row label="Score Validity" value="7 days" />
                  <Row label="Framework" value="Foundry + Solidity" />
                </div>
              </Link>
            </motion.div>

            <motion.div variants={rise}>
              <div className="flex h-full flex-col rounded-xl border border-white/[0.06] bg-[#0b1018] p-5">
                <div className="mb-4">
                  <span className="rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold tracking-widest text-blue-400">
                    DATA LAYER
                  </span>
                </div>
                <h3 className="font-semibold mb-1">iExec DataProtector</h3>
                <p className="text-xs text-aegis-steel-600 mb-4">Bellecour Chain · IPFS</p>
                <div className="mt-auto space-y-2 text-xs">
                  <Row label="Encryption" value="AES-256" />
                  <Row label="Storage" value="Encrypted IPFS" />
                  <Row label="Access Control" value="TEE-gated" />
                  <Row label="Status" value="Live ✓" valueClass="text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={rise}>
              <Link
                href="https://hub.docker.com/r/karagozemin/aegis-var-engine"
                target="_blank"
                className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-[#0b1018] p-5 transition-colors hover:border-green-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-bold tracking-widest text-green-400">
                    TEE APPLICATION
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-aegis-steel-600 group-hover:text-green-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">Monte Carlo VaR Engine</h3>
                <p className="text-xs text-aegis-steel-600 mb-4">Docker · Python · NumPy</p>
                <div className="mt-auto space-y-2 text-xs">
                  <Row label="Iterations" value="5,000+" />
                  <Row label="Metrics" value="VaR 95% · Safe LTV" />
                  <Row label="Enclave" value="Intel SGX" />
                  <Row label="Image" value="Docker Hub" />
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══════ METRICS EXPLAINED ══════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
          <motion.h2 variants={rise} className="text-center text-3xl font-bold mb-12">
            What We Compute
          </motion.h2>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div variants={rise} className="rounded-xl border border-aegis-amber/10 bg-[#0b1018] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-aegis-amber" />
                <h3 className="font-bold">
                  VaR <span className="text-aegis-steel-500 font-normal">— Value at Risk (95%)</span>
                </h3>
              </div>
              <p className="text-sm text-aegis-steel-400 mb-4 leading-relaxed">
                &quot;In the worst 5% of scenarios, what&apos;s the maximum loss?&quot;
              </p>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-xs text-aegis-steel-300 mb-4">
                <span className="text-aegis-amber">VaR₉₅</span> = np.percentile(simulated_returns, 5)
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> &lt;10% Low</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-aegis-amber" /> 10-20% Med</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> &gt;20% High</span>
              </div>
            </motion.div>

            <motion.div variants={rise} className="rounded-xl border border-aegis-cyan/10 bg-[#0b1018] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-aegis-cyan" />
                <h3 className="font-bold">
                  Safe LTV <span className="text-aegis-steel-500 font-normal">— Loan-to-Value</span>
                </h3>
              </div>
              <p className="text-sm text-aegis-steel-400 mb-4 leading-relaxed">
                &quot;How much can you borrow without risking liquidation?&quot;
              </p>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-xs text-aegis-steel-300 mb-4">
                <span className="text-aegis-cyan">safe_ltv</span> = max(75% − VaR × k, 55%)
              </div>
              <p className="text-xs text-aegis-steel-500 leading-relaxed">
                <strong className="text-white">Example:</strong> $1M asset · 62% Safe LTV →
                safely borrow up to <span className="font-semibold text-aegis-cyan">$620k</span>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══════ PRIVACY FLOW ══════ */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-center text-3xl font-bold mb-10">Privacy Flow</h2>

          <div className="space-y-0">
            {[
              { label: "Your browser", color: "border-red-500/30", bg: "bg-red-500", text: "Plaintext — visible to you only", line: "from-red-500/40" },
              { label: "DataProtector", color: "border-blue-500/30", bg: "bg-blue-500", text: "AES-encrypted on IPFS — nobody can read", line: "from-blue-500/40" },
              { label: "SGX enclave", color: "border-aegis-cyan/30", bg: "bg-aegis-cyan", text: "Decrypted only inside enclave — even we cannot see", line: "from-aegis-cyan/40" },
              { label: "Arbitrum", color: "border-green-500/30", bg: "bg-green-500", text: "Only VaR + LTV on-chain — zero raw data", line: "from-green-500/40" },
            ].map((step, i) => (
              <div key={step.label} className="relative flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className={`h-3 w-3 rounded-full ${step.bg} ring-4 ring-[#060a10] z-10`} />
                  {i < 3 && <div className={`w-px flex-1 min-h-[48px] bg-gradient-to-b ${step.line} to-transparent`} />}
                </div>
                <div className={`-mt-0.5 mb-6 flex-1 rounded-lg border ${step.color} bg-white/[0.02] px-4 py-3`}>
                  <span className="text-[10px] font-bold tracking-widest text-aegis-steel-500 uppercase">{step.label}</span>
                  <p className="mt-1 text-sm text-aegis-steel-300">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════ TECH STRIP ══════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-14">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            "iExec DataProtector",
            "iExec TEE (SGX)",
            "iExec Web3Mail",
            "Arbitrum Sepolia",
            "Solidity · Foundry",
            "Pimlico AA",
            "Next.js 14",
            "Wagmi v2 · Viem",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-xs text-aegis-steel-400 font-medium"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-aegis-cyan/[0.05] blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-extrabold mb-4">
            Ready to protect your assets?
          </h2>
          <p className="text-aegis-steel-400 mb-8 text-lg">
            Encrypt. Compute. Verify. All on-chain.
          </p>
          {isConnected ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan h-12 px-10 text-base">
                Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="lg" onClick={openConnectModal} className="bg-aegis-cyan hover:bg-aegis-cyan-light text-white glow-cyan h-12 px-10 text-base">
                  Connect Wallet <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </ConnectButton.Custom>
          )}
        </motion.div>
      </section>
    </main>
  );
}

/* ── tiny row component ── */
function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-aegis-steel-400">
      <span>{label}</span>
      <span className={valueClass ?? "text-white"}>{value}</span>
    </div>
  );
}
