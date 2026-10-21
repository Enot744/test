import subprocess
import re
import time
import sys

def run_tunnel():
    cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=6",
        "-o", "ExitOnForwardFailure=yes",
        "-R", "80:127.0.0.1:8080",
        "nokey@localhost.run"
    ]
    
    print("[TUNNEL] Starting SSH tunnel to localhost.run (127.0.0.1:8080)...")
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    
    while True:
        line = proc.stdout.readline()
        if not line:
            break
        print(line, end="")
        sys.stdout.flush()
        m = re.search(r"https://[a-zA-Z0-9.-]+\.life", line)
        if m:
            url = m.group(0)
            print(f"\n>>> LIVE PUBLIC URL: {url} <<<\n")
            with open("live_url.txt", "w", encoding="utf-8") as f:
                f.write(url)
            sys.stdout.flush()
            
    ret = proc.wait()
    print(f"[TUNNEL] Disconnected with exit code {ret}. Reconnecting in 2 seconds...")

if __name__ == "__main__":
    while True:
        try:
            run_tunnel()
        except Exception as e:
            print("[TUNNEL ERROR]:", e)
        time.sleep(2)
