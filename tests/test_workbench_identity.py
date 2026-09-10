from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_root_project_uses_workbench_identity_without_renaming_runtime_package() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    root_project = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    dashboard_package = (ROOT / "apps/dashboard/pyproject.toml").read_text(encoding="utf-8")

    assert package["name"] == "quant-trading-workbench"
    assert 'name = "quant-trading-workbench"' in root_project
    assert 'name = "trading-research-dashboard-app"' in dashboard_package


def test_workbench_boundary_names_probe_playbook_and_promotion_rules() -> None:
    text = (ROOT / "docs/workbench-boundary.md").read_text(encoding="utf-8")

    for marker in (
        "research_probe",
        "intraday_playbook",
        "execution_experiment",
        "quant-research",
        "样本外",
        "成本",
        "不发送真实订单",
    ):
        assert marker in text


def test_identity_docs_use_workbench_as_current_product_name() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    architecture = (ROOT / "docs/architecture/project-structure.md").read_text(encoding="utf-8")

    assert readme.startswith("# Quant Trading Workbench")
    assert "quant-trading-workbench" in readme
    assert "quant-trading-workbench" in architecture


def test_existing_runtime_paths_and_contracts_remain_stable() -> None:
    workflow_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (ROOT / ".github/workflows").glob("*.yml")
    )

    assert "trading-research-dashboard-app" in workflow_text
    assert "apps/dashboard/" in workflow_text
    assert "trading-research-dashboard.xiaowang01.workers.dev" in (ROOT / "README.md").read_text(encoding="utf-8")
    assert (ROOT / "apps/dashboard/src/trading_research/__init__.py").is_file()
    assert "niu_men.research_snapshot.v2" in (ROOT / "schemas/research-snapshot.schema.json").read_text(encoding="utf-8")
