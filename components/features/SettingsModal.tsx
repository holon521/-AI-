
import React, { useState, useEffect } from 'react';
import { driveBridge } from '../../04_NERVES/drive_bridge'; 
import { getNotebookJSON } from '../../04_NERVES/zia_worker_script'; 
import { orchestrator } from '../../02_CORTEX/memory_orchestrator';
import { LLMProvider, ReasoningMode } from '../../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    setClientId: (id: string) => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    isDriveConnected: boolean;
    onSimulateConnection: () => void;
    onDisconnect: () => void;
    onGetScript: () => void; 
    onCloudBackup: () => Promise<void>;
    onCloudRestore: () => Promise<boolean>;
    onTestBrain: (key: string) => Promise<string>;
    activeModel?: string; 
    setActiveModel?: (model: string) => void;
    llmProvider?: LLMProvider;
    setLlmProvider?: (p: LLMProvider) => void;
    baseUrl?: string;
    setBaseUrl?: (url: string) => void;
    reasoningMode?: ReasoningMode;
    setReasoningMode?: (mode: ReasoningMode) => void;
    onEnableDemoMode?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, clientId, setClientId, apiKey, setApiKey, isDriveConnected, 
    onSimulateConnection, onDisconnect, onGetScript, onCloudBackup, onCloudRestore, onTestBrain,
    activeModel = 'gemini-2.0-flash-exp', setActiveModel,
    llmProvider = 'GOOGLE', setLlmProvider, baseUrl = '', setBaseUrl,
    reasoningMode = 'FAST', setReasoningMode,
    onEnableDemoMode
}) => {
    const [manualToken, setManualToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [backupStatus, setBackupStatus] = useState<string>('');
    const [restoreStatus, setRestoreStatus] = useState<string>('');
    const [brainStatus, setBrainStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [brainMsg, setBrainMsg] = useState('');
    
    // Swarm State
    const [deployState, setDeployState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [existingSwarmStatus, setExistingSwarmStatus] = useState<{alive: boolean, lastBeat?: number, version?: string} | null>(null);
    const [colabLink, setColabLink] = useState<string>('');
    const [ngrokToken, setNgrokToken] = useState('');
    const [appLaunchStatus, setAppLaunchStatus] = useState<string>('');
    
    // Memory Inspector State
    const [memDebugData, setMemDebugData] = useState<any>(null);

    const SOVEREIGN_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/cloud-platform";
    const OAUTH_PLAYGROUND_URL = `https://developers.google.com/oauthplayground/#step1&scopes=${encodeURIComponent(SOVEREIGN_SCOPES)}`;

    useEffect(() => {
        const savedNgrok = localStorage.getItem('ZIA_NGROK_TOKEN');
        if (savedNgrok) setNgrokToken(savedNgrok);
        
        if (isOpen) {
            refreshMemoryStats();
            // If Drive is already connected, check Swarm health immediately
            if (isDriveConnected) checkSwarmHealth();
        }
    }, [isOpen, isDriveConnected]);

    // [SMART RECONNECT LOGIC]
    const checkSwarmHealth = async () => {
        try {
            const files = await driveBridge.searchFiles("name = 'swarm_status.json' and trashed=false");
            if (files.length > 0) {
                const status = await driveBridge.getFileContent(files[0].id);
                // Check modified time or internal heartbeat if available. 
                // Currently trusting the file existence + 'ONLINE' status.
                // In a real scenario, we compare file modifiedTime with Date.now().
                const lastMod = new Date(files[0].modifiedTime).getTime();
                const now = Date.now();
                const diff = (now - lastMod) / 1000; // seconds

                if (diff < 120) { // If heartbeat within last 2 mins
                    setExistingSwarmStatus({ alive: true, lastBeat: diff, version: status.version });
                    // If file exists, we can also construct the Colab link if we find the notebook
                    findExistingNotebook();
                } else {
                    setExistingSwarmStatus({ alive: false, lastBeat: diff });
                }
            } else {
                setExistingSwarmStatus({ alive: false });
            }
        } catch (e) {
            console.warn("Swarm health check failed", e);
            setExistingSwarmStatus(null);
        }
    };

    const findExistingNotebook = async () => {
         const fileName = `ZIA_COMPUTE_NODE.ipynb`;
         const files = await driveBridge.searchFiles(`name = '${fileName}' and trashed = false`);
         if (files.length > 0) {
             setColabLink(`https://colab.research.google.com/drive/${files[0].id}`);
             setDeployState('success');
         }
    };

    const refreshMemoryStats = () => {
        setMemDebugData(orchestrator.getRawDebugData());
    };

    const handleClearMemory = () => {
        if (confirm("🚨 FACTORY RESET: Wipe all memories? (Cannot be undone)")) {
            orchestrator.clearMemory();
            refreshMemoryStats();
        }
    };

    const handleConnect = async () => {
        if (!manualToken.trim()) return;
        setIsConnecting(true);
        try {
            await driveBridge.setManualToken(manualToken, () => {
                onSimulateConnection();
                // Check Swarm immediately after connection
                setTimeout(checkSwarmHealth, 1000);
            });
        } catch (e: any) {
            alert(`Connection Failed: ${e.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleTestBrain = async () => {
        setBrainStatus('testing');
        setBrainMsg('Pinging...');
        const res = await onTestBrain(apiKey);
        if (res === 'SUCCESS') {
            setBrainStatus('success');
            setBrainMsg('✅ VERIFIED');
        } else {
            setBrainStatus('failed');
            setBrainMsg(`❌ FAILED`);
        }
    };

    const handleBackup = async () => {
        setBackupStatus('Encapsulating...');
        await onCloudBackup();
        orchestrator.markAllSynced(); 
        setBackupStatus('Done!');
        setTimeout(() => setBackupStatus(''), 3000);
    };

    const handleRestore = async () => {
        if (!confirm("⚠️ WARNING: Overwrite current mind with Cloud Backup?")) return;
        setRestoreStatus('Restoring...');
        const success = await onCloudRestore();
        setRestoreStatus(success ? 'Restored.' : 'Failed.');
        setTimeout(() => setRestoreStatus(''), 3000);
    }

    const handleDeploy = async () => {
        setDeployState('uploading');
        try {
            const notebook = getNotebookJSON();
            const fileName = `ZIA_COMPUTE_NODE.ipynb`;
            const existingFiles = await driveBridge.searchFiles(`name = '${fileName}' and trashed = false`);
            // Delete old notebook to avoid clutter
            if (existingFiles.length > 0) {
                for (const file of existingFiles) await driveBridge.deleteFile(file.id);
            }
            const res = await driveBridge.saveFile(fileName, notebook);
            if (res && res.id) {
                setColabLink(`https://colab.research.google.com/drive/${res.id}`);
                setDeployState('success');
                // Force status update
                setExistingSwarmStatus(null); 
            } else {
                throw new Error("No file ID returned");
            }
        } catch (e: any) {
            alert(`Deployment Failed: ${e.message}`);
            setDeployState('error');
        }
    };

    const handleLaunchApp = async (target: 'jupyter' | 'n8n') => {
        if (!isDriveConnected) { alert("Connect Drive Bridge first."); return; }
        setAppLaunchStatus(`Launching ${target}...`);
        
        if (ngrokToken) localStorage.setItem('ZIA_NGROK_TOKEN', ngrokToken);

        const command = {
            id: Date.now().toString(),
            target: target,
            ngrok_token: ngrokToken
        };

        try {
            await driveBridge.saveFile(`req_launch_app_${command.id}.json`, command);
            setAppLaunchStatus(`Command Sent. Waiting for Swarm...`);
            setTimeout(() => setAppLaunchStatus(''), 5000);
        } catch (e: any) {
            setAppLaunchStatus('Failed.');
            alert(e.message);
        }
    };

    const handleDemoMode = () => {
        if (onEnableDemoMode) {
            onEnableDemoMode();
            onClose();
        }
    };

    const MODEL_OPTIONS = llmProvider === 'GOOGLE' 
        ? [
            { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Exp", badge: "New" },
            { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Stable" },
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", badge: "Reasoning" }
          ]
        : [
            { id: "gpt-4o", label: "GPT-4o (Omni)", badge: "OpenAI" },
            { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet", badge: "Anthropic" },
            { id: "llama3.2", label: "Llama 3.2 (Local)", badge: "Ollama" }
          ];

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center"><span className="material-symbols-outlined mr-2">settings</span>SYSTEM CONFIG</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-500 hover:text-white">close</span></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar grow">
                    
                    {/* 0. COMPETITION MODE BANNER */}
                    <div className="p-3 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded border border-cyan-500/30 flex items-center justify-between">
                         <div>
                             <h4 className="text-xs font-bold text-cyan-300">GEMINI COMPETITION MODE</h4>
                             <p className="text-[9px] text-cyan-500/70">Enable simulated environment for judges.</p>
                         </div>
                         <button onClick={handleDemoMode} className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded shadow hover:bg-cyan-400 transition-colors">
                             ENTER DEMO
                         </button>
                    </div>

                    {/* 1. NEURAL CORE */}
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-cyan-400">NEURAL CORE BRIDGE</h4>
                            <span className={`text-[9px] px-1.5 rounded ${brainStatus === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                {brainStatus === 'success' ? 'LINKED' : 'UNVERIFIED'}
                            </span>
                        </div>
                        
                        <div className="flex space-x-1 bg-slate-900 p-1 rounded border border-slate-800">
                             <button onClick={() => setLlmProvider && setLlmProvider('GOOGLE')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${llmProvider === 'GOOGLE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>GOOGLE</button>
                             <button onClick={() => setLlmProvider && setLlmProvider('OPENAI')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${llmProvider === 'OPENAI' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>CUSTOM / LOCAL</button>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[9px] text-slate-500 font-bold mb-1">REASONING STRATEGY</label>
                            <div className="grid grid-cols-3 gap-1">
                                <button onClick={() => setReasoningMode && setReasoningMode('AUTO')} className={`col-span-3 text-[9px] py-1 border rounded font-bold mb-1 ${reasoningMode === 'AUTO' ? 'bg-amber-900/50 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>AUTO (Dynamic)</button>
                                <button onClick={() => setReasoningMode && setReasoningMode('FAST')} className={`text-[9px] py-1 border rounded ${reasoningMode === 'FAST' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>FAST</button>
                                <button onClick={() => setReasoningMode && setReasoningMode('PRECISE')} className={`text-[9px] py-1 border rounded ${reasoningMode === 'PRECISE' ? 'bg-purple-900/50 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>PRECISE</button>
                                <button onClick={() => setReasoningMode && setReasoningMode('DEBATE')} className={`text-[9px] py-1 border rounded ${reasoningMode === 'DEBATE' ? 'bg-rose-900/50 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>DEBATE</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {llmProvider === 'OPENAI' && (
                                <div className="flex flex-col">
                                    <label className="text-[9px] text-slate-500 font-bold mb-1">BASE URL</label>
                                    <input type="text" className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono" placeholder="http://localhost:11434/v1" value={baseUrl} onChange={(e) => setBaseUrl && setBaseUrl(e.target.value)} />
                                </div>
                            )}
                            
                            <div className="flex space-x-2">
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[9px] text-slate-500 font-bold mb-1">API KEY</label>
                                    <input type="password" className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono" placeholder={llmProvider === 'GOOGLE' ? "AIza..." : "sk-..."} value={apiKey} onChange={(e) => setApiKey(e.target.value.trim())} />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <button onClick={handleTestBrain} className="px-3 py-1 text-[10px] font-bold border rounded bg-slate-800 text-slate-400 hover:bg-slate-700 h-[26px]">PING</button>
                                </div>
                            </div>

                            {setActiveModel && (
                                <div className="flex flex-col">
                                    <label className="text-[9px] text-slate-500 font-bold mb-1">CORE MODEL</label>
                                    <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-2 text-xs text-slate-200 font-mono appearance-none focus:ring-1 focus:ring-cyan-500">
                                        <option value="" disabled>Select a model...</option>
                                        {MODEL_OPTIONS.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}
                                        <option value="custom">Custom ID...</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. MEMORY INSPECTOR (LocalStorage) */}
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-emerald-400">MEMORY INSPECTOR (LocalStorage)</h4>
                            <button onClick={refreshMemoryStats} className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white">REFRESH</button>
                        </div>
                        {memDebugData && (
                            <div className="text-[9px] space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <div className="text-slate-500">STORAGE USED</div>
                                        <div className="text-lg font-mono text-slate-200">{memDebugData.sizeKB} KB</div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <div className="text-slate-500">ENGRAM COUNT</div>
                                        <div className="text-lg font-mono text-slate-200">{memDebugData.nodeCount}</div>
                                    </div>
                                </div>
                                <button onClick={handleClearMemory} className="w-full bg-red-900/10 border border-red-800/30 text-red-500 py-1.5 rounded hover:bg-red-900/30">
                                    WIPE ALL MEMORY
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3. BRIDGE: Drive Auth */}
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                        <span className="text-xs text-slate-300">Drive Bridge</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDriveConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {isDriveConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>

                    {!isDriveConnected ? (
                        <div className="space-y-3 pt-2 pb-4 border-b border-slate-800">
                             <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-amber-500">DEVELOPER ACCESS</label>
                                    <a href={OAUTH_PLAYGROUND_URL} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-400 hover:text-cyan-300 underline">Get OAuth Token</a>
                                </div>
                                <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono" placeholder="ya29..." value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
                                <button onClick={handleConnect} disabled={isConnecting} className="w-full border px-3 py-2 rounded text-xs font-bold bg-amber-900/20 border-amber-800 text-amber-400 hover:bg-amber-900/40">
                                    {isConnecting ? "CONNECTING..." : "CONNECT & SYNC"}
                                </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 grid grid-cols-2 gap-2">
                                <button onClick={handleBackup} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">save</span>BACKUP SOUL</button>
                                <button onClick={handleRestore} className="bg-slate-800 hover:bg-slate-700 text-orange-400 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">restore</span>RESURRECT</button>
                            </div>
                            
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-purple-400">COMPUTE SWARM (Colab)</h4>
                                    {existingSwarmStatus?.alive && (
                                        <span className="text-[9px] text-green-400 font-bold bg-green-900/20 px-1.5 py-0.5 rounded animate-pulse">
                                            ACTIVE ({Math.floor(existingSwarmStatus.lastBeat || 0)}s ago)
                                        </span>
                                    )}
                                </div>
                                
                                {existingSwarmStatus?.alive ? (
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400 border border-green-900/30 bg-green-900/10 p-2 rounded">
                                            ✅ <b>Swarm is already running!</b><br/>
                                            No need to redeploy. You are ready to compute.
                                        </div>
                                        <div className="flex space-x-2">
                                             <button onClick={handleDeploy} className="flex-1 bg-slate-800 border border-slate-700 text-slate-500 py-2 rounded text-[9px] hover:text-white">
                                                FORCE REDEPLOY
                                            </button>
                                            {colabLink && <a href={colabLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-900/20 border border-green-800 text-green-400 py-2 rounded text-[9px] font-bold flex items-center justify-center hover:bg-green-900/40">OPEN NOTEBOOK</a>}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {deployState === 'idle' && (
                                            <>
                                                <div className="text-[9px] text-slate-500 mb-2">No active swarm detected. Deploy a new kernel.</div>
                                                <button onClick={handleDeploy} className="w-full bg-purple-900/20 border border-purple-800 text-purple-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-purple-900/40">DEPLOY KERNEL</button>
                                            </>
                                        )}
                                        {deployState === 'success' && <a href={colabLink} target="_blank" rel="noopener noreferrer" className="w-full bg-green-900/20 border border-green-800 text-green-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-green-900/40">OPEN IN COLAB</a>}
                                    </>
                                )}
                            </div>

                            {/* APPS & TOOLS */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                                <h4 className="text-xs font-bold text-orange-400">APPS & TOOLS</h4>
                                <div className="flex flex-col space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] text-slate-500 font-bold">NGROK AUTH TOKEN (Optional)</label>
                                        <span className="text-[8px] text-slate-600">Free Tier: Must click 'Visit Site' button</span>
                                    </div>
                                    <input 
                                        type="password" 
                                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono" 
                                        placeholder="2K..." 
                                        value={ngrokToken} 
                                        onChange={(e) => setNgrokToken(e.target.value)} 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button onClick={() => handleLaunchApp('jupyter')} className="bg-orange-900/20 border border-orange-800 text-orange-400 py-2 rounded text-xs font-bold hover:bg-orange-900/40">LAUNCH JUPYTER</button>
                                    <button onClick={() => handleLaunchApp('n8n')} className="bg-rose-900/20 border border-rose-800 text-rose-400 py-2 rounded text-xs font-bold hover:bg-rose-900/40">LAUNCH N8N</button>
                                </div>
                                {appLaunchStatus && <div className="text-[9px] text-cyan-400 text-center animate-pulse">{appLaunchStatus}</div>}
                            </div>

                            <button onClick={onDisconnect} className="w-full bg-red-900/10 border border-red-800/30 text-red-400 py-2 rounded text-xs font-bold">DISCONNECT</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
