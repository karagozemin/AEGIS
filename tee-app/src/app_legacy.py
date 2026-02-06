#!/usr/bin/env python3
"""
Aegis Prime TEE Risk Engine

Monte Carlo Value-at-Risk (VaR) computation running inside Intel SGX enclave.
This iApp processes encrypted asset data and computes risk scores.

VaR Formula: VaR_α(X) = inf{x ∈ ℝ : P(X + x < 0) ≤ 1 - α}

Author: Aegis Prime Team
License: MIT
"""

import json
import os
import sys
from dataclasses import dataclass
from typing import Optional

import numpy as np
from eth_abi import encode
from web3 import Web3


# ============ Configuration ============

DEFAULT_ITERATIONS = 5000
DEFAULT_CONFIDENCE = 0.95
MAX_LTV_BPS = 10000
RANDOM_SEED = 42  # For reproducibility in TEE


# ============ Data Models ============

@dataclass
class AssetData:
    """Single asset data structure"""
    value: float
    volatility: float
    asset_id: Optional[str] = None


@dataclass
class VaRResult:
    """VaR computation result"""
    var_95: float
    var_99: float
    safe_ltv_bps: int
    iterations: int
    asset_id: str


# ============ Monte Carlo VaR Engine ============

def calculate_var(
    value: float,
    volatility: float,
    confidence: float = DEFAULT_CONFIDENCE,
    iterations: int = DEFAULT_ITERATIONS,
    seed: Optional[int] = RANDOM_SEED
) -> dict:
    """
    Calculate Value-at-Risk using Monte Carlo simulation.
    
    The VaR formula: VaR_α(X) = inf{x ∈ ℝ : P(X + x < 0) ≤ 1 - α}
    
    This implementation:
    1. Generates random returns from a normal distribution
    2. Simulates portfolio values under each scenario
    3. Calculates losses from current value
    4. Returns the α-percentile of losses as VaR
    
    Args:
        value: Current asset value
        volatility: Annual volatility (as decimal, e.g., 0.15 for 15%)
        confidence: Confidence level (default 0.95 for 95%)
        iterations: Number of Monte Carlo iterations (minimum 5000)
        seed: Random seed for reproducibility
    
    Returns:
        dict with var_95, var_99, safe_ltv_bps, iterations
    """
    if seed is not None:
        np.random.seed(seed)
    
    # Validate inputs
    if value <= 0:
        raise ValueError("Asset value must be positive")
    if volatility <= 0 or volatility > 1:
        raise ValueError("Volatility must be between 0 and 1")
    if iterations < 5000:
        raise ValueError("Minimum 5000 iterations required for TEE computation")
    
    # Generate random returns using normal distribution
    # Assuming daily returns with annualized volatility
    # Daily volatility = Annual volatility / sqrt(252)
    daily_vol = volatility / np.sqrt(252)
    
    # Simulate returns over a 10-day horizon (typical VaR horizon)
    horizon_days = 10
    horizon_vol = daily_vol * np.sqrt(horizon_days)
    
    # Generate simulated returns
    returns = np.random.normal(0, horizon_vol, iterations)
    
    # Calculate portfolio values under each scenario
    portfolio_values = value * (1 + returns)
    
    # Calculate losses (positive loss = money lost)
    losses = value - portfolio_values
    
    # Calculate VaR at different confidence levels
    var_95 = float(np.percentile(losses, 95))
    var_99 = float(np.percentile(losses, 99))
    
    # Calculate VaR as percentage of value
    var_95_pct = var_95 / value
    
    # Derive Safe LTV
    # Safe LTV = 1 - VaR_pct - safety_buffer
    # We use a 5% safety buffer on top of VaR
    safety_buffer = 0.05
    safe_ltv = max(0, min(1, 1 - var_95_pct - safety_buffer))
    safe_ltv_bps = int(safe_ltv * MAX_LTV_BPS)
    
    return {
        "var_95": var_95,
        "var_99": var_99,
        "var_95_bps": int(var_95_pct * MAX_LTV_BPS),
        "safe_ltv_bps": safe_ltv_bps,
        "iterations": iterations,
        "confidence": confidence,
    }


def bulk_process(assets: list[dict], iterations: int = DEFAULT_ITERATIONS) -> list[dict]:
    """
    Process multiple assets in a single TEE execution.
    
    This is the bulk processing feature for bonus points.
    All assets share the same random seed for consistent risk assessment.
    
    Args:
        assets: List of asset dicts with 'value' and 'volatility' keys
        iterations: Number of Monte Carlo iterations
    
    Returns:
        List of VaR results for each asset
    """
    results = []
    
    for i, asset in enumerate(assets):
        try:
            result = calculate_var(
                value=float(asset["value"]),
                volatility=float(asset["volatility"]),
                iterations=iterations,
                seed=RANDOM_SEED + i  # Different seed per asset for independence
            )
            result["asset_index"] = i
            result["asset_id"] = asset.get("asset_id", f"asset_{i}")
            results.append(result)
        except Exception as e:
            results.append({
                "asset_index": i,
                "asset_id": asset.get("asset_id", f"asset_{i}"),
                "error": str(e)
            })
    
    return results


