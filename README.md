# Aegis Prime

**Confidential RWA Risk Engine** - Privacy-preserving risk assessment for Real World Assets using Trusted Execution Environments.

Built for the **iExec Hack4Privacy Hackathon**.

## Overview

Aegis Prime solves the privacy-compliance dilemma in RWA: Real Estate or Bond owners need to prove their solvency to DeFi lenders without revealing sensitive financial documents (bank statements, tax records).

### Key Features

- **Monte Carlo VaR Computation** - 5,000+ iteration Value-at-Risk calculations
- **TEE Privacy** - All computations run inside Intel SGX enclaves via iExec
- **Bulk Processing** - Process multiple assets in a single TEE task
- **Gasless Transactions** - Account Abstraction via Pimlico Paymaster
- **On-Chain Attestation** - Risk scores stored on Arbitrum Sepolia

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Aegis Prime Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   Next.js 14     │     │  Smart Contract  │                  │
│  │   Frontend       │────▶│  AegisRiskManager│                  │
│  │  (RainbowKit)    │     │  (Arbitrum)      │                  │
│  └────────┬─────────┘     └────────▲─────────┘                  │
│           │                        │                             │
│           ▼                        │                             │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  iExec Data      │     │   TEE (SGX)      │                  │
│  │  Protector       │────▶│   Python iApp    │                  │
│  │  (Encrypt)       │     │  (Monte Carlo)   │                  │
│  └──────────────────┘     └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## VaR Formula

$$VaR_{\alpha}(X) = \inf \{ x \in \mathbb{R} : P(X + x < 0) \le 1 - \alpha \}$$

## Project Structure

```
AEGIS/
├── apps/web/              # Next.js 14 frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # SDK integrations
├── contracts/             # Foundry smart contracts
│   ├── src/               # Solidity sources
│   ├── test/              # Forge tests
│   └── script/            # Deployment scripts
├── tee-app/               # Python TEE application
│   ├── src/               # VaR computation engine
│   └── Dockerfile         # iExec-compatible container
└── package.json           # Monorepo config
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Foundry (for contracts)
- Python 3.10+ (for TEE app testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/aegis-prime.git
cd aegis-prime

# Install dependencies
pnpm install

# Install Foundry dependencies
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
cd ..
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Fill in required values:
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (from cloud.walletconnect.com)
# - NEXT_PUBLIC_PIMLICO_API_KEY (from dashboard.pimlico.io)
# - DEPLOYER_PRIVATE_KEY (for contract deployment)
```

### Development

```bash
# Start Next.js development server
pnpm dev

# Run contract tests
pnpm test:contracts

# Deploy contracts to Arbitrum Sepolia
pnpm deploy:contracts
```

### Contract Testing

```bash
cd contracts

# Run all tests
forge test -vvv

# Run with gas report
forge test --gas-report

# Run specific test
forge test --match-test test_SubmitBulkRiskScores_Success -vvv
```

### TEE App Testing

```bash
cd tee-app

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest

# Run tests
python -m pytest src/test_var.py -v

# Test locally
python src/app.py
```

## Smart Contract

### AegisRiskManager.sol

The main contract stores TEE-attested risk scores:

```solidity
struct RiskScore {
    uint256 varScore;      // VaR in basis points
    uint256 safeLTV;       // Safe LTV ratio (e.g., 7500 = 75%)
    uint256 timestamp;
    bytes32 teeTaskId;     // iExec task proof
    uint256 iterations;    // Monte Carlo iterations
}

// Key functions
function submitRiskScore(...) external onlyTEE;
function submitBulkRiskScores(...) external onlyTEE;  // Bonus: bulk processing
function getSafeLTV(address owner, bytes32 assetId) external view returns (uint256);
function calculateMaxBorrow(address owner, bytes32 assetId, uint256 collateralValue) external view returns (uint256);
```

### Deployment

```bash
# Set environment variables
export RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
export DEPLOYER_PRIVATE_KEY=your-private-key

# Deploy
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## TEE Application

The Python iApp runs Monte Carlo VaR simulations inside Intel SGX:

```python
def calculate_var(value, volatility, iterations=5000):
    """
    Monte Carlo Value-at-Risk calculation.
    
    Returns:
        - var_95: 95% VaR
        - var_99: 99% VaR  
        - safe_ltv_bps: Derived safe LTV in basis points
    """
```

### Building for iExec

```bash
cd tee-app

# Build Docker image
docker build -t aegis-var-engine .

# Push to Docker Hub
docker tag aegis-var-engine your-registry/aegis-var-engine:latest
docker push your-registry/aegis-var-engine:latest

# Deploy to iExec (requires iExec SDK)
iexec app deploy
```

## Frontend Features

- **Dark Industrial Theme** - Custom Tailwind CSS design
- **RainbowKit** - Wallet connection with Arbitrum Sepolia
- **Pimlico Paymaster** - Gasless TEE execution
- **Real-time Updates** - Progress tracking for TEE tasks
- **Web3Mail** - Encrypted VaR report delivery

## Hackathon Bonuses

1. **Account Abstraction** - Pimlico Paymaster for gasless transactions
2. **Bulk Processing** - Multiple assets in single TEE task
3. **Web3Mail Integration** - VaR reports via encrypted email

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, Shadcn UI |
| Wallet | RainbowKit, wagmi, viem |
| Contracts | Solidity 0.8.20, Foundry |
| TEE | Python, NumPy, iExec SDK |
| Privacy | iExec DataProtector, Intel SGX |
| AA | Pimlico, permissionless.js |
| Network | Arbitrum Sepolia |

## License

MIT

## Team

Aegis Prime Team - iExec Hack4Privacy 2024
