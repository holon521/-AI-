
import React, { useState, useEffect } from 'react';
import { driveBridge } from '../../03_NERVES/drive_bridge';
import { getNotebookJSON } from '../../03_NERVES/zia_worker_script';

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
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, clientId, setClientId, apiKey, setApiKey, isDriveConnected, 
    onSimulateConnection, onDisconnect, onGetScript, onCloudBackup, onCloudRestore, onTestBrain
}) => {
    const [manualToken, setManualToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [backupStatus, setBackupStatus] = useState<string>('');
    const [restoreStatus, setRestoreStatus] = useState<string>('');
    const [brainStatus, setBrainStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [brainMsg, setBrainMsg] = useState('');
    
    // Deployment State
    const [deployState, setDeployState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [colabLink, setColabLink] = useState<string>('');
    
    // Apps & Tools
    const [ngrokToken, setNgrokToken] = useState('');
    const [appLaunchStatus, setAppLaunchStatus] = useState<string>('');

    // Updated Scopes
    const SOVEREIGN_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/cloud-platform";
    // OAuth Playground Link with Scopes Pre-filled
    const OAUTH_PLAYGROUND_URL = `https://developers.google.com/oauthplayground/#step1&scopes=${encodeURIComponent(SOVEREIGN_SCOPES)}`;

    useEffect(() => {
        const savedNgrok = localStorage.getItem('ZIA_NGROK_TOKEN');
        if (savedNgrok) setNgrokToken(savedNgrok);
    }, []);

    const handleConnect = async () => {
        if (!manualToken.trim()) return;
        setIsConnecting(true);
        try {
            await driveBridge.setManualToken(manualToken, onSimulateConnection);
        } catch (e: any) {
            alert(`Connection Failed: ${e.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleTestBrain = async () => {
        if(!apiKey.trim()) return;
        setBrainStatus('testing');
        setBrainMsg('Pinging Gemini...');
        const res = await onTestBrain(apiKey);
        if (res === 'SUCCESS') {
            setBrainStatus('success');
            setBrainMsg('✅ VERIFIED (Ready)');
        } else {
            setBrainStatus('failed');
            setBrainMsg(`❌ FAILED: ${res}`);
        }
    };

    const handleBackup = async () => {
        setBackupStatus('Encapsulating Soul...');
        await onCloudBackup();
        setBackupStatus('Soul Encapsulated!');
        setTimeout(() => setBackupStatus(''), 3000);
    };

    const handleRestore = async () => {
        if (!confirm("⚠️ WARNING: RESURRECTION PROTOCOL\nOverwrite current mind with Cloud Backup?")) return;
        setRestoreStatus('Resurrecting...');
        const success = await onCloudRestore();
        setRestoreStatus(success ? 'Soul Restored.' : 'No Soul Found.');
        setTimeout(() => setRestoreStatus(''), 3000);
    }

    const handleDeploy = async () => {
        setDeployState('uploading');
        try {
            const notebook = getNotebookJSON();
            // Use a fixed name to enforce overwriting (cleaner drive)
            const fileName = `ZIA_COMPUTE_NODE.ipynb`;
            
            console.log("[Deploy] Searching for old kernels...");
            const existingFiles = await driveBridge.searchFiles(`name = '${fileName}' and trashed = false`);
            if (existingFiles.length > 0) {
                console.log(`[Deploy] Found ${existingFiles.length} old kernels. Deleting...`);
                for (const file of existingFiles) {
                    await driveBridge.deleteFile(file.id);
                }
            }

            console.log("[Deploy] Uploading new kernel...");
            const res = await driveBridge.saveFile(fileName, notebook);
            
            if (res && res.id) {
                setColabLink(`https://colab.research.google.com/drive/${res.id}`);
                setDeployState('success');
            } else {
                throw new Error("No file ID returned");
            }
        } catch (e: any) {
            console.error(e);
            alert(`Deployment Failed: ${e.message}`);
            setDeployState('error');
        }
    };

    const handleLaunchApp = async (target: 'jupyter' | 'n8n') => {
        if (!ngrokToken) {
            alert("Ngrok Authtoken is required for Remote Tunneling.");
            return;
        }
        localStorage.setItem('ZIA_NGROK_TOKEN', ngrokToken);
        
        setAppLaunchStatus(`Launching ${target}...`);
        try {
            await driveBridge.saveFile('req_launch_app.json', {
                target,
                ngrok_token: ngrokToken,
                timestamp: Date.now()
            });
        } catch (e: any) {
            alert(`Failed to trigger launch: ${e.message}`);
            setAppLaunchStatus('');
        }
    };

    const copyScopes = () => {
        navigator.clipboard.writeText(SOVEREIGN_SCOPES);
        alert("Scopes copied to clipboard!");
    }

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center"><span className="material-symbols-outlined mr-2">settings</span>SYSTEM CONFIG</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-500 hover:text-white">close</span></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar grow">
                    
                    {/* 1. BRAIN: Gemini API Key */}
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-cyan-400 mb-1 flex justify-between">
                            <span>BRAIN (Gemini API)</span>
                            <span className={`text-[9px] px-1.5 rounded ${brainStatus === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                {brainStatus === 'success' ? 'LINKED' : 'UNVERIFIED'}
                            </span>
                        </h4>
                        <p className="text-[10px] text-slate-500">Required for intelligence. Stored locally.</p>
                        <div className="flex space-x-2">
                            <input 
                                type="password" 
                                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono" 
                                placeholder="AIzaSy... (Gemini API Key)" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value.trim())} 
                            />
                            <button 
                                onClick={handleTestBrain}
                                className={`px-2 py-1 text-[10px] font-bold border rounded transition-colors ${brainStatus === 'testing' ? 'bg-slate-800 text-slate-400' : 'bg-cyan-900/20 border-cyan-800 text-cyan-400 hover:bg-cyan-900/40'}`}
                                disabled={brainStatus === 'testing'}
                            >
                                {brainStatus === 'testing' ? 'PING...' : 'TEST'}
                            </button>
                        </div>
                        {brainMsg && <div className={`text-[10px] ${brainStatus === 'failed' ? 'text-red-400' : 'text-green-400'}`}>{brainMsg}</div>}
                    </div>

                    {/* 2. BRIDGE: Drive Auth */}
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                        <span className="text-xs text-slate-300">Drive Bridge</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDriveConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {isDriveConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>

                    {!isDriveConnected ? (
                        <>
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-800">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-amber-500">DEVELOPER ACCESS (TOKEN)</label>
                                    <a href={OAUTH_PLAYGROUND_URL} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-400 hover:text-cyan-300 underline">
                                        Open OAuth Playground (Auto-Scope)
                                    </a>
                                </div>
                                <div className="bg-red-900/10 p-2 rounded border border-red-900/30">
                                    <p className="text-[9px] text-red-300 font-bold mb-1">⚠️ IMPORTANT:</p>
                                    <ul className="text-[9px] text-red-400 list-disc pl-3">
                                        <li>Check <strong>"Auto-refresh token"</strong> in Playground.</li>
                                        <li>Token format: <code>ya29...</code> (NOT <code>AIza...</code>)</li>
                                    </ul>
                                </div>
                                
                                <input 
                                    type="password" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono" 
                                    placeholder="ya29... (OAuth Access Token)" 
                                    value={manualToken} 
                                    onChange={(e) => setManualToken(e.target.value)} 
                                />
                                <button 
                                    onClick={handleConnect} 
                                    disabled={isConnecting}
                                    className={`w-full border px-3 py-2 rounded text-xs font-bold transition-all ${isConnecting ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-900/20 border-amber-800 text-amber-400 hover:bg-amber-900/40'}`}
                                >
                                    {isConnecting ? "CONNECTING..." : "CONNECT VIA TOKEN"}
                                </button>
                                <div className="flex justify-end">
                                     <button onClick={copyScopes} className="text-[9px] text-slate-500 hover:text-white flex items-center"><span className="material-symbols-outlined text-[10px] mr-1">content_copy</span>Copy Scopes</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Soul Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-300">SOUL MANAGEMENT</span>
                                    {backupStatus && <span className="text-[10px] text-green-400 animate-pulse">{backupStatus}</span>}
                                    {restoreStatus && <span className="text-[10px] text-orange-400 animate-pulse">{restoreStatus}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={handleBackup} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">save</span>BACKUP SOUL</button>
                                    <button onClick={handleRestore} className="bg-slate-800 hover:bg-slate-700 text-orange-400 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">restore</span>RESURRECT</button>
                                </div>
                            </div>
                            
                            {/* Compute Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <h4 className="text-xs font-bold text-purple-400 mb-2">COMPUTE SWARM (Colab)</h4>
                                
                                {deployState === 'idle' && (
                                    <button onClick={handleDeploy} className="w-full bg-purple-900/20 border border-purple-800 text-purple-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-purple-900/40 transition-colors">
                                        <span className="material-symbols-outlined text-sm mr-2">rocket_launch</span>DEPLOY KERNEL (OVERWRITE)
                                    </button>
                                )}
                                {deployState === 'uploading' && <div className="text-[10px] text-purple-400 text-center animate-pulse">Uploading Kernel...</div>}
                                
                                {deployState === 'success' && (
                                    <div className="space-y-2 animate-fade-in">
                                        <div className="text-[10px] text-green-400 text-center">✅ Deployed Successfully</div>
                                        <a href={colabLink} target="_blank" rel="noopener noreferrer" className="w-full bg-green-900/20 border border-green-800 text-green-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-green-900/40 transition-colors">
                                            <span className="material-symbols-outlined text-sm mr-2">open_in_new</span>OPEN IN COLAB
                                        </a>
                                        <button onClick={() => setDeployState('idle')} className="w-full text-[9px] text-slate-500 hover:text-slate-300">Redeploy</button>
                                    </div>
                                )}
                                
                                {deployState === 'error' && <div className="text-[10px] text-red-400 text-center">❌ Deployment Failed</div>}
                            </div>

                            {/* Apps & Tools Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <h4 className="text-xs font-bold text-orange-400 mb-2">APPS & TOOLS</h4>
                                <div className="space-y-3">
                                    <input 
                                        type="password" 
                                        placeholder="Ngrok Authtoken (Required)"
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 font-mono"
                                        value={ngrokToken}
                                        onChange={(e) => setNgrokToken(e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleLaunchApp('jupyter')} className="bg-slate-800 hover:bg-slate-700 text-orange-400 py-2 rounded text-[10px] font-bold border border-slate-700">
                                            LAUNCH JUPYTER
                                        </button>
                                        <button onClick={() => handleLaunchApp('n8n')} className="bg-slate-800 hover:bg-slate-700 text-pink-400 py-2 rounded text-[10px] font-bold border border-slate-700">
                                            LAUNCH N8N
                                        </button>
                                    </div>
                                    {appLaunchStatus && <div className="text-[10px] text-cyan-400 animate-pulse text-center">{appLaunchStatus}</div>}
                                </div>
                            </div>
                            
                            <button onClick={onDisconnect} className="w-full bg-red-900/10 border border-red-800/30 text-red-400 py-2 rounded text-xs font-bold">DISCONNECT</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
