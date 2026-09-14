import pytest

from research_core.state_probe import validate_state_probe


def test_validate_state_probe_rejects_inconsistent_counts() -> None:
    payload = {
        "schemaVersion": "trading_research.state_probe.v1",
        "generatedAt": "2026-01-05T00:00:00Z",
        "probe": {"id": "liquidity", "featureId": "turnover_ratio", "shortWindow": 1, "longWindow": 1, "thresholds": {"compressed": 0.8}, "horizons": ["1d"], "episodeMinFalseDays": 1},
        "current": {"date": "2026-01-05", "value": 0.8, "percentile": None, "zScore": None, "slope": None, "state": "compressed", "condition": True},
        "events": [],
        "outcomes": [{"horizon": "1d", "sampleCount": 1, "eligibleCount": 2, "censoredCount": 0, "coverage": 1.0, "episodeCount": 1, "winRate": None, "meanReturn": None, "medianReturn": None, "baselineMeanReturn": None, "meanExcessReturn": None, "meanMfe": None, "meanMae": None, "averageCapitalOccupancy": None, "peakCapitalOccupancy": None}],
        "quality": {"status": "warning", "warnings": []},
        "provenance": {"source": "test", "definitionVersion": "test.v1"},
    }
    with pytest.raises(ValueError, match="eligibleCount"):
        validate_state_probe(payload)
