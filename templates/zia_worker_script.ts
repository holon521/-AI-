
// ZIA COLAB WORKER SCRIPT TEMPLATE v3.0 (UNRESTRICTED JUPYTER PORTAL)
// This script turns Google Colab into a fully accessible Remote Desktop for ZIA.
// Features: JupyterLab, Ngrok Tunneling, Playwright (Browser Automation), Security Unlocked.

export const PYTHON_WORKER_SCRIPT = `
# ==========================================
# ZIA: HOLON WORLD - COMPUTE SWARM WORKER
# ==========================================
# v3.0 | The Portal (Jupyter Lab & Browser Automation)
#
# [INSTRUCTIONS]
# 1. Run this cell in Google Colab.
# 2. Grant Google Drive permissions.
# 3. Wait for "[ZIA] 🟢 JUPYTER LAB LINK ESTABLISHED" message.
# 4. Return to ZIA Web App and click "REMOTE DESKTOP".

import os
import json
import time
import sys
import subprocess
import threading
from google.colab import drive

# --- 1. CONFIGURATION ---
BASE_DIR = '/content/drive/MyDrive/_ZIA_HOLON_WORLD'
CONNECTION_FILE = os.path.join(BASE_DIR, 'connection_info.json')

print("[ZIA] 🧠 Initializing System...")

# Mount Drive
if not os.path.exists('/content/drive'):
    drive.mount('/content/drive')

if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR)

# --- 2. INSTALLATION (AUTO-HEALING) ---
print("[ZIA] 📦 Installing Core Infrastructure (This may take a minute)...")

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Install Jupyter, Ngrok, and Playwright
pkgs = ['jupyterlab', 'pyngrok', 'playwright', 'nest_asyncio']
for pkg in pkgs:
    try:
        __import__(pkg)
    except ImportError:
        print(f"   ⬇️ Installing {pkg}...")
        install(pkg)

# Install Playwright Browsers (For Web Automation)
print("   ⬇️ Installing Chromium for Browser Automation...")
subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=False)

import nest_asyncio
nest_asyncio.apply()
from pyngrok import ngrok

# --- 3. LAUNCH JUPYTER LAB (UNRESTRICTED) ---
print("[ZIA] 🚀 Launching Jupyter Lab (Security Filters Disabled)...")

# Kill previous instances if any
subprocess.run(["pkill", "-f", "jupyter-lab"], check=False)

# Start Jupyter Lab in Background
# --allow-root: Run as root
# --no-browser: Headless
# --ServerApp.token='': NO PASSWORD REQUIRED (Full Access)
# --ServerApp.allow_origin='*': Allow ZIA App to embed via iframe
# --ServerApp.disable_check_xsrf=True: Allow API calls from ZIA
# --ServerApp.ip='0.0.0.0': Listen on all interfaces
cmd = [
    "jupyter-lab",
    "--ip=0.0.0.0",
    "--port=8888",
    "--no-browser",
    "--allow-root",
    "--ServerApp.token=''",
    "--ServerApp.password=''",
    "--ServerApp.allow_origin='*'",
    "--ServerApp.disable_check_xsrf=True",
    "--ServerApp.allow_remote_access=True",
    f"--ServerApp.root_dir='{BASE_DIR}'"
]

process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# --- 4. ESTABLISH TUNNEL (NGROK) ---
print("[ZIA] 🚇 Establishing Secure Tunnel...")

# Disconnect existing tunnels
ngrok.kill()

# Open Tunnel to port 8888
try:
    public_url = ngrok.connect(8888).public_url
    print(f"\\n[ZIA] 🟢 JUPYTER LAB LINK ESTABLISHED: {public_url}")
    print("       (This URL is being sent to your ZIA App via Drive Bridge)")
    
    # Save Connection Info for ZIA App
    with open(CONNECTION_FILE, 'w') as f:
        json.dump({
            "url": public_url,
            "status": "active",
            "timestamp": time.time(),
            "note": "IFRAME_READY"
        }, f)
        
except Exception as e:
    print(f"❌ Tunnel Error: {e}")
    # Fallback: Print instructions if Ngrok fails (e.g. auth token missing)
    print("   ! If Ngrok failed, you might need an Authtoken.")
    print("   ! Sign up at ngrok.com and run: !ngrok authtoken <YOUR_TOKEN> in a cell above.")

# --- 5. KEEPALIVE LOOP ---
print("-" * 50)
print("📡 ZIA SWARM NODE IS ACTIVE. DO NOT CLOSE THIS TAB.")
print("-" * 50)

try:
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("Shutting down...")
    ngrok.kill()
    process.terminate()
`;