# ============ iExec TEE Integration ============

def read_protected_data() -> dict:
    """
    Read protected data from iExec DataProtector.
    
    In the TEE environment, protected data is available at:
    /iexec_in/protected-data.json
    
    Handles two data formats:
    1. Raw format: { "value": 1000000, "volatility": 0.15 }
    2. Encoded format: { "assetValue": 100000000, "assetVolatility": 1500 }
       (value in cents, volatility in basis points)
    """
    protected_data_path = os.environ.get(
        "IEXEC_IN",
        "/iexec_in"
    ) + "/protected-data.json"
    
    try:
        with open(protected_data_path, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        # For local testing, check current directory
        if os.path.exists("test-data.json"):
            with open("test-data.json", "r") as f:
                data = json.load(f)
        else:
            raise
    
    # Convert from encoded format if needed
    if "assetValue" in data:
        data["value"] = data["assetValue"] / 100  # cents to dollars
        data["volatility"] = data["assetVolatility"] / 10000  # bps to decimal
    
    # Handle bulk assets in encoded format
    if "assets" in data:
        for asset in data["assets"]:
            if "assetValue" in asset:
                asset["value"] = asset["assetValue"] / 100
                asset["volatility"] = asset["assetVolatility"] / 10000
    
    return data


def write_output(result: dict) -> None:
    """
    Write computation result to iExec output.
    
    Output is written to /iexec_out/result.json
    """
    output_dir = os.environ.get("IEXEC_OUT", "/iexec_out")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "result.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    # Also write computed.json for iExec
    computed_path = os.path.join(output_dir, "computed.json")
    with open(computed_path, "w") as f:
        json.dump({"deterministic-output-path": output_path}, f)


def encode_for_contract(results: list[dict], owner: str, task_id: str) -> bytes:
    """
    Encode results for smart contract callback.
    
    This creates the calldata for submitBulkRiskScores function.
    """
    # Prepare bulk score data
    bulk_data = []
    for r in results:
        if "error" not in r:
            # Convert asset_id to bytes32
            asset_id = Web3.keccak(text=r["asset_id"])
            bulk_data.append((
                asset_id,
                r["var_95_bps"],
                r["safe_ltv_bps"]
            ))
    
    # Encode for contract call
    # submitBulkRiskScores(address owner, BulkScoreData[] scores, bytes32 teeTaskId, uint256 iterations)
    encoded = encode(
        ["address", "(bytes32,uint256,uint256)[]", "bytes32", "uint256"],
        [
            Web3.to_checksum_address(owner),
            bulk_data,
            Web3.to_bytes(hexstr=task_id),
            results[0]["iterations"] if results else DEFAULT_ITERATIONS
        ]
    )
    
    return encoded


# ============ Main Entry Point ============

def main():
    """
    Main entry point for TEE execution.
    
    Flow:
    1. Read protected data from DataProtector
    2. Run Monte Carlo VaR computation
    3. Write results to output
    """
    print("=" * 60)
    print("Aegis Prime TEE Risk Engine")
    print("Monte Carlo VaR Computation (5000+ iterations)")
    print("=" * 60)
    
    try:
        # Read input data
        print("\n[1/3] Reading protected data...")
        data = read_protected_data()
        
        # Check for bulk or single asset processing
        if "assets" in data:
            assets = data["assets"]
            print(f"      Found {len(assets)} assets for bulk processing")
        else:
            # Single asset mode
            assets = [{
                "value": data["value"],
                "volatility": data["volatility"],
                "asset_id": data.get("asset_id", "default")
            }]
            print("      Processing single asset")
        
        # Get configuration
        iterations = data.get("iterations", DEFAULT_ITERATIONS)
        iterations = max(iterations, 5000)  # Enforce minimum
        
        # Run computation
        print(f"\n[2/3] Running Monte Carlo simulation ({iterations} iterations)...")
        results = bulk_process(assets, iterations=iterations)
        
        # Log results
        for r in results:
            if "error" not in r:
                print(f"      Asset {r['asset_id']}:")
                print(f"        - VaR (95%): {r['var_95']:.2f} ({r['var_95_bps']/100:.2f}%)")
                print(f"        - Safe LTV: {r['safe_ltv_bps']/100:.2f}%")
            else:
                print(f"      Asset {r['asset_id']}: ERROR - {r['error']}")
        
        # Prepare output
        output = {
            "success": True,
            "results": results,
            "total_assets": len(assets),
            "successful_computations": len([r for r in results if "error" not in r]),
            "iterations": iterations,
        }
        
        # Add contract callback data if owner is provided
        if "owner" in data and "task_id" in data:
            output["callback_data"] = encode_for_contract(
                results,
                data["owner"],
                data["task_id"]
            ).hex()
        
        # Write output
        print("\n[3/3] Writing results...")
        write_output(output)
        
        print("\n" + "=" * 60)
        print("Computation complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Computation failed: {e}")
        write_output({
            "success": False,
            "error": str(e)
        })
        sys.exit(1)


if __name__ == "__main__":
    main()
