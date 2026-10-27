import importlib.util
import io
import tarfile
from pathlib import Path

import pytest


def load_restore():
    spec = importlib.util.spec_from_file_location(
        "restore", Path(__file__).resolve().parents[1] / "scripts/restore_published_snapshots.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.restore


def archive(path, entries):
    with tarfile.open(path, "w") as bundle:
        for name, data in entries:
            member = tarfile.TarInfo(name)
            member.size = len(data)
            bundle.addfile(member, io.BytesIO(data))


def test_restores_exact_bytes_and_removes_stale_json_only(tmp_path):
    public = tmp_path / "public"
    public.mkdir()
    (public / "old.json").write_text("{}")
    (public / "icon.svg").write_text("<svg/>")
    bundle = tmp_path / "artifact.tar"
    archive(
        bundle,
        [
            ("./data.json", b'{"generatedAt":"today"}\n'),
            ("./agent/latest.json", b'{"value":1.23456789}'),
            ("./index.html", b"old UI"),
        ],
    )
    load_restore()(bundle, public)
    assert (public / "agent/latest.json").read_bytes() == b'{"value":1.23456789}'
    assert not (public / "old.json").exists()
    assert (public / "icon.svg").exists()
    assert not (public / "index.html").exists()


@pytest.mark.parametrize("name", ["../escape.json", "/escape.json"])
def test_rejects_unsafe_paths_before_changing_public(tmp_path, name):
    bundle = tmp_path / "artifact.tar"
    archive(bundle, [("data.json", b"{}"), (name, b"{}")])
    public = tmp_path / "public"
    public.mkdir()
    (public / "data.json").write_text("unchanged")
    with pytest.raises(ValueError):
        load_restore()(bundle, public)
    assert (public / "data.json").read_text() == "unchanged"


def test_rejects_incomplete_artifact(tmp_path):
    bundle = tmp_path / "artifact.tar"
    archive(bundle, [("index.html", b"old UI")])
    with pytest.raises(ValueError):
        load_restore()(bundle, tmp_path / "public")
