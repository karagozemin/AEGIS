"""
AEGIS VaR Calculator - TEE Application
Monte Carlo Value-at-Risk calculation for RWA portfolios
Runs inside Intel SGX Trusted Execution Environment
"""
import json
import os
import sys
import numpy as np
import protected_data

# iExec environment variables
IEXEC_OUT = os.getenv('IEXEC_OUT', '/iexec_out')
IEXEC_IN = os.getenv('IEXEC_IN', '/iexec_in')


def compute_var_montecarlo(portfolio_data: dict, simulations: int = 5000) -> dict:
    """
    Monte Carlo VaR calculation for RWA portfolio
    
    Args:
        portfolio_data: Portfolio containing assets with value, volatility, expectedReturn
        simulations: Number of Monte Carlo simulations (default 5000)
    
    Returns:
        Dictionary with VaR metrics (var95, var99, cvar95, etc.)
    """
    np.random.seed(42)  # Deterministic for TEE verification
    
    assets = portfolio_data.get("assets", [])
    if not assets:
        return {"error": "No assets in portfolio"}
    
    total_value = sum(asset.get("value", 0) for asset in assets)
    if total_value == 0:
        return {"error": "Portfolio value is zero"}
    
    # Monte Carlo simulation for daily returns
    portfolio_returns = np.zeros(simulations)
    
    for asset in assets:
        value = asset.get("value", 0)
        weight = value / total_value
        volatility = asset.get("volatility", 0.15)  # Default 15% annual volatility
        expected_return = asset.get("expectedReturn", 0.05)  # Default 5% annual return
        
        # Generate daily returns using normal distribution
        daily_returns = np.random.normal(
            expected_return / 252,  # Daily expected return
            volatility / np.sqrt(252),  # Daily volatility
            simulations
        )
        portfolio_returns += weight * daily_returns
    
    # Calculate VaR at different confidence levels
    var_95 = float(np.percentile(portfolio_returns, 5) * total_value * -1)
    var_99 = float(np.percentile(portfolio_returns, 1) * total_value * -1)
    
    # Conditional VaR (Expected Shortfall)
    tail_returns = portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)]
    cvar_95 = float(np.mean(tail_returns) * total_value * -1)
    
    # Risk level classification
    risk_ratio = var_95 / total_value
    if risk_ratio > 0.05:
        risk_level = "HIGH"
    elif risk_ratio > 0.02:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    return {
        "totalValue": round(total_value, 2),
        "var95": round(var_95, 2),
        "var99": round(var_99, 2),
        "cvar95": round(cvar_95, 2),
        "assetCount": len(assets),
        "simulations": simulations,
        "riskLevel": risk_level,
        "dailyVarPercent": round(risk_ratio * 100, 4)
    }


computed_json = {}

try:
    print("=" * 50)
    print("AEGIS VaR Calculator - TEE-SGX Execution")
    print("=" * 50)
    
    # Parse command line arguments
    args = sys.argv[1:]
    simulations = 5000
    if len(args) > 0:
        try:
            simulations = int(args[0])
            print(f"Using {simulations} simulations from args")
        except ValueError:
            print(f"Invalid simulation count, using default: {simulations}")
    
    # Try to load portfolio from protected data
    portfolio_data = None
    
    try:
        # Protected data contains portfolio JSON string
        portfolio_json_str = protected_data.getValue('portfolio', 'string')
        portfolio_data = json.loads(portfolio_json_str)
        print("✓ Loaded portfolio from protected data")
    except Exception as e:
        print(f"Protected data not available: {e}")
    
    # Fallback: Try input files
    if not portfolio_data:
        IEXEC_INPUT_FILES_NUMBER = int(os.getenv("IEXEC_INPUT_FILES_NUMBER", 0))
        print(f"Checking {IEXEC_INPUT_FILES_NUMBER} input files...")
        
        if IEXEC_INPUT_FILES_NUMBER > 0:
            input_file_name = os.getenv("IEXEC_INPUT_FILE_NAME_1")
            if input_file_name:
                input_path = os.path.join(IEXEC_IN, input_file_name)
                try:
                    with open(input_path, 'r') as f:
                        portfolio_data = json.load(f)
                    print(f"✓ Loaded portfolio from input file: {input_file_name}")
                except Exception as e:
                    print(f"Failed to load input file: {e}")
    
    # Final fallback: Demo portfolio
    if not portfolio_data:
        print("Using demo portfolio for testing")
        portfolio_data = {
            "portfolioId": "demo-rwa-001",
            "owner": "0xDemo",
            "assets": [
                {
                    "name": "Tokenized Real Estate - NYC",
                    "type": "RWA",
                    "value": 150000,
                    "volatility": 0.12,
                    "expectedReturn": 0.08
                },
                {
                    "name": "Invoice Factoring NFT",
                    "type": "RWA",
                    "value": 75000,
                    "volatility": 0.08,
                    "expectedReturn": 0.06
                },
                {
                    "name": "Commodity Token - Gold",
                    "type": "RWA",
                    "value": 50000,
                    "volatility": 0.18,
                    "expectedReturn": 0.10
                },
                {
                    "name": "Carbon Credit Token",
                    "type": "RWA",
                    "value": 25000,
                    "volatility": 0.25,
                    "expectedReturn": 0.15
                }
            ]
        }
    
    # Check for app developer secret (API keys, etc.)
    IEXEC_APP_DEVELOPER_SECRET = os.getenv("IEXEC_APP_DEVELOPER_SECRET")
    if IEXEC_APP_DEVELOPER_SECRET:
        print(f"✓ App secret available (length: {len(IEXEC_APP_DEVELOPER_SECRET)})")
    
    # Compute VaR
    print("\nComputing Value-at-Risk...")
    result = compute_var_montecarlo(portfolio_data, simulations)
    
    # Add metadata
    result["status"] = "success"
    result["computedIn"] = "TEE-SGX"
    result["portfolioId"] = portfolio_data.get("portfolioId", "unknown")
    
    # Print results
    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"Portfolio ID: {result['portfolioId']}")
    print(f"Total Value: ${result['totalValue']:,.2f}")
    print(f"Asset Count: {result['assetCount']}")
    print(f"Simulations: {result['simulations']}")
    print("-" * 50)
    print(f"VaR (95%): ${result['var95']:,.2f}")
    print(f"VaR (99%): ${result['var99']:,.2f}")
    print(f"CVaR (95%): ${result['cvar95']:,.2f}")
    print(f"Daily VaR %: {result['dailyVarPercent']}%")
    print(f"Risk Level: {result['riskLevel']}")
    print("=" * 50)
    
    # Write result to output
    result_path = os.path.join(IEXEC_OUT, 'result.json')
    with open(result_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    computed_json = {'deterministic-output-path': result_path}
    print(f"\n✓ Result written to {result_path}")

except Exception as e:
    print(f"\n✗ Error: {e}")
    error_result = {
        "status": "error",
        "error": str(e),
        "computedIn": "TEE-SGX"
    }
    result_path = os.path.join(IEXEC_OUT, 'result.json')
    with open(result_path, 'w') as f:
        json.dump(error_result, f, indent=2)
    computed_json = {
        'deterministic-output-path': result_path,
        'error-message': str(e)
    }

finally:
    # Always write computed.json for iExec
    with open(os.path.join(IEXEC_OUT, 'computed.json'), 'w') as f:
        json.dump(computed_json, f)
