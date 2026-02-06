# Aegis Prime - Architecture Documentation

## 🏗️ System Overview

Aegis Prime is a **Confidential RWA Risk Engine** built for the iExec Hack4Privacy Hackathon. It combines blockchain smart contracts, confidential computing (TEE), and decentralized data protection to compute Value-at-Risk (VaR) scores for Real-World Assets while keeping sensitive financial data private.

## 🎯 Current Implementation Status

### ✅ **Fully Implemented & Deployed**
- Smart Contract on Arbitrum Sepolia
- iExec DataProtector integration for data encryption
- Frontend dashboard with wallet connection
- Backend API for server-side iExec SDK operations
- Docker image for TEE application
- Monte Carlo VaR computation engine (Python/NumPy)

### ⚠️ **Hybrid Implementation**
- **Protected Data**: ✅ Real (on-chain encryption via iExec DataProtector)
- **VaR Computation**: ⚠️ Deterministic simulation (real TEE requires SCONE account)
- **TEE Attestation**: ⚠️ Simulated (full attestation requires SCONE framework setup)

### 🚧 **Configured but Not Integrated**
- Account Abstraction (Pimlico Paymaster)
- On-chain risk score attestation
- Web3Mail for VaR reports

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                     (Next.js 14 + React)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Asset Input  │  │ TEE Execute  │  │ Risk Scores  │        │
│  │   Form       │  │    Panel     │  │    Display   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WALLET & WEB3 LAYER                          │
│                (RainbowKit + Wagmi + Viem)                      │
│                                                                 │
│  • MetaMask / WalletConnect                                     │
│  • Arbitrum Sepolia (Chain ID: 421614)                         │
│  • Account Abstraction Ready (Pimlico)                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API ROUTES                           │
│                  (Next.js API Routes)                           │
│                                                                 │
│  POST /api/iexec/protect                                        │
│  ├─ Encrypts asset data with DataProtectorCore                  │
│  ├─ Stores on IPFS                                              │
│  └─ Returns protected data address (Ethereum address)           │
│                                                                 │
│  POST /api/iexec/grant-access                                   │
│  ├─ Grants TEE app access to protected data                     │
│  └─ Returns transaction hash (Hybrid: simplified for hackathon) │
│                                                                 │
│  POST /api/iexec/process                                        │
│  ├─ Processes protected data in TEE                             │
│  ├─ Runs deterministic VaR computation                          │
│  └─ Returns VaR scores (var_95, var_99, safe_ltv_bps)          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     iExec ECOSYSTEM                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              iExec DataProtector                         │  │
│  │  • Encrypts data client-side                             │  │
│  │  • Stores on IPFS with on-chain registry                 │  │
│  │  • Manages access control                                │  │
│  │  • Protected Data Address: 0x...                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              iExec TEE Apps (Deployed)                   │  │
│  │  • Bellecour (134):     0x1723D79a...                    │  │
│  │  • Arbitrum Sepolia:    0x1378174D...                    │  │
│  │  • Docker Image:        karagozemin/aegis-var-engine     │  │
│  │  • Status: ⚠️ Deployed without TEE mrenclave            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TEE Execution (Hybrid Mode)                 │  │
│  │  • Protected Data: ✅ Real on-chain                      │  │
│  │  • VaR Computation: ⚠️ Deterministic simulation         │  │
│  │  • TEE Attestation: ⚠️ Not yet (needs SCONE account)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                               │
│                  (Arbitrum Sepolia)                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         AegisRiskManager Smart Contract                  │  │
│  │         Address: 0x253178656c31b5b67704e7dd8ad604a6...   │  │
│  │                                                           │  │
│  │  • submitRiskScore(asset, varScore, safeLTV, taskId)     │  │
│  │  • submitBulkRiskScores(scores[], taskId)                │  │
│  │  • getRiskScore(asset) → (varScore, safeLTV)             │  │
│  │  • calculateMaxLoanAmount(asset, value) → loanAmount     │  │
│  │                                                           │  │
│  │  Storage:                                                 │  │
│  │  • Risk scores by (owner → asset → score)                │  │
│  │  • Expiry: 7 days (604800 seconds)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Data Flow: End-to-End

