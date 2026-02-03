#!/usr/bin/env python3
"""
Unit tests for the VaR computation engine.

Run with: python -m pytest test_var.py -v
"""

import pytest
import numpy as np
from app import calculate_var, bulk_process, DEFAULT_ITERATIONS


class TestCalculateVaR:
    """Tests for single asset VaR calculation"""
    
    def test_basic_calculation(self):
        """Test basic VaR calculation returns expected structure"""
        result = calculate_var(
            value=1_000_000,
            volatility=0.15,
            iterations=5000
        )
        
        assert "var_95" in result
        assert "var_99" in result
        assert "safe_ltv_bps" in result
        assert "iterations" in result
        assert result["iterations"] == 5000
    
    def test_var_is_positive(self):
        """VaR should be positive (represents potential loss)"""
        result = calculate_var(value=1_000_000, volatility=0.15)
        assert result["var_95"] > 0
        assert result["var_99"] > 0
    
    def test_var_99_greater_than_95(self):
        """99% VaR should be greater than 95% VaR"""
        result = calculate_var(value=1_000_000, volatility=0.15)
        assert result["var_99"] > result["var_95"]
    
    def test_higher_volatility_higher_var(self):
        """Higher volatility should result in higher VaR"""
        low_vol_result = calculate_var(value=1_000_000, volatility=0.10)
        high_vol_result = calculate_var(value=1_000_000, volatility=0.30)
        
        assert high_vol_result["var_95"] > low_vol_result["var_95"]
    
    def test_safe_ltv_bounds(self):
        """Safe LTV should be between 0 and 10000 basis points"""
        result = calculate_var(value=1_000_000, volatility=0.15)
        assert 0 <= result["safe_ltv_bps"] <= 10000
    
    def test_higher_volatility_lower_ltv(self):
        """Higher volatility should result in lower safe LTV"""
        low_vol_result = calculate_var(value=1_000_000, volatility=0.08)
        high_vol_result = calculate_var(value=1_000_000, volatility=0.25)
        
        assert high_vol_result["safe_ltv_bps"] < low_vol_result["safe_ltv_bps"]
    
    def test_reproducibility_with_seed(self):
        """Same seed should produce same results"""
        result1 = calculate_var(value=1_000_000, volatility=0.15, seed=42)
        result2 = calculate_var(value=1_000_000, volatility=0.15, seed=42)
        
        assert result1["var_95"] == result2["var_95"]
        assert result1["safe_ltv_bps"] == result2["safe_ltv_bps"]
    
    def test_different_seeds_different_results(self):
        """Different seeds should produce different results"""
        result1 = calculate_var(value=1_000_000, volatility=0.15, seed=42)
        result2 = calculate_var(value=1_000_000, volatility=0.15, seed=123)
        
        # Results should be different (though statistically similar)
        assert result1["var_95"] != result2["var_95"]
    
    def test_minimum_iterations_enforced(self):
        """Should raise error if iterations < 5000"""
        with pytest.raises(ValueError, match="Minimum 5000 iterations"):
            calculate_var(value=1_000_000, volatility=0.15, iterations=1000)
    
    def test_invalid_value(self):
        """Should raise error for non-positive value"""
        with pytest.raises(ValueError, match="Asset value must be positive"):
            calculate_var(value=-1000, volatility=0.15)
        
        with pytest.raises(ValueError, match="Asset value must be positive"):
            calculate_var(value=0, volatility=0.15)
    
    def test_invalid_volatility(self):
        """Should raise error for invalid volatility"""
        with pytest.raises(ValueError, match="Volatility must be between"):
            calculate_var(value=1_000_000, volatility=-0.1)
        
        with pytest.raises(ValueError, match="Volatility must be between"):
            calculate_var(value=1_000_000, volatility=1.5)
    
    def test_var_scales_with_value(self):
        """VaR should scale proportionally with asset value"""
        result1 = calculate_var(value=1_000_000, volatility=0.15, seed=42)
        result2 = calculate_var(value=2_000_000, volatility=0.15, seed=42)
        
        # VaR should approximately double
        ratio = result2["var_95"] / result1["var_95"]
        assert 1.9 < ratio < 2.1
    
    def test_realistic_real_estate_scenario(self):
        """Test with realistic real estate parameters"""
        # $2.5M property, 15% volatility
        result = calculate_var(
            value=2_500_000,
            volatility=0.15,
            iterations=5000
        )
        
        # VaR should be reasonable (5-25% of value)
        var_pct = result["var_95"] / 2_500_000
        assert 0.05 < var_pct < 0.25
        
        # Safe LTV should be reasonable (50-85%)
        assert 5000 < result["safe_ltv_bps"] < 8500
    
    def test_realistic_bond_scenario(self):
        """Test with realistic bond portfolio parameters"""
        # $1M bond portfolio, 8% volatility
        result = calculate_var(
            value=1_000_000,
            volatility=0.08,
            iterations=5000
        )
        
        # Bonds should have lower VaR
        var_pct = result["var_95"] / 1_000_000
        assert 0.02 < var_pct < 0.15
        
        # Safe LTV should be higher for bonds
        assert result["safe_ltv_bps"] > 7500


