from pathlib import Path

import pandas as pd

from trading_research.strategies import rbreaker_data


def test_load_or_download_data_reads_normalized_local_csv(tmp_path: Path) -> None:
    path = tmp_path / "300246_20260810_20260810.csv"
    pd.DataFrame(
        {
            "时间": ["2026-08-10 09:30:00"],
            "开盘": [10.0],
            "最高": [10.2],
            "最低": [9.9],
            "收盘": [10.1],
            "成交量": [1000],
        }
    ).to_csv(path, index=False, encoding="utf-8-sig")

    result = rbreaker_data.load_or_download_data("300246", "20260810", "20260810", tmp_path)

    assert list(result["时间"]) == [pd.Timestamp("2026-08-10 09:30:00")]


def test_load_or_download_data_returns_empty_frame_for_malformed_csv(tmp_path: Path) -> None:
    path = tmp_path / "300246_20260810_20260810.csv"
    path.write_text("unexpected\nvalue\n", encoding="utf-8")

    result = rbreaker_data.load_or_download_data("300246", "20260810", "20260810", tmp_path)

    assert result.empty


def test_cache_read_failure_returns_empty_without_retrying_provider(tmp_path, monkeypatch):
    # An existing directory produces a real read_csv OSError on all platforms.
    (tmp_path / "300246_20260810_20260810.csv").mkdir()

    def unexpected_download(*args, **kwargs):
        raise AssertionError("an existing cache must not contact a provider")

    monkeypatch.setattr(rbreaker_data, "download_stock_data_tushare", unexpected_download)
    assert rbreaker_data.load_or_download_data("300246", "20260810", "20260810", tmp_path).empty


def test_cache_invalid_timestamp_returns_empty(tmp_path):
    (tmp_path / "300246_20260810_20260810.csv").write_text(
        "时间,收盘\nnot-a-date,10\n", encoding="utf-8"
    )
    assert rbreaker_data.load_or_download_data("300246", "20260810", "20260810", tmp_path).empty


def test_tushare_download_normalizes_sorts_and_round_trips_cache(tmp_path, monkeypatch):
    import tushare

    calls = []
    raw = pd.DataFrame(
        {
            "trade_time": ["2026-08-10 09:31:00", "2026-08-10 09:30:00"],
            "open": [12, 10],
            "high": [13, 11],
            "low": [11, 9],
            "close": [12.5, 10.5],
            "vol": [200, 100],
            "amount": [2500, 1050],
        }
    )

    class Provider:
        def stk_mins(self, **kwargs):
            calls.append(kwargs)
            return raw

    monkeypatch.setattr(tushare, "set_token", lambda token: None)
    monkeypatch.setattr(tushare, "pro_api", Provider)
    result = rbreaker_data.load_or_download_data(
        "600000", "20260810", "20260810", tmp_path, token="offline-fixture"
    )
    assert calls == [
        {
            "ts_code": "600000.SH",
            "freq": "1min",
            "start_date": "2026-08-10 09:30:00",
            "end_date": "2026-08-10 15:00:00",
        }
    ]
    assert list(result.columns) == ["时间", "开盘", "最高", "最低", "收盘", "成交量"]
    assert result["时间"].tolist() == list(pd.date_range("2026-08-10 09:30", periods=2, freq="min"))
    assert result["收盘"].tolist() == [10.5, 12.5]
    assert result["成交量"].tolist() == [100, 200]
    cached = rbreaker_data.load_or_download_data("600000", "20260810", "20260810", tmp_path)
    pd.testing.assert_frame_equal(cached, result)
    assert len(calls) == 1


def test_tushare_empty_response_does_not_publish_cache(tmp_path, monkeypatch):
    import pytest
    import tushare

    class Provider:
        def stk_mins(self, **kwargs):
            return pd.DataFrame()

    monkeypatch.setattr(tushare, "set_token", lambda token: None)
    monkeypatch.setattr(tushare, "pro_api", Provider)
    with pytest.raises(RuntimeError, match="未返回数据"):
        rbreaker_data.load_or_download_data(
            "000001", "20260810", "20260810", tmp_path, token="offline-fixture"
        )
    assert not list(tmp_path.glob("*.csv"))


def test_recent_daily_bars_include_exactly_one_preceding_session(monkeypatch):
    # Deliberately unordered input: the previous bar is a trading session, not yesterday.
    raw = pd.DataFrame(
        {"日期": ["2026-08-10", "2026-08-06", "2026-08-11", "2026-08-07"], "收盘": [10, 6, 11, 7]}
    )
    monkeypatch.setattr(rbreaker_data.ak, "stock_zh_a_hist", lambda **kwargs: raw.copy())
    result = rbreaker_data.get_recent_trading_days_with_prev("000001", 2)
    assert result["日期"].tolist() == list(
        pd.to_datetime(["2026-08-07", "2026-08-10", "2026-08-11"])
    )
    assert result["收盘"].tolist() == [7, 10, 11]
    assert rbreaker_data.get_recent_trading_days_with_prev("000001", 4).empty
