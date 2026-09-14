from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from importlib.resources import files
from pathlib import Path
from statistics import fmean, median, pstdev
from typing import Any

from jsonschema import Draft202012Validator

STATE_PROBE_VERSION = "trading_research.state_probe.v1"


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def _date(value: Any) -> str:
    if not isinstance(value, str) or len(value) < 10:
        raise ValueError("observation date must be YYYY-MM-DD")
    text = value[:10]
    try:
        year, month, day = (int(part) for part in text.split("-"))
    except ValueError as exc:
        raise ValueError("observation date must be YYYY-MM-DD") from exc
    if year < 1 or not 1 <= month <= 12 or not 1 <= day <= 31:
        raise ValueError("observation date must be YYYY-MM-DD")
    return text


def _ratio(values: list[float], short_window: int, long_window: int) -> float | None:
    if len(values) < long_window:
        return None
    long_mean = fmean(values[-long_window:])
    if long_mean == 0:
        return None
    return fmean(values[-short_window:]) / long_mean


def _state(value: float | None, thresholds: Mapping[str, float]) -> str:
    if value is None:
        return "insufficient_data"
    for name, threshold in sorted(thresholds.items(), key=lambda item: item[1]):
        if value <= threshold:
            return name
    return "normal"


def _percentile(value: float, history: list[float]) -> float:
    if len(history) <= 1:
        return 0.5
    return sum(item <= value for item in history) / len(history)


def _optional_return(item: Mapping[str, Any], horizon: str) -> float | None:
    values = item.get("forwardReturns")
    if not isinstance(values, Mapping):
        return None
    return _number(values.get(horizon))


def _mean_or_none(values: list[float]) -> float | None:
    return fmean(values) if values else None


def _occupancy(event_indexes: list[int], horizon: int, total: int) -> tuple[float | None, float | None]:
    if not event_indexes or total <= 0:
        return None, None
    active = [0] * total
    for index in event_indexes:
        for position in range(index, min(total, index + horizon + 1)):
            active[position] += 1
    return fmean(active), float(max(active))


