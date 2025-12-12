
// ZIA COLAB WORKER SCRIPT v7.8 (AGENTIC BRIDGE)
// [LOCATION]: 03_NERVES/zia_worker_script.ts
// [v7.8] Added N8N Proxy Bridge (ZIA can now trigger n8n workflows).

export const PYTHON_WORKER_SCRIPT = `
import os, json, time, sys, subprocess, shutil, io, base64, contextlib, traceback
import urllib.request, urllib.error # For n8n bridge
from google.colab import drive

print("[ZIA] 🟢 Initializing Holon Compute Node v7.8 (Agentic Bridge)...")
if not os.path.exists('/content/drive'): drive.mount('/content/drive')

BASE_DIR = '/content/drive/MyDrive/_ZIA_HOLON_WORLD'
for d in ['chroma_vector_store', 'pip_cache', 'repositories', 'archive']:
    path = os.path.join(BASE_DIR, d)
    if not os.path.exists(path): os.makedirs(path)
MEMORY_DIR = os.path.join(BASE_DIR, 'chroma_vector_store')
PIP_CACHE_DIR = os.path.join(BASE_DIR, 'pip_cache')
REPO_DIR = os.path.join(BASE_DIR, 'repositories')

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet", "--find-links", PIP_CACHE_DIR])

for pkg in ['chromadb', 'sentence-transformers', 'scikit-learn', 'matplotlib', 'pandas', 'pyngrok', 'jupyterlab', 'requests']:
    try: __import__(pkg.replace('-', '_'))
    except: install(pkg)

import chromadb
from sentence_transformers import SentenceTransformer
from pyngrok import ngrok, conf
import matplotlib.pyplot as plt
import requests # For n8n bridge

class PythonExecutor:
    def execute(self, code):
        stdout, stderr = io.StringIO(), io.StringIO()
        img, html = None, None
        plt.clf(); plt.close('all')
        try:
            with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                exec(code, globals())
            if plt.get_fignums():
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
                buf.seek(0)
                img = base64.b64encode(buf.read()).decode('utf-8')
        except Exception: traceback.print_exc(file=stderr)
        return { "stdout": stdout.getvalue(), "stderr": stderr.getvalue(), "image": img, "html": html }

executor = PythonExecutor()
print("[ZIA] Loading Multilingual Embedding Model...")
math_core = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
chroma_client = chromadb.PersistentClient(path=MEMORY_DIR)
collection = chroma_client.get_or_create_collection(name="zia_memory")

print(f"🚀 SWARM READY. Monitoring: {BASE_DIR}")

# Active Process Holders
active_procs = {} 

last_heartbeat = 0
while True:
    try:
        # Heartbeat
        if time.time() - last_heartbeat > 5:
            with open(os.path.join(BASE_DIR, 'swarm_status.json'), 'w') as f:
                json.dump({
                    "status": "ONLINE", 
                    "version": "v7.8", 
                    "memory_count": collection.count(),
                    "active_services": list(active_procs.keys())
                }, f)
            last_heartbeat = time.time()

        files = [f for f in os.listdir(BASE_DIR) if f.startswith('req_') and f.endswith('.json')]
        if not files:
            time.sleep(2)
            continue
            
        for filename in files:
            path = os.path.join(BASE_DIR, filename)
            try:
                print(f"[Task] Processing {filename}...")
                with open(path, 'r') as f: task = json.load(f)
                
                # --- 1. PYTHON AGENT (Jupyter Core) ---
                if 'req_python_exec' in filename:
                    if 'code' not in task: raise ValueError("Missing 'code'")
                    res = executor.execute(task['code'])
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump({"id": task.get('id'), "status": "success", "output": res}, f)
                
                # --- 2. MEMORY AGENT ---
                elif 'req_store_memory' in filename:
                    if 'embedding' in task and task['embedding']: vec = task['embedding']
                    else: vec = math_core.encode([task['content']])[0].tolist()
                    collection.add(documents=[task['content']], metadatas=[{"type": task['type']}], ids=[task['id']], embeddings=[vec])
                
                # --- 3. INFRA AGENT (Launchers) ---
                elif 'req_launch_app' in filename:
                    target = task.get('target')
                    token = task.get('ngrok_token')
                    
                    if target in active_procs:
                        print(f"   🔄 Restarting {target}...")
                        active_procs[target].terminate()
                    
                    if token: 
                        ngrok.set_auth_token(token)
                        conf.get_default().region = "us"
                    
                    url = None
                    if target == 'jupyter':
                        proc = subprocess.Popen(
                            ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--NotebookApp.token=''", "--NotebookApp.allow_origin='*'"], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                        )
                        active_procs['jupyter'] = proc
                        time.sleep(5)
                        try: url = ngrok.connect(8888).public_url
                        except Exception as e: print(f"Ngrok Error: {e}")
                        
                    elif target == 'n8n':
                        if shutil.which('n8n') is None:
                            print("   📦 Installing n8n...")
                            subprocess.check_call(["npm", "install", "-g", "n8n"])
                        
                        env = os.environ.copy()
                        env["N8N_PORT"] = "5678"
                        env["N8N_HOST"] = "0.0.0.0"
                        # Allow webhook triggering from localhost
                        env["N8N_SKIP_WEBHOOK_DEREGISTRATION_ON_SHUTDOWN"] = "true"
                        
                        proc = subprocess.Popen(["n8n", "start"], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        active_procs['n8n'] = proc
                        time.sleep(15)
                        try: url = ngrok.connect(5678).public_url
                        except Exception as e: print(f"Ngrok Error: {e}")
                    
                    if url:
                        with open(os.path.join(BASE_DIR, 'res_app_url.json'), 'w') as f: json.dump({"target": target, "url": url}, f)

                # --- 4. N8N AGENT BRIDGE (New) ---
                # ZIA can now send HTTP requests to n8n running on localhost
                elif 'req_n8n_proxy' in filename:
                    endpoint = task.get('endpoint', '') # e.g., 'webhook/test'
                    method = task.get('method', 'POST')
                    data = task.get('data', {})
                    
                    target_url = f"http://localhost:5678/{endpoint.lstrip('/')}"
                    print(f"   ⚡ Triggering n8n: {target_url}")
                    
                    try:
                        if method == 'GET':
                            resp = requests.get(target_url, params=data)
                        else:
                            resp = requests.post(target_url, json=data)
                            
                        with open(os.path.join(BASE_DIR, 'res_n8n_proxy.json'), 'w') as f:
                            json.dump({
                                "id": task.get('id'), 
                                "status": "success", 
                                "n8n_status": resp.status_code,
                                "response": resp.text
                            }, f)
                    except Exception as e:
                        with open(os.path.join(BASE_DIR, 'res_n8n_proxy.json'), 'w') as f:
                            json.dump({"id": task.get('id'), "status": "error", "error": str(e)}, f)

            except Exception as e:
                print(f"❌ Error: {e}")
                traceback.print_exc()
                if 'req_python_exec' in filename:
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump({"id": task.get('id'), "status": "error", "error": str(e)}, f)
            
            try: shutil.move(path, os.path.join(BASE_DIR, 'archive', filename))
            except: os.remove(path)

    except Exception as e:
        print(f"FATAL: {e}"); time.sleep(5)
`;

const genId = () => Math.random().toString(36).substring(2, 10);

export const getNotebookJSON = () => {
    return {
        "cells": [
            { 
                "id": genId(), 
                "cell_type": "markdown", 
                "metadata": {},
                "source": ["# 🌌 ZIA: HOLON WORKBENCH (v7.8)\n", "Visual Intelligence Node (Agentic Bridge)"] 
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
            "language_info": { "name": "python", "version": "3.10" }
        },
        "nbformat": 4, 
        "nbformat_minor": 5
    };
};
