"""Extract a verified GitHub ZIP without allowing paths or archive bombs to escape."""
import pathlib
import stat
import sys
import zipfile

archive, destination = map(pathlib.Path, sys.argv[1:])
with zipfile.ZipFile(archive) as source:
    entries = source.infolist()
    if len(entries) > 50000 or sum(item.file_size for item in entries) > 1024**3:
        raise ValueError("Artifact exceeds extraction limits")
    seen = set()
    for item in entries:
        path = pathlib.PurePosixPath(item.filename)
        mode = item.external_attr >> 16
        if (not item.filename or path.is_absolute() or ".." in path.parts
                or "\\" in item.filename or ":" in item.filename
                or item.filename in seen or item.file_size > 200 * 1024**2
                or (stat.S_IFMT(mode) and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode)))):
            raise ValueError("Unsafe archive entry")
        seen.add(item.filename)
    destination.mkdir(parents=True, exist_ok=False)
    source.extractall(destination)
