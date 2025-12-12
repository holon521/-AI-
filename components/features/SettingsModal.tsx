
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
    activeModel?: string; // New
    setActiveModel?: (model: string) => void; // New
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, clientId, setClientId, apiKey, setApiKey, isDriveConnected, 
    onSimulateConnection, onDisconnect, onGetScript, onCloudBackup, onCloudRestore, onTestBrain,
    activeModel = 'gemini-2.5-flash', setActiveModel
}) => {
    const [manualToken, setManualToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [backupStatus, setBackupStatus] = useState<string>('');
    const [restoreStatus, setRestoreStatus] = useState<string>('');
    const [brainStatus, setBrainStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [brainMsg, setBrainMsg] = useState('');
    
    const [deployState, setDeployState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [colabLink, setColabLink] = useState<string>('');
    
    const [ngrokToken, setNgrokToken] = useState('');
    const [appLaunchStatus, setAppLaunchStatus] = useState<string>('');
    const [showNgrokHelp, setShowNgrokHelp] = useState(false);

    const SOVEREIGN_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/cloud-platform";
    const OAUTH_PLAYGROUND_URL = `https://developers.google.com/oauthplayground/#step1&scopes=${encodeURIComponent(SOVEREIGN_SCOPES)}`;
    const NGROK_DASHBOARD_URL = "https://dashboard.ngrok.com/get-started/your-authtoken";

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
            setBrainMsg('✅ VERIFIED');
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
            const fileName = `ZIA_COMPUTE_NODE.ipynb`;
            
            const existingFiles = await driveBridge.searchFiles(`name = '${fileName}' and trashed = false`);
            if (existingFiles.length > 0) {
                for (const file of existingFiles) await driveBridge.deleteFile(file.id);
            }

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
            alert("Ngrok Authtoken is required. See the '?' help icon.");
            return;
        }
        localStorage.setItem('ZIA_NGROK_TOKEN', ngrokToken);
        setAppLaunchStatus(`Launching ${target}...`);
        try {
            await driveBridge.saveFile('req_launch_app.json', { target, ngrok_token: ngrokToken, timestamp: Date.now() });
        } catch (e: any) {
            alert(`Failed: ${e.message}`);
            setAppLaunchStatus('');
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center"><span className="material-symbols-outlined mr-2">settings</span>SYSTEM CONFIG</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-500 hover:text-white">close</span></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar grow">
                    
                    {/* 1. BRAIN CONFIGURATION (KERNEL) */}
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-cyan-400">KERNEL CONFIGURATION</h4>
                            <span className={`text-[9px] px-1.5 rounded ${brainStatus === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                {brainStatus === 'success' ? 'LINKED' : 'UNVERIFIED'}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <input type="password" className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono" placeholder="Gemini API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value.trim())} />
                            <button onClick={handleTestBrain} className="px-2 py-1 text-[10px] font-bold border rounded bg-slate-800 text-slate-400 hover:bg-slate-700">TEST</button>
                        </div>
                        {setActiveModel && (
                            <div className="flex flex-col space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">MODEL SELECTION</label>
                                <select 
                                    value={activeModel} 
                                    onChange={(e) => setActiveModel(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast/Default)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Reasoning)</option>
                                    <option value="gemini-exp-1206">Gemini Experimental (Latest)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 2. SYSTEM MODULES (APP STORE VISUALIZATION) */}
                    <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 mb-2">SYSTEM MODULES</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <div className="flex items-center space-x-2 p-2 bg-slate-900 rounded border border-slate-800 opacity-100">
                                <span className="material-symbols-outlined text-green-400 text-sm">folder_open</span>
                                <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-300">File System</span><span className="text-[8px] text-slate-500">v2.0 Active</span></div>
                             </div>
                             <div className="flex items-center space-x-2 p-2 bg-slate-900 rounded border border-slate-800 opacity-100">
                                <span className="material-symbols-outlined text-purple-400 text-sm">memory</span>
                                <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-300">Memory Core</span><span className="text-[8px] text-slate-500">Vector + FDE</span></div>
                             </div>
                        </div>
                    </div>

                    {/* 3. BRIDGE: Drive Auth */}
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
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
                                <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono" placeholder="ya29... (Paste Token Here)" value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
                                <button onClick={handleConnect} disabled={isConnecting} className="w-full border px-3 py-2 rounded text-xs font-bold bg-amber-900/20 border-amber-800 text-amber-400 hover:bg-amber-900/40">
                                    {isConnecting ? "CONNECTING..." : "CONNECT"}
                                </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Soul Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 grid grid-cols-2 gap-2">
                                <button onClick={handleBackup} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">save</span>BACKUP SOUL</button>
                                <button onClick={handleRestore} className="bg-slate-800 hover:bg-slate-700 text-orange-400 py-3 rounded text-[10px] font-bold border border-slate-700 flex flex-col items-center"><span className="material-symbols-outlined mb-1">restore</span>RESURRECT</button>
                            </div>
                            
                            {/* Compute Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <h4 className="text-xs font-bold text-purple-400 mb-2">COMPUTE SWARM (Colab)</h4>
                                {deployState === 'idle' && <button onClick={handleDeploy} className="w-full bg-purple-900/20 border border-purple-800 text-purple-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-purple-900/40">DEPLOY KERNEL</button>}
                                {deployState === 'success' && <a href={colabLink} target="_blank" rel="noopener noreferrer" className="w-full bg-green-900/20 border border-green-800 text-green-400 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-green-900/40">OPEN IN COLAB</a>}
                            </div>

                            {/* Apps Section */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-orange-400">APPS & TOOLS</h4>
                                    <button onClick={() => setShowNgrokHelp(!showNgrokHelp)}><span className="material-symbols-outlined text-xs text-slate-500">help</span></button>
                                </div>
                                {showNgrokHelp && <div className="mb-3 p-2 bg-slate-900 rounded border border-slate-700 text-[9px] text-slate-300">Requires Ngrok Token for Tunneling.</div>}
                                <input type="password" placeholder="Ngrok Authtoken" className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 font-mono mb-2" value={ngrokToken} onChange={(e) => setNgrokToken(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleLaunchApp('jupyter')} className="bg-slate-800 hover:bg-slate-700 text-orange-400 py-2 rounded text-[10px] font-bold border border-slate-700">LAUNCH JUPYTER</button>
                                    <button onClick={() => handleLaunchApp('n8n')} className="bg-slate-800 hover:bg-slate-700 text-pink-400 py-2 rounded text-[10px] font-bold border border-slate-700">LAUNCH N8N</button>
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
