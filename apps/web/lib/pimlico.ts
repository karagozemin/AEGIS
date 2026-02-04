import { createPublicClient, http, type WalletClient, type Account } from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V07,
} from "permissionless";
import { signerToSimpleSmartAccount } from "permissionless/accounts";
import {
  createPimlicoPaymasterClient,
  createPimlicoBundlerClient,
} from "permissionless/clients/pimlico";
import { walletClientToSmartAccountSigner } from "permissionless/utils";

const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

if (!PIMLICO_API_KEY) {
  console.warn("PIMLICO_API_KEY not set - gasless transactions disabled");
}

const pimlicoEndpoint = `https://api.pimlico.io/v2/arbitrum-sepolia/rpc?apikey=${PIMLICO_API_KEY}`;

// Public client for reading chain state
export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ||
      "https://sepolia-rollup.arbitrum.io/rpc"
  ),
});

// Pimlico Bundler client
export const bundlerClient = createPimlicoBundlerClient({
  transport: http(pimlicoEndpoint),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

// Pimlico Paymaster client for gasless transactions
export const paymasterClient = createPimlicoPaymasterClient({
  transport: http(pimlicoEndpoint),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

/**
 * Create a gasless smart account client from an existing wallet
 */
export async function createGaslessClient(walletClient: WalletClient & { account: Account }) {
  const signer = walletClientToSmartAccountSigner(walletClient as any);

  // Create simple smart account
  const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
    signer,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    // SimpleAccountFactory on Arbitrum Sepolia
    factoryAddress: "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985",
  });

  // Create smart account client with paymaster
  const smartAccountClient = createSmartAccountClient({
    account: simpleAccount,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: arbitrumSepolia,
    bundlerTransport: http(pimlicoEndpoint),
    middleware: {
      gasPrice: async () => {
        return (await bundlerClient.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: paymasterClient.sponsorUserOperation,
    },
  });

  return smartAccountClient;
}

/**
 * Estimate gas for a user operation (for UI display)
 */
export async function estimateUserOperationGas(
  smartAccountClient: Awaited<ReturnType<typeof createGaslessClient>>,
  calls: { to: `0x${string}`; data: `0x${string}`; value?: bigint }[]
) {
  const normalizedCalls = calls.map(c => ({
    to: c.to,
    data: c.data,
    value: c.value ?? BigInt(0),
  }));
  
  const userOperation = await smartAccountClient.prepareUserOperationRequest({
    userOperation: {
      callData: await smartAccountClient.account.encodeCallData(normalizedCalls),
    },
  });

  return {
    preVerificationGas: userOperation.preVerificationGas,
    verificationGasLimit: userOperation.verificationGasLimit,
    callGasLimit: userOperation.callGasLimit,
  };
}