def build_state_probe(
    observations: Sequence[Mapping[str, Any]],
    *,
    probe_id: str,
    feature_id: str,
    short_window: int,
    long_window: int,
    thresholds: Mapping[str, float],
    horizons: Sequence[int],
    generated_at: str,
    baseline_returns: Mapping[str, Mapping[str, Any]] | None = None,
    episode_min_false_days: int = 1,
    capital_per_event: float = 1.0,
) -> dict[str, Any]:
    if not observations:
        raise ValueError("observations must not be empty")
    if short_window <= 0 or long_window <= 0 or short_window > long_window:
        raise ValueError("windows must be positive and short_window <= long_window")
    if not horizons or any(isinstance(horizon, bool) or horizon <= 0 for horizon in horizons):
        raise ValueError("horizons must contain positive integers")
    if episode_min_false_days <= 0 or capital_per_event <= 0:
        raise ValueError("episode_min_false_days and capital_per_event must be positive")
    if not thresholds or any(_number(value) is None for value in thresholds.values()):
        raise ValueError("thresholds must contain numeric values")

    rows: list[dict[str, Any]] = []
    previous_date: str | None = None
    values: list[float] = []
    for observation in observations:
        if not isinstance(observation, Mapping):
            raise TypeError("each observation must be an object")
        date = _date(observation.get("date"))
        if previous_date is not None and date <= previous_date:
            raise ValueError("observation dates must be strictly increasing")
        value = _number(observation.get("value"))
        if value is None:
            raise ValueError(f"observation {date} value must be numeric")
        values.append(value)
        ratio = _ratio(values, short_window, long_window)
        rows.append({"date": date, "value": value, "ratio": ratio, "source": observation})
        previous_date = date

    events: list[dict[str, Any]] = []
    for row in rows:
        ratio = row["ratio"]
        history = [item["ratio"] for item in rows if item["ratio"] is not None and item["date"] <= row["date"]]
        prior_ratio = next((item["ratio"] for item in reversed(rows[: rows.index(row)]) if item["ratio"] is not None), None)
        slope = None if ratio is None or prior_ratio is None else ratio - prior_ratio
        event = {
            "date": row["date"],
            "value": ratio,
            "percentile": None if ratio is None else _percentile(ratio, history),
            "zScore": None if ratio is None or len(history) < 2 or pstdev(history) == 0 else (ratio - fmean(history)) / pstdev(history),
            "slope": slope,
            "state": _state(ratio, thresholds),
            "condition": ratio is not None and ratio <= min(thresholds.values()),
        }
        events.append(event)

    condition_indexes = [index for index, event in enumerate(events) if event["condition"]]
    episode_indexes: list[int] = []
    last_episode = -episode_min_false_days - 1
    for index in condition_indexes:
        if index - last_episode > episode_min_false_days:
            episode_indexes.append(index)
        last_episode = index

    outcome_rows: list[dict[str, Any]] = []
    baseline_returns = baseline_returns or {}
    for horizon in horizons:
        horizon_name = f"{horizon}d"
        returns: list[float] = []
        mves: list[float] = []
        maes: list[float] = []
        baseline: list[float] = []
        eligible_indexes: list[int] = []
        for index in condition_indexes:
            source = rows[index]["source"]
            return_value = _optional_return(source, horizon_name)
            if return_value is None:
                continue
            eligible_indexes.append(index)
            returns.append(return_value)
            mfe = _number(source.get("mfe", {}).get(horizon_name)) if isinstance(source.get("mfe"), Mapping) else None
            mae = _number(source.get("mae", {}).get(horizon_name)) if isinstance(source.get("mae"), Mapping) else None
            if mfe is not None:
                mves.append(mfe)
            if mae is not None:
                maes.append(mae)
            baseline_value = _number(baseline_returns.get(horizon_name, {}).get(rows[index]["date"]))
            if baseline_value is not None:
                baseline.append(baseline_value)
        average_occupancy, peak_occupancy = _occupancy(eligible_indexes, horizon, len(rows))
        mean_return = _mean_or_none(returns)
        baseline_mean = _mean_or_none(baseline)
        outcome_rows.append(
            {
                "horizon": horizon_name,
                "sampleCount": len(condition_indexes),
                "eligibleCount": len(eligible_indexes),
                "censoredCount": len(condition_indexes) - len(eligible_indexes),
                "coverage": len(eligible_indexes) / len(condition_indexes) if condition_indexes else 0.0,
                "episodeCount": len(episode_indexes),
                "winRate": None if not returns else sum(value > 0 for value in returns) / len(returns),
                "meanReturn": mean_return,
                "medianReturn": median(returns) if returns else None,
                "baselineMeanReturn": baseline_mean,
                "meanExcessReturn": None if mean_return is None or baseline_mean is None else mean_return - baseline_mean,
                "meanMfe": _mean_or_none(mves),
                "meanMae": _mean_or_none(maes),
                "averageCapitalOccupancy": None if average_occupancy is None else average_occupancy * capital_per_event,
                "peakCapitalOccupancy": None if peak_occupancy is None else peak_occupancy * capital_per_event,
            }
        )

    current = events[-1]
    result = {
        "schemaVersion": STATE_PROBE_VERSION,
        "generatedAt": generated_at,
        "probe": {
            "id": probe_id,
            "featureId": feature_id,
            "shortWindow": short_window,
            "longWindow": long_window,
            "thresholds": dict(thresholds),
            "horizons": [f"{horizon}d" for horizon in horizons],
            "episodeMinFalseDays": episode_min_false_days,
        },
        "current": current,
        "events": events,
        "outcomes": outcome_rows,
        "quality": {"status": "pass", "warnings": []},
        "provenance": {"source": "research-core", "definitionVersion": "state-probe.v1"},
    }
    validate_state_probe(result)
    return result


def _load_schema() -> dict[str, Any]:
    return json.loads(files("research_core.schemas").joinpath("state-probe.v1.schema.json").read_text(encoding="utf-8"))


_VALIDATOR = Draft202012Validator(_load_schema())


def validate_state_probe(payload: Mapping[str, Any]) -> None:
    if not isinstance(payload, Mapping):
        raise TypeError("state probe validation failed: root must be an object")
    errors = sorted(_VALIDATOR.iter_errors(payload), key=lambda error: tuple(str(part) for part in error.absolute_path))
    if errors:
        error = errors[0]
        location = ".".join(str(part) for part in error.absolute_path) or "root"
        raise ValueError(f"state probe validation failed at {location}: {error.message}")
    for outcome in payload["outcomes"]:
        if outcome["eligibleCount"] + outcome["censoredCount"] != outcome["sampleCount"]:
            raise ValueError("state probe validation failed: eligibleCount + censoredCount must equal sampleCount")
        expected_coverage = outcome["eligibleCount"] / outcome["sampleCount"] if outcome["sampleCount"] else 0.0
        if abs(outcome["coverage"] - expected_coverage) > 1e-9:
            raise ValueError("state probe validation failed: coverage is inconsistent with counts")


def load_state_probe(path: str | Path) -> dict[str, Any]:
    source = Path(path)
    try:
        payload = json.loads(source.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"state probe validation failed: invalid JSON: {exc.msg}") from exc
    if not isinstance(payload, dict):
        raise TypeError("state probe validation failed: root must be an object")
    validate_state_probe(payload)
    return payload
