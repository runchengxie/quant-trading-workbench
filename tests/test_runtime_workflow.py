from pathlib import Path


def _root() -> Path:
    return Path(__file__).resolve().parents[1]


def test_publish_snapshot_requires_dedicated_cross_repo_artifact_token() -> None:
    text = (_root() / ".github/workflows/publish-research-snapshot.yml").read_text(encoding="utf-8")

    assert "RESEARCH_ARTIFACT_TOKEN" in text
    assert "inputs.artifact_repository != github.repository" in text
    assert "Cross-repository artifact access requires RESEARCH_ARTIFACT_TOKEN" in text
    assert "inputs.artifact_repository == github.repository && github.token || secrets.RESEARCH_ARTIFACT_TOKEN" in text


def test_dashboard_report_schedule_runs_authoritative_experiment_mode() -> None:
    text = (_root() / ".github/workflows/dashboard-report.yml").read_text(encoding="utf-8")

    assert 'cron: "10 1 * * 1-5"' in text
    assert "SCHEDULE_MODE: authoritative" in text
    assert "options:" in text
    assert "- shadow" in text
    assert "- authoritative" in text
    assert "check_runtime_candidate.py" in text
    assert '--mode "${{ steps.mode.outputs.mode }}"' in text
    assert "dashboard-runtime-candidate-${{ github.run_id }}" in text
    assert "if: ${{ steps.mode.outputs.mode == 'authoritative' }}" in text
    assert "npx --yes wrangler@4 deploy --config apps/dashboard/wrangler.jsonc" in text


def test_dashboard_report_only_deploys_to_github_pages_in_authoritative_mode() -> None:
    text = (_root() / ".github/workflows/dashboard-report.yml").read_text(encoding="utf-8")

    upload_step = text.split("      - name: Upload Dashboard to GitHub Pages", 1)[1].split("      - name:", 1)[0]
    deploy_step = text.split("      - name: Deploy Dashboard to GitHub Pages", 1)[1].split("      - name:", 1)[0]

    assert "if: ${{ steps.mode.outputs.mode == 'authoritative' }}" in upload_step
    assert "if: ${{ steps.mode.outputs.mode == 'authoritative' }}" in deploy_step


def test_shadow_path_has_no_repository_write_permission() -> None:
    text = (_root() / ".github/workflows/dashboard-report.yml").read_text(encoding="utf-8")

    assert "permissions:\n  contents: read" in text
    assert "git push" not in text
    assert "git add data/raw" not in text


def test_foundation_workflow_checks_market_data_service() -> None:
    text = (_root() / ".github/workflows/foundation.yml").read_text(encoding="utf-8")

    assert "working-directory: apps/market-data-service" in text
    assert "uv run --locked pytest -q" in text
    assert "uv run --locked ruff check src tests" in text


def test_foundation_workflow_checks_dashboard_and_research_core_quality() -> None:
    text = (_root() / ".github/workflows/foundation.yml").read_text(encoding="utf-8")

    assert "working-directory: apps/dashboard" in text
    assert "uv run --locked ruff check src scripts tests" in text
    assert "working-directory: packages/research-core" in text


def test_pull_request_runs_root_and_market_service_unit_regressions() -> None:
    text = (_root() / ".github/workflows/pr-ci.yml").read_text(encoding="utf-8")
    root_step = text.split("      - name: Test workspace foundation", 1)[1].split(
        "      - name:", 1
    )[0]
    market_step = text.split("      - name: Test and lint Market Data Service", 1)[1].split(
        "      - name:", 1
    )[0]
    assert '      - "scripts/**"' in text
    assert '      - "tests/**"' in text
    assert "uv run --locked --extra dev pytest -q" in root_step
    assert "working-directory: apps/market-data-service" in market_step
    assert "uv run --locked pytest -q" in market_step
    assert "-m integration" not in market_step
    assert "uv run --locked ruff check src tests" in market_step
    assert "secrets." not in root_step + market_step
