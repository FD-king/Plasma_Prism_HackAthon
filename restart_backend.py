"""Detached backend launcher — survives parent shell exit."""
import os
import subprocess
import sys
import time

# Windows constants
DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
CREATE_NO_WINDOW = 0x08000000

log_path = os.path.expandvars(r"%TEMP%\uvicorn.log")
log = open(log_path, "a", encoding="utf-8")
log.write("\n--- restart at " + time.ctime() + " ---\n")
log.flush()

cwd = r"F:\Download\PUKU\PukuHackAthonProjectRootFile\PLASMA_PRISM_HackAthon_Task"

# Start fresh, detached
proc = subprocess.Popen(
    [
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--host", "127.0.0.1", "--port", "8000", "--log-level", "info",
    ],
    cwd=cwd,
    stdout=log,
    stderr=log,
    stdin=subprocess.DEVNULL,
    creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
)
print(f"Started detached uvicorn pid={proc.pid}")
print(f"Log: {log_path}")

