
// ZIA COLAB WORKER SCRIPT v7.4 (MULTILINGUAL UPGRADE)
// [LOCATION]: 03_NERVES/zia_worker_script.ts

export const PYTHON_WORKER_SCRIPT = `
import os, json, time, sys, subprocess, shutil, io, base64, contextlib, traceback
from google.colab import drive

print("[ZIA] 🟢 Initializing Holon Compute Node v7.4 (Korean Enhanced)...")
if not os.path.exists('/content/drive'): drive.mount('/content/drive')

BASE_DIR = '/content/drive/MyDrive/_ZIA_HOLON_WORLD'
dirs = ['chroma_vector_store', 'pip_cache', 'repositories', 'archive']
for d in dirs:
    path = os.path.join(BASE_DIR, d)
    if not os.path.exists(path): os.makedirs(path)
MEMORY_DIR = os.path.join(BASE_DIR, 'chroma_vector_store')
PIP_CACHE_DIR = os.path.join(BASE_DIR, 'pip_cache')
REPO_DIR = os.path.join(BASE_DIR, 'repositories')

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet", "--find-links", PIP_CACHE_DIR])

for pkg in ['chromadb', 'sentence-transformers', 'scikit-learn', 'matplotlib', 'pandas', 'pyngrok', 'jupyterlab']:
    try: __import__(pkg.replace('-', '_'))
    except: install(pkg)

import chromadb
from sentence_transformers import SentenceTransformer
from pyngrok import ngrok
import matplotlib.pyplot as plt

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

# [MODEL UPGRADE]
# Old: 'all-MiniLM-L6-v2' (English focused, poor for Korean)
# New: 'paraphrase-multilingual-MiniLM-L12-v2' (Supports 50+ languages including Korean)
print("[ZIA] Loading Multilingual Embedding Model...")
math_core = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

chroma_client = chromadb.PersistentClient(path=MEMORY_DIR)
collection = chroma_client.get_or_create_collection(name="zia_memory")

print(f"🚀 SWARM READY. Monitoring: {BASE_DIR}")
active_tunnels = {}

while True:
    try:
        with open(os.path.join(BASE_DIR, 'swarm_status.json'), 'w') as f:
            json.dump({"status": "ONLINE", "version": "v7.4", "memory_count": collection.count()}, f)

        files = [f for f in os.listdir(BASE_DIR) if f.startswith('req_') and f.endswith('.json')]
        for filename in files:
            path = os.path.join(BASE_DIR, filename)
            try:
                with open(path, 'r') as f: task = json.load(f)
                
                if 'req_python_exec' in filename:
                    if 'code' not in task: raise ValueError("Missing 'code'")
                    res = executor.execute(task['code'])
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump({"id": task.get('id'), "status": "success", "output": res}, f)
                
                elif 'req_store_memory' in filename:
                    # If Client sent a high-quality vector (embedding-004), use it.
                    # Otherwise, fallback to local multilingual model.
                    if 'embedding' in task and task['embedding']:
                        vec = task['embedding']
                    else:
                        vec = math_core.encode([task['content']])[0].tolist()
                        
                    collection.add(documents=[task['content']], metadatas=[{"type": task['type']}], ids=[task['id']], embeddings=[vec])
                
                elif 'req_git_clone' in filename:
                    url = task.get('url')
                    if url:
                        target = os.path.join(REPO_DIR, url.split('/')[-1].replace('.git',''))
                        if not os.path.exists(target): subprocess.check_call(["git", "clone", url, target])
                        with open(os.path.join(BASE_DIR, 'res_git_clone.json'), 'w') as f: json.dump({"status": "success"}, f)
                
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
                        with open(os.path.join(BASE_DIR, 'res_app_url.json'), 'w') as f: json.dump({"target": target, "url": url}, f)

            except Exception as e:
                if 'req_python_exec' in filename:
                    with open(os.path.join(BASE_DIR, 'res_python_exec.json'), 'w') as f:
                        json.dump({"id": task.get('id'), "status": "error", "error": str(e)}, f)
            
            try: shutil.move(path, os.path.join(BASE_DIR, 'archive', filename))
            except: os.remove(path)

        time.sleep(1.5)
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
                "source": ["# 🌌 ZIA: HOLON WORKBENCH (v7.4)\n", "Visual Intelligence Node (Korean Enhanced)"] 
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