### 1. **Asset Data Protection** (Real Implementation)

```
User Input (Frontend)
  │
  ├─ Asset Value: $1,000,000
  ├─ Volatility: 15% (0.15)
  └─ Asset Name: "Commercial Property #1"
  │
  ▼
POST /api/iexec/protect
  │
  ├─ Initialize IExecDataProtectorCore
  │  └─ Signer: Backend wallet (from IEXEC_BACKEND_PRIVATE_KEY)
  │
  ├─ Prepare data:
  │  {
  │    "assetValue": 100000000,    // cents
  │    "assetVolatility": 1500,    // basis points
  │    "owner": "0x267C...",
  │    "timestamp": 1738685234000
  │  }
  │
  ├─ dataProtector.protectData({ data, name })
  │  │
  │  ├─ Client-side encryption (AES-256)
  │  ├─ Upload to IPFS
  │  ├─ Register on-chain (Arbitrum Sepolia)
  │  └─ Returns Protected Data Address: 0xABAA4Ea3...
  │
  └─ Response:
     {
       "name": "Aegis Asset: Commercial Property #1",
       "address": "0xABAA4Ea3428EaA66Da03551AA055Dc30E427a076",
       "owner": "0x267C...",
       "creationTimestamp": 1738685234000
     }
```

**✅ This is REAL:** Data is actually encrypted and stored on IPFS with on-chain registry.

---

### 2. **TEE Execution Request** (Hybrid Implementation)

```
User clicks "Execute TEE Computation"
  │
  ▼
Step 1: Grant Access
POST /api/iexec/grant-access
  │
  ├─ protectedDataAddress: "0xABAA4Ea3..."
  ├─ authorizedApp: "0x1378174D..." (deployed iExec app)
  └─ authorizedUser: "0x267C..."
  │
  ▼
⚠️ HYBRID MODE: Simplified access grant
  │
  ├─ In REAL mode: dataProtector.grantAccess() would:
  │  ├─ Check app has valid TEE mrenclave
  │  ├─ Create on-chain access grant
  │  └─ Return transaction hash
  │
  └─ In HYBRID mode (current):
     ├─ Skips TEE validation (app has no mrenclave yet)
     ├─ Returns simulated tx hash
     └─ Logs: "✅ Access granted (Hybrid mode)"
  │
  ▼
Step 2: Process in TEE
POST /api/iexec/process
  │
  ├─ protectedDataAddress: "0xABAA4Ea3..."
  └─ userAddress: "0x267C..."
  │
  ▼
⚠️ HYBRID MODE: Deterministic VaR simulation
  │
  ├─ In REAL mode: dataProtector.processProtectedData() would:
  │  ├─ Submit TEE task to iExec network
  │  ├─ Worker pulls Docker image
  │  ├─ SGX enclave executes Python app
  │  ├─ App decrypts protected data
  │  ├─ Runs Monte Carlo VaR (5000 iterations)
  │  ├─ Returns encrypted result with TEE attestation
  │  └─ Frontend polls for completion
  │
  └─ In HYBRID mode (current):
     ├─ Reads protected data address
     ├─ Generates deterministic VaR based on address hash:
     │  │
     │  │  seed = parseInt(protectedDataAddress.slice(2, 10), 16)
     │  │  random = (seed * 9301 + 49297) % 233280 / 233280
     │  │  
     │  │  var_95 = 5000 + (random * 15000)
     │  │  var_99 = var_95 * 1.3
     │  │  safe_ltv_bps = floor(7500 - (random * 2000))
     │  │
     │  └─ Results are CONSISTENT for same input
     │
     └─ Returns immediately:
        {
          "success": true,
          "taskId": "0xb71f47a1...",
          "status": "COMPLETED",
          "results": {
            "var_95": 18490,
            "var_99": 24037,
            "safe_ltv_bps": 5701,
            "confidence_score": 0.95,
            "monte_carlo_iterations": 5000,
            "tee_attestation": "sgx_simulation_1738685234000"
          }
        }
```

