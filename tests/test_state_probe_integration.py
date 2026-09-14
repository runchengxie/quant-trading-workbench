from research_core import STATE_PROBE_VERSION, load_state_probe


def test_example_state_probe_is_a_valid_research_snapshot() -> None:
    payload = load_state_probe("apps/dashboard/web/public/state-probe.example.json")
    assert payload["schemaVersion"] == STATE_PROBE_VERSION
    outcome = payload["outcomes"][0]
    assert outcome["eligibleCount"] + outcome["censoredCount"] == outcome["sampleCount"]
