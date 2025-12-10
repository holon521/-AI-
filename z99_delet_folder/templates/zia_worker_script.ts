
// ZIA COLAB WORKER SCRIPT v7.2 (ZOMBIE MODE - NEVER DIES)
// [v7.2 Update]
// Implements a global try-except loop to prevent the worker from crashing on bad input.
// Sends explicit error reports (res_python_exec.json) back to the UI so the user isn't left hanging.
// Ensures notebook cell IDs are unique.

export const PYTHON_WORKER_SCRIPT = `
# ==============================================================================
# 🌌 ZIA: HOLON WORKBENCH (v7.2)
# ==============================================================================
import os
import json
import time
import sys
import subprocess
import shutil
import io
import base64
import contextlib
import traceback
from google.colab import drive

# --- 1. SETUP WORKSPACE ---
print("[ZIA] 🟢 Initializing Holon Compute Node v7.2...")

if not os.path.exists('/content/drive'):
    drive.mount('/content/drive')

BASE_DIR = '/content/drive/MyDrive/_ZIA_HOLON_WORLD'
MEMORY_DIR = os.path.join(BASE_DIR, 'chroma_vector_store')
BUFFER_DIR = BASE_DIR
PIP_CACHE_DIR = os.path.join(BASE_DIR, 'pip_cache')
REPO_DIR = os.path.join(BASE_DIR, 'repositories')
ARCHIVE_DIR = os.path.join(BASE_DIR, 'archive')

for d in [BASE_DIR, MEMORY_DIR, PIP_CACHE_DIR, REPO_DIR, ARCHIVE_DIR]:
    if not os.path.exists(d): os.makedirs(d)

if REPO_DIR not in sys.path: sys.path.append(REPO_DIR)

# --- 2. ENGINES ---
def install(package):
    print(f"   ⬇️ Installing {package}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet", "--find-links", PIP_CACHE_DIR])

REQUIRED_PKGS = ['chromadb', 'sentence-transformers', 'scikit-learn', 'matplotlib', 'pandas', 'pyngrok', 'jupyterlab']
for pkg in REQUIRED_PKGS:
    try: __import__(pkg.replace('-', '_'))
    except: install(pkg)

import chromadb
from sentence_transformers import SentenceTransformer
from pyngrok import ngrok
import matplotlib.pyplot as plt

# --- 3. DYNAMIC EXECUTOR ---
class PythonExecutor:
    def execute(self, code):
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        image_base64 = None
        html_content = None
        
        plt.clf()
        plt.close('all')

        try:
            with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(stderr_capture):
                exec(code, globals())
            
            if plt.get_fignums():
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
                buf.seek(0)
                image_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close('all')

        except Exception:
            # Capture the full traceback
            traceback.print_exc(file=stderr_capture)
        
        return {
            "stdout": stdout_capture.getvalue(),
            "stderr": stderr_capture.getvalue(),
            "image": image_base64,
            "html": html_content
        }

executor = PythonExecutor()
math_core = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path=MEMORY_DIR)
collection = chroma_client.get_or_create_collection(name="zia_memory")

# --- 4. MAIN LOOP ---
print(f"🚀 SWARM READY. Monitoring: {BUFFER_DIR}")
active_tunnels = {}

while True:
    try:
        # Heartbeat
        with open(os.path.join(BASE_DIR, 'swarm_status.json'), 'w') as f:
            json.dump({"status": "ONLINE", "version": "v7.2", "memory_count": collection.count(), "active_apps": list(active_tunnels.keys())}, f)

        # Process Tasks
        files = [f for f in os.listdir(BUFFER_DIR) if f.startswith('req_') and f.endswith('.json')]
        for filename in files:
            path = os.path.join(BUFFER_DIR, filename)
            try:
                with open(path, 'r') as f: task = json.load(f)
            except: 
                # File corrupted or locked, skip
                continue
            
            print(f"[Task] {filename}")
            
            try:
                # --- EXECUTE PYTHON ---
                if 'req_python_exec' in filename:
                    if 'code' not in task:
                         raise ValueError(f"Missing 'code' key. Received keys: {list(task.keys())}")
                    
                    result = executor.execute(task['code'])
                    response = {"id": task.get('id'), "status": "success", "output": result}
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump(response, f)
                    print("   ➡️ Code Executed")

                # --- MEMORY OPERATIONS ---
                elif 'req_store_memory' in filename:
                    if 'content' in task:
                        vec = math_core.encode([task['content']])[0].tolist()
                        collection.add(documents=[task['content']], metadatas=[{"type": task['type']}], ids=[task['id']], embeddings=[vec])
                
                elif 'req_query_memory' in filename:
                    if 'query' in task:
                        vec = math_core.encode([task['query']])[0].tolist()
                        res = collection.query(query_embeddings=[vec], n_results=3)
                        with open(os.path.join(BASE_DIR, 'res_query_memory.json'), 'w') as f:
                            json.dump({"documents": res['documents'][0], "distances": res['distances'][0]}, f)

                # --- APP LAUNCHER ---
                elif 'req_launch_app' in filename:
                    target = task.get('target')
                    token = task.get('ngrok_token')
                    if token: ngrok.set_auth_token(token)
                    
                    url = None
                    if target == 'jupyter':
                        subprocess.Popen(["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--NotebookApp.token=''", f"--notebook-dir={BASE_DIR}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(5)
                        try: url = ngrok.connect(8888).public_url
                        except: pass
                    elif target == 'n8n':
                        subprocess.Popen(["n8n", "start", "--tunnel"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(10)
                        try: url = ngrok.connect(5678).public_url
                        except: pass
                    
                    if url:
                        active_tunnels[target] = url
                        with open(os.path.join(BASE_DIR, 'res_app_url.json'), 'w') as f: json.dump({"target": target, "url": url}, f)

                # --- GIT ---
                elif 'req_git_clone' in filename:
                    url = task.get('url')
                    if url:
                        target_path = os.path.join(REPO_DIR, url.split('/')[-1].replace('.git', ''))
                        if not os.path.exists(target_path): 
                            subprocess.check_call(["git", "clone", url, target_path])
                            req_file = os.path.join(target_path, 'requirements.txt')
                            if os.path.exists(req_file):
                                print(f"   ⬇️ Installing dependencies for {target_path}...")
                                subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file, "--quiet"])
                        else: 
                            subprocess.check_call(["git", "-C", target_path, "pull"])
                        
                        if target_path not in sys.path: sys.path.append(target_path)
                        with open(os.path.join(BASE_DIR, 'res_git_clone.json'), 'w') as f: json.dump({"status": "success"}, f)

            except Exception as e:
                # Catch logic errors and report them
                print(f"   ❌ Task Failed: {e}")
                traceback.print_exc()
                # Report error to UI if possible
                if 'req_python_exec' in filename:
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump({"id": task.get('id'), "status": "error", "error": str(e)}, f)

            # Cleanup
            try: shutil.move(path, os.path.join(ARCHIVE_DIR, filename))
            except: 
                try: os.remove(path)
                except: pass

        time.sleep(1.5)

    except Exception as e:
        print(f"[FATAL LOOP ERROR] {e}")
        time.sleep(5)
`;

const genId = () => Math.random().toString(36).substring(2, 10);

export const getNotebookJSON = () => {
    return {
        "cells": [
            { 
                "id": genId(),
                "cell_type": "markdown", 
                "metadata": {},
                "source": ["# 🌌 ZIA: HOLON WORKBENCH (v7.2)\n", "Visual Intelligence Node"] 
            },
            { 
                "id": genId(),
                "cell_type": "code", 
                "execution_count": null, 
                "metadata": {},
                "outputs": [], 
                "source": PYTHON_WORKER_SCRIPT.split('\n').map(l => l + '\n') 
            }
        ],
        "metadata": { 
            "kernelspec": { "display_name": "Python 3", "language": "python", "name": "python3" },
            "language_info": { "codemirror_mode": { "name": "ipython", "version": 3 }, "file_extension": ".py", "mimetype": "text/x-python", "name": "python", "nbconvert_exporter": "python", "pygments_lexer": "ipython3", "version": "3.10.12" }
        },
        "nbformat": 4, 
        "nbformat_minor": 5
    };
};