**⚠️ This is HYBRID:**
- ✅ Protected data is REAL (on-chain, encrypted)
- ⚠️ VaR computation is deterministic (not in real TEE)
- ⚠️ TEE attestation is simulated

---

### 3. **Result Display** (Real Implementation)

```
Frontend receives results
  │
  ├─ VaR 95%: $18,490 (1.85% of value)
  ├─ VaR 99%: $24,037 (2.40% of value)
  └─ Safe LTV: 57.01%
  │
  ▼
Display in Risk Score Card
  │
  ├─ Asset Name: "Commercial Property #1"
  ├─ Status: "Computed"
  ├─ Risk Badge: "Medium Risk"
  ├─ VaR Score: $18,490
  ├─ Safe LTV: 57.01%
  └─ Protected Data: 0xABAA4Ea3...6
```

**✅ This is REAL:** Frontend displays actual computed results.

---

## 🧮 Monte Carlo VaR Engine (Python/NumPy)

The TEE application (`tee-app/aegis-var-calculator/src/app.py`) implements a sophisticated Monte Carlo Value-at-Risk computation:

### Algorithm

```python
def calculate_var(value, volatility, confidence=0.95, iterations=5000):
    """
    VaR Formula: VaR_α(X) = inf{x ∈ ℝ : P(X + x < 0) ≤ 1 - α}
    
    1. Generate random returns from normal distribution
    2. Simulate portfolio values under each scenario
    3. Calculate losses from current value
    4. Return α-percentile of losses as VaR
    """
    
    # Daily volatility from annual volatility
    daily_vol = volatility / sqrt(252)
    
    # 10-day horizon
    horizon_vol = daily_vol * sqrt(10)
    
    # Generate 5000 simulated returns
    returns = np.random.normal(0, horizon_vol, iterations)
    
    # Calculate portfolio values
    portfolio_values = value * (1 + returns)
    
    # Calculate losses
    losses = value - portfolio_values
    
    # VaR at 95% and 99% confidence
    var_95 = np.percentile(losses, 95)
    var_99 = np.percentile(losses, 99)
    
    # Derive Safe LTV
    safe_ltv = max(0, 1 - (var_95/value) - 0.05)  # 5% buffer
    
    return {
        "var_95": var_95,
        "var_99": var_99,
        "safe_ltv_bps": int(safe_ltv * 10000)
    }
```

### Key Features

1. **Minimum 5000 iterations** for statistical significance
2. **10-day VaR horizon** (industry standard)
3. **Normal distribution assumption** for returns
4. **Safety buffer** of 5% on top of VaR for Safe LTV
5. **Bulk processing** support for multiple assets

### Deployment Status

- ✅ Docker image built: `karagozemin/aegis-var-engine:1.0.0`
- ✅ Pushed to Docker Hub
- ✅ Deployed to iExec (Bellecour + Arbitrum Sepolia)
- ⚠️ No TEE mrenclave (requires SCONE account for sconification)

**To enable real TEE:**
1. Register SCONE account at https://scontain.com/
2. Run `./tee-app/sconify.sh` to wrap Docker image with SCONE
3. Redeploy iExec app with mrenclave metadata
4. Update frontend to use real `dataProtector.processProtectedData()`

---

## 💾 Smart Contract Architecture

### AegisRiskManager.sol

**Address:** `0x253178656c31b5b67704e7dd8ad604a6e89a1d2f` (Arbitrum Sepolia)

#### Core Functions

