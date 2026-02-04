import Link from "next/link";
import Image from "next/image";
import { Twitter, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-aegis-steel-800 bg-aegis-steel-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Image
              src="/aegis-logo.png"
              alt="Aegis Prime Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <div className="text-sm text-aegis-steel-400">
              <span className="font-medium text-aegis-steel-200">Aegis Prime</span>
              <span className="mx-2">·</span>
              <span>Confidential RWA Risk Engine</span>
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-6 text-sm text-aegis-steel-400">
            {/* Powered by OverBlock */}
            <Link
              href="https://twitter.com/OverBlock_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-aegis-cyan transition-colors"
            >
              <span>Powered by</span>
              <span className="font-medium text-aegis-steel-200">OverBlock</span>
              <Twitter className="w-4 h-4" />
            </Link>

            <span className="text-aegis-steel-700">·</span>

            {/* Created by Kaptan */}
            <Link
              href="https://twitter.com/Kaptan_web3"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-aegis-cyan transition-colors"
            >
              <span>Created by</span>
              <span className="font-medium text-aegis-steel-200">Kaptan</span>
              <Twitter className="w-4 h-4" />
            </Link>

            <span className="text-aegis-steel-700">·</span>

            {/* GitHub */}
            <Link
              href="https://github.com/karagozemin/AEGIS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-aegis-cyan transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="mt-6 pt-6 border-t border-aegis-steel-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-aegis-steel-500">
          <p>© 2026 Aegis Prime. Built for iExec Hack4Privacy Hackathon.</p>
          <div className="flex items-center gap-4">
            <Link
              href="https://docs.iex.ec/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-aegis-cyan transition-colors"
            >
              iExec Documentation
            </Link>
            <span>·</span>
            <Link
              href="https://github.com/karagozemin/AEGIS/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-aegis-cyan transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
