"""Detached Vite frontend launcher — survives parent shell exit.

Run from the workspace root:
    python restart_frontend.py

Logs land at %TEMP%\\vite.log so stdout/stderr from Vite is preserved.
"""
import os
import subprocess
import sys
import time

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
CREATE_NO_WINDOW = 0x08000000

log_path = os.path.expandvars(r"%TEMP%\vite.log")
log = open(log_path, "a", encoding="utf-8")
log.write("\n--- restart at " + time.ctime() + " ---\n")
log.flush()

# Resolve the vite binary directly under the project node_modules so we don't
# depend on a PATH lookup (which has been unreliable in some shells).
frontend_dir = r"F:\Download\PUKU\PukuHackAthonProjectRootFile\PLASMA_PRISM_HackAthon_Task\frontend"
vite_bin = os.path.join(frontend_dir, "node_modules", ".bin", "vite.cmd")
if not os.path.isfile(vite_bin):
    raise SystemExit(f"vite.cmd not found at {vite_bin} — run `npm install` in {frontend_dir}")

# Vite serves on 5173 by default; explicit bind to 127.0.0.1.
cmd = [
    vite_bin,
    "--port", "5173",
    "--host", "127.0.0.1",
    "--strictPort",
]

proc = subprocess.Popen(
    cmd,
    cwd=frontend_dir,
    stdout=log,
    stderr=log,
    stdin=subprocess.DEVNULL,
    creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
)
print(f"Started detached Vite pid={proc.pid}")
print(f"Log: {log_path}")