```solidity
contract AegisRiskManager is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant MIN_LTV_BPS = 5000;   // 50%
    uint256 public constant MAX_LTV_BPS = 10000;  // 100%
    uint256 public constant SCORE_EXPIRY = 7 days;
    
    // State
    address public teeExecutorAddress;  // Authorized TEE app
    
    // Risk score storage
    mapping(address => mapping(bytes32 => RiskScore)) public riskScores;
    
    struct RiskScore {
        uint256 varScore;          // VaR in basis points
        uint256 safeLTV;           // Safe LTV in basis points
        uint256 timestamp;         // When score was computed
        bytes32 teeTaskId;         // iExec task ID
        uint256 iterations;        // Monte Carlo iterations
    }
    
    // Submit single risk score
    function submitRiskScore(
        bytes32 assetId,
        uint256 varScore,
        uint256 safeLTV,
        bytes32 teeTaskId,
        uint256 iterations
    ) external onlyTEE nonReentrant;
    
    // Submit bulk risk scores (bonus feature)
    function submitBulkRiskScores(
        address owner,
        BulkScoreData[] calldata scores,
        bytes32 teeTaskId,
        uint256 iterations
    ) external onlyTEE nonReentrant;
    
    // Get risk score (with expiry check)
    function getRiskScore(address owner, bytes32 assetId)
        external view returns (uint256 varScore, uint256 safeLTV);
    
    // Calculate max loan amount
    function calculateMaxLoanAmount(
        address owner,
        bytes32 assetId,
        uint256 assetValue
    ) external view returns (uint256);
    
    // Check if risk score is valid
    function isRiskScoreValid(address owner, bytes32 assetId)
        external view returns (bool);
}
```

#### Security Features

1. **Access Control**: Only `teeExecutorAddress` can submit scores
2. **ReentrancyGuard**: Protection against reentrancy attacks
3. **Expiry Check**: Scores expire after 7 days
4. **Validation**: Min/max LTV bounds enforced
5. **Event Emission**: All score submissions logged

#### Integration Status

- ✅ Contract deployed and verified
- ✅ TEE executor address set
- ⚠️ Not yet integrated with frontend (manual submission only)
- 🚧 Callback from TEE app not implemented

---

## 🖥️ Frontend Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + Shadcn UI
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **State**: React hooks + context
- **Icons**: Lucide React

### Key Components

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── providers.tsx           # Wagmi + RainbowKit setup
│   └── api/
│       └── iexec/              # Backend API routes
│           ├── protect/
│           ├── grant-access/
│           └── process/
│
├── components/
│   ├── asset-protection-form.tsx      # Data input form
│   ├── tee-execution-panel.tsx        # TEE execution UI
│   ├── risk-score-card.tsx            # Results display
│   ├── wallet-button.tsx              # Connect wallet
│   └── ui/                            # Shadcn components
│
├── hooks/
│   ├── useDataProtector.ts            # iExec SDK wrapper
│   ├── useContract.ts                 # Smart contract calls
│   └── useAssets.ts                   # Asset state management
│
└── lib/
    ├── wagmi.ts                       # Wagmi config
    └── contracts.ts                   # Contract ABIs
```

### State Management

```typescript
// Asset state (in-memory, local storage backup)
interface Asset {
  id: string;
  name: string;
  value: number;
  volatility: number;
  owner: string;
  createdAt: number;
  protectedDataAddress?: string;
  varScore?: number;
  safeLTV?: number;
  status: 'protected' | 'computing' | 'computed' | 'error';
}

// useAssets hook
const [assets, setAssets] = useState<Asset[]>([]);
const [computedAssets, setComputedAssets] = useState<Asset[]>([]);
```

**Note**: State is ephemeral (resets on refresh). For production, would use:
- IndexedDB for client-side persistence
- Backend database for multi-device sync
- IPFS/Arweave for permanent storage

---

## 🔌 API Routes (Backend)

All iExec SDK operations run server-side to avoid browser compatibility issues (MetaMask SES lockdown conflicts).

### POST /api/iexec/protect

**Purpose**: Encrypt and store asset data

```typescript
// Input
{
  assetValue: 1000000,      // dollars
  assetVolatility: 0.15,    // decimal
  name: "Asset Name",
  userAddress: "0x..."
}

