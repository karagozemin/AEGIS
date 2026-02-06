import { http } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Re-export contract data from server-safe module
export { AEGIS_RISK_MANAGER_ADDRESS, AEGIS_RISK_MANAGER_ABI } from "./contracts";

// WalletConnect projectId - get yours at https://cloud.walletconnect.com
// For development, we use a placeholder that allows basic functionality
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "development_placeholder_id";

export const config = getDefaultConfig({
  appName: "Aegis Prime",
  projectId,
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ||
        "https://sepolia-rollup.arbitrum.io/rpc"
    ),
  },
  ssr: true,
});