class TestBulkProcess:
    """Tests for bulk asset processing"""
    
    def test_bulk_process_multiple_assets(self):
        """Test processing multiple assets at once"""
        assets = [
            {"value": 2_500_000, "volatility": 0.15, "asset_id": "real-estate-1"},
            {"value": 1_000_000, "volatility": 0.08, "asset_id": "bonds-1"},
            {"value": 750_000, "volatility": 0.22, "asset_id": "mixed-fund-1"},
        ]
        
        results = bulk_process(assets)
        
        assert len(results) == 3
        for r in results:
            assert "var_95" in r
            assert "safe_ltv_bps" in r
            assert "asset_id" in r
    
    def test_bulk_process_preserves_order(self):
        """Results should be in same order as input"""
        assets = [
            {"value": 1_000_000, "volatility": 0.10, "asset_id": "first"},
            {"value": 2_000_000, "volatility": 0.20, "asset_id": "second"},
        ]
        
        results = bulk_process(assets)
        
        assert results[0]["asset_id"] == "first"
        assert results[1]["asset_id"] == "second"
    
    def test_bulk_process_independent_seeds(self):
        """Each asset should have independent randomness"""
        assets = [
            {"value": 1_000_000, "volatility": 0.15},
            {"value": 1_000_000, "volatility": 0.15},
        ]
        
        results = bulk_process(assets)
        
        # Same inputs but different results due to different seeds
        assert results[0]["var_95"] != results[1]["var_95"]
    
    def test_bulk_process_handles_errors(self):
        """Should handle individual asset errors gracefully"""
        assets = [
            {"value": 1_000_000, "volatility": 0.15},
            {"value": -100, "volatility": 0.15},  # Invalid
            {"value": 500_000, "volatility": 0.10},
        ]
        
        results = bulk_process(assets)
        
        assert len(results) == 3
        assert "error" not in results[0]
        assert "error" in results[1]
        assert "error" not in results[2]
    
    def test_bulk_process_custom_iterations(self):
        """Should use custom iteration count"""
        assets = [{"value": 1_000_000, "volatility": 0.15}]
        
        results = bulk_process(assets, iterations=10000)
        
        assert results[0]["iterations"] == 10000


class TestMathematicalProperties:
    """Tests for mathematical properties of VaR"""
    
    def test_var_confidence_ordering(self):
        """VaR at higher confidence should be larger"""
        result = calculate_var(value=1_000_000, volatility=0.15)
        
        # 99% VaR > 95% VaR
        assert result["var_99"] > result["var_95"]
    
    def test_var_statistical_bounds(self):
        """VaR should be within reasonable statistical bounds"""
        # For normal distribution: VaR_95 ≈ 1.645σ
        # Over 10-day horizon with 15% annual vol:
        # daily_vol = 0.15 / sqrt(252) ≈ 0.0095
        # 10day_vol = 0.0095 * sqrt(10) ≈ 0.030
        # VaR_95 ≈ 1.645 * 0.030 * 1M ≈ $49,350
        
        result = calculate_var(value=1_000_000, volatility=0.15, seed=42)
        
        # Allow for Monte Carlo variance
        expected_var = 1_000_000 * 1.645 * (0.15 / np.sqrt(252)) * np.sqrt(10)
        
        # Should be within 50% of theoretical value (Monte Carlo has variance)
        assert 0.5 * expected_var < result["var_95"] < 1.5 * expected_var
    
    def test_convergence_with_iterations(self):
        """More iterations should reduce variance in results"""
        results_5k = [
            calculate_var(value=1_000_000, volatility=0.15, iterations=5000, seed=i)["var_95"]
            for i in range(10)
        ]
        
        results_20k = [
            calculate_var(value=1_000_000, volatility=0.15, iterations=20000, seed=i)["var_95"]
            for i in range(10)
        ]
        
        # Standard deviation should be lower with more iterations
        std_5k = np.std(results_5k)
        std_20k = np.std(results_20k)
        
        assert std_20k < std_5k


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