// Processing
1. Initialize IExecDataProtectorCore with backend wallet
2. Prepare data (convert to cents/bps)
3. Call dataProtector.protectData({ data, name })
4. Returns protected data address (Ethereum address)

// Output
{
  name: "Aegis Asset: Asset Name",
  address: "0xABAA4Ea3...",  // Protected data address
  owner: "0x...",
  creationTimestamp: 1738685234000
}
```

### POST /api/iexec/grant-access

**Purpose**: Grant TEE app access to protected data

```typescript
// Input
{
  protectedDataAddress: "0xABAA4Ea3...",
  userAddress: "0x..."
}

// Processing (Hybrid Mode)
1. Log access request
2. Return simulated success
   (Real mode would call dataProtector.grantAccess())

// Output
{
  success: true,
  txHash: "0x...",
  dataAddress: "0xABAA4Ea3...",
  grantedTo: "0x1378174D...",  // iExec app address
  note: "Protected data is real on-chain. Full TEE validation requires SCONE account setup."
}
```

### POST /api/iexec/process

**Purpose**: Process protected data in TEE

```typescript
// Input
{
  protectedDataAddress: "0xABAA4Ea3...",
  userAddress: "0x..."
}

// Processing (Hybrid Mode)
1. Read protected data address
2. Generate deterministic VaR based on address hash
3. Return results immediately
   (Real mode would submit task to iExec network and poll for results)

// Output
{
  success: true,
  taskId: "0xb71f47a1...",
  status: "COMPLETED",
  results: {
    var_95: 18490,
    var_99: 24037,
    safe_ltv_bps: 5701,
    confidence_score: 0.95,
    monte_carlo_iterations: 5000,
    tee_attestation: "sgx_simulation_1738685234000",
    app_address: "0x1378174D...",
    protected_data: "0xABAA4Ea3..."
  },
  note: "Protected data is real on-chain. VaR computation is deterministic simulation (real TEE requires SCONE account)."
}
```

---

## 🔗 Technology Stack Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | Next.js 14 + React 18 | ✅ Production |
| **Styling** | Tailwind CSS + Shadcn UI | ✅ Production |
| **Web3** | Wagmi v2 + Viem + RainbowKit | ✅ Production |
| **Backend** | Next.js API Routes | ✅ Production |
| **iExec SDK** | @iexec/dataprotector@2.0.0-beta.23 | ✅ Integrated |
| **Smart Contract** | Solidity 0.8.20 + Foundry | ✅ Deployed |
| **TEE App** | Python 3.9 + NumPy | ✅ Built, ⚠️ No mrenclave |
| **Docker** | Docker + Docker Hub | ✅ Published |
| **Network** | Arbitrum Sepolia (421614) | ✅ Production |
| **iExec Network** | Bellecour (134) | ✅ App deployed |
| **Account Abstraction** | Pimlico + Permissionless.js | 🚧 Configured |
| **Web3Mail** | @iexec/web3mail | 🚧 Configured |

---

## 📝 Environment Variables

```bash
# Frontend (.env in apps/web/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_AEGIS_RISK_MANAGER_ADDRESS=0xaE37446b0e680E524A41D21C41206Cd4d5d03E0C
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
NEXT_PUBLIC_IEXEC_APP_ADDRESS=0x1378174Dffc1Df753799206ABdbc5843A0335890

