"""Restore JSON bytes from a verified Pages artifact without restoring old UI assets."""

import argparse
import json
import tarfile
from pathlib import Path, PurePosixPath


def restore(archive: Path, public: Path) -> None:
    snapshots: dict[PurePosixPath, bytes] = {}
    with tarfile.open(archive) as bundle:
        for member in bundle.getmembers():
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts or member.issym() or member.islnk():
                raise ValueError(f"Unsafe artifact member: {member.name}")
            if not member.isfile() or path.suffix != ".json":
                continue
            if path in snapshots:
                raise ValueError(f"Duplicate snapshot: {path}")
            stream = bundle.extractfile(member)
            if stream is None:
                raise ValueError(f"Unreadable snapshot: {path}")
            payload = stream.read()
            json.loads(payload)
            snapshots[path] = payload
    if PurePosixPath("data.json") not in snapshots:
        raise ValueError("Pages artifact does not contain data.json")
    # Validate the complete archive before touching the destination.
    if public.is_symlink() or any(p.is_symlink() for p in public.rglob("*")):
        raise ValueError("Public directory must not contain symlinks")
    for old in public.rglob("*.json"):
        old.unlink()
    for path, payload in snapshots.items():
        destination = public / str(path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(payload)
    print(f"Restored {len(snapshots)} unchanged JSON snapshots from {archive.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("public", type=Path)
    args = parser.parse_args()
    restore(args.archive, args.public)
