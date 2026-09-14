import pytest

from research_core.state_probe import build_state_probe


def test_build_state_probe_reports_ratio_percentile_zscore_and_slope() -> None:
    result = build_state_probe(
        [
            {"date": "2026-01-01", "value": 100},
            {"date": "2026-01-02", "value": 60},
            {"date": "2026-01-03", "value": 40},
            {"date": "2026-01-04", "value": 10},
        ],
        probe_id="liquidity",
        feature_id="turnover_ratio",
        short_window=2,
        long_window=3,
        thresholds={"compressed": 0.85},
        horizons=[1],
        generated_at="2026-01-03T00:00:00Z",
    )
    assert result["current"]["value"] == pytest.approx(0.6818181818181818)
    assert result["current"]["state"] == "compressed"
    assert result["current"]["slope"] < 0
    assert result["events"][-1]["condition"] is True


def test_outcomes_separate_episodes_censored_rows_and_overlapping_occupancy() -> None:
    observations = [
        {"date": f"2026-01-0{day}", "value": value, "forwardReturns": {"1d": 0.02} if day != 5 else {}}
        for day, value in [(1, 100), (2, 60), (3, 70), (4, 100), (5, 60)]
    ]
    result = build_state_probe(
        observations,
        probe_id="liquidity",
        feature_id="turnover_ratio",
        short_window=1,
        long_window=2,
        thresholds={"compressed": 0.85},
        horizons=[1, 5],
        generated_at="2026-01-05T00:00:00Z",
        baseline_returns={"1d": {"2026-01-01": 0.01, "2026-01-02": 0.01}},
    )
    one_day = next(item for item in result["outcomes"] if item["horizon"] == "1d")
    five_day = next(item for item in result["outcomes"] if item["horizon"] == "5d")
    assert one_day["sampleCount"] == 2
    assert one_day["episodeCount"] == 2
    assert one_day["eligibleCount"] == 1
    assert one_day["censoredCount"] == 1
    assert one_day["meanExcessReturn"] == 0.01
    assert five_day["eligibleCount"] == 0
    assert five_day["censoredCount"] == 2
    assert five_day["coverage"] == 0.0