# Backend (server-side only)
IEXEC_BACKEND_PRIVATE_KEY=your_testnet_private_key_here
PRIVATE_KEY=your_testnet_private_key_here
```

**⚠️ CRITICAL SECURITY NOTE**: 
- NEVER commit real private keys to git!
- These are EXAMPLES ONLY - use your own testnet keys
- Rotate keys immediately if accidentally exposed
- For production, use environment variables or secret managers (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## 🚀 Deployment Addresses

### Smart Contracts (Arbitrum Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| AegisRiskManager | `0xaE37446b0e680E524A41D21C41206Cd4d5d03E0C` | [View](https://sepolia.arbiscan.io/address/0xaE37446b0e680E524A41D21C41206Cd4d5d03E0C) |

### iExec Apps

| Network | Chain ID | Address | Status |
|---------|----------|---------|--------|
| Bellecour | 134 | `0x1723D79a655340DF30110D095998F050C627fc4E` | ⚠️ No mrenclave |
| Arbitrum Sepolia | 421614 | `0x1378174Dffc1Df753799206ABdbc5843A0335890` | ⚠️ No mrenclave |

### Docker Image

- **Repository**: `registry.hub.docker.com/karagozemin/aegis-var-engine`
- **Tag**: `1.0.0`
- **Checksum**: `0x85d77ad97615c8e0df6a4032561dd6404329487d8bea724e2331679049e35b05`

---

## 🎯 Hackathon Feature Checklist

### ✅ Core Features (Implemented)

- [x] Smart contract for risk score storage (AegisRiskManager.sol)
- [x] iExec DataProtector integration for data encryption
- [x] Protected data storage on IPFS
- [x] Frontend dashboard with wallet connection
- [x] Asset data input form
- [x] TEE execution panel
- [x] Risk score display
- [x] Monte Carlo VaR computation engine (Python)
- [x] Docker image for TEE application

### ⚠️ Hybrid Implementation

- [~] TEE execution (deterministic simulation, not real SGX yet)
- [~] TEE attestation (simulated, requires SCONE account)

### 🚧 Bonus Features (Configured but Not Integrated)

- [ ] Account Abstraction (Pimlico configured)
- [ ] Bulk processing (Python code ready, not integrated)
- [ ] Web3Mail for VaR reports (@iexec/web3mail installed)
- [ ] On-chain attestation (contract ready, callback not implemented)

---

## 🔄 Future Improvements

### To Enable Real TEE Execution

1. **Register SCONE Account**
   - Visit https://scontain.com/
   - Request access to SCONE build tools for iExec
   - Get credentials: `docker login registry.scontain.com`

2. **Sconify Docker Image**
   ```bash
   cd tee-app
   ./sconify.sh  # Wraps image with SCONE framework
   ```

3. **Update iExec Deployment**
   ```bash
   iexec app deploy --chain arbitrum-sepolia-testnet
   # App will now have mrenclave metadata
   ```

4. **Update Frontend**
   - Remove hybrid simulation logic
   - Use real `dataProtector.processProtectedData()`
   - Poll for task completion
   - Verify TEE attestation

### To Integrate Account Abstraction

1. **Setup Pimlico Bundler**
   - Already configured with API key
   - Create SmartAccount with `permissionless.js`

2. **Implement Gasless TEE Execution**
   ```typescript
   const userOp = await smartAccount.prepareUserOperation({
     target: teeExecutorAddress,
     data: encodeCalldata(...),
   });
   const txHash = await bundler.sendUserOperation(userOp);
   ```

### To Enable Web3Mail Reports

1. **Integrate @iexec/web3mail**
   - User grants email contact
   - TEE app generates VaR report PDF
   - Send encrypted email with report

2. **Email Template**
   ```
   Subject: [Aegis Prime] VaR Report for Asset #123
   
   Your confidential risk assessment is ready:
   - VaR (95%): $18,490
   - Safe LTV: 57.01%
   
   Full report attached (encrypted).
   ```

---

## 📚 References

- [iExec DataProtector Docs](https://docs.iex.ec/for-developers/confidential-computing/create-your-first-secret)
- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Next.js Docs](https://nextjs.org/docs)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [SCONE Framework](https://scontain.com/)

---

**Last Updated**: February 4, 2026  
**Version**: 1.0.0 (Hackathon Submission)
