from pathlib import Path

WORKFLOW = Path(".github/workflows/deploy-dashboard.yml").read_text(encoding="utf-8")
REPORT_WORKFLOW = Path(".github/workflows/dashboard-report.yml").read_text(
    encoding="utf-8"
)


def test_deploy_workflow_declares_rbreaker_inputs_and_backtest_install() -> None:
    assert "research_run_id:" in WORKFLOW
    assert "enable_rbreaker:" in WORKFLOW
    assert "RESEARCH_ARTIFACT_TOKEN" in WORKFLOW
    assert "--extra backtest" in WORKFLOW
    assert "--package trading-research-dashboard-app" in WORKFLOW
    assert "--package t0-trading-dashboard" not in WORKFLOW


def test_deploy_workflow_installs_base_dashboard_package_before_validation() -> None:
    setup = WORKFLOW.index("Install Dashboard package")
    validation = WORKFLOW.index("Validate Dashboard data snapshots")
    assert "uv sync --locked --package trading-research-dashboard-app" in WORKFLOW
    assert setup < validation


def test_deploy_workflow_runs_python_validation_inside_uv_environment() -> None:
    validation = WORKFLOW.index("Validate Dashboard data snapshots")
    command = WORKFLOW.index(
        "uv run --locked --package trading-research-dashboard-app python", validation
    )
    assert (
        "apps/dashboard/scripts/validate_static_assets.py --require-contextual"
        in WORKFLOW[command:]
    )


def test_deploy_workflow_validates_and_generates_before_frontend_build() -> None:
    validation = WORKFLOW.index("load_artifact")
    generation = WORKFLOW.index("rbreaker-snapshot")
    static_validation = WORKFLOW.index("Validate Dashboard data snapshots")
    build = WORKFLOW.index("Build Dashboard")
    deploy = WORKFLOW.index("Deploy to Cloudflare")
    assert validation < generation < static_validation < build < deploy


def test_deploy_workflow_uses_temporary_artifact_and_read_only_secret() -> None:
    assert "${{ runner.temp }}/rbreaker-input" in WORKFLOW
    assert "actions/download-artifact@v8" in WORKFLOW
    assert "DASHBOARD_REPOSITORY_TOKEN" not in WORKFLOW


def test_deploy_workflow_has_explicit_skip_path() -> None:
    assert "enable_rbreaker == false" in WORKFLOW
    assert "skipped" in WORKFLOW


def test_deploy_workflow_requires_rbreaker_snapshot_in_deployed_check() -> None:
    assert "--require-rbreaker" in WORKFLOW


def test_dashboard_report_uses_current_workspace_package() -> None:
    assert "--package trading-research-dashboard-app" in REPORT_WORKFLOW
    assert "--package t0-trading-dashboard" not in REPORT_WORKFLOW


def test_ui_only_release_validates_source_and_preserves_snapshot_bytes() -> None:
    assert "published_run_id:" in WORKFLOW
    assert "actions: read" in WORKFLOW
    assert '.conclusion == "success" and .head_branch == "main"' in WORKFLOW
    assert ".head_repository.full_name == $repo" in WORKFLOW
    assert 'test "$ENABLE_RBREAKER" = false' in WORKFLOW
    assert 'test -z "$CONTEXTUAL_HISTORY$STRATEGY_OUTCOMES"' in WORKFLOW
    assert "if: ${{ inputs.published_run_id == '' }}" in WORKFLOW
    assert WORKFLOW.index("Verify published snapshot source") < WORKFLOW.index(
        "Download published Pages artifact"
    )
    assert WORKFLOW.index("Restore unchanged published JSON") < WORKFLOW.index(
        "Validate Dashboard data snapshots"
    )
