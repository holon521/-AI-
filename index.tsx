
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { system_instruction_augmentation, RECEPTIONIST_SYSTEM_PROMPT } from './knowledge_archive';
import { orchestrator, MemoryType } from './memory_orchestrator';
import { swarm, ComputeNode } from './compute_swarm';
import { GENESIS_CONSTITUTION, SkepticismProtocol } from './GENESIS_AXIOM'; 
import { computeSimHashSignature, calculateLogicDensity, computeSimilarity } from './fde_logic';
import { SPECS, SpecKey } from './spec_loader';
import { driveBridge } from './services/drive_bridge'; 
import { PYTHON_WORKER_SCRIPT } from './templates/zia_worker_script'; 

// --- TYPE DEFINITIONS ---
interface Message {
  id: string;
  role: 'user' | 'model' | 'system' | 'refiner'; 
  text: string;
  timestamp: Date;
  metadata?: {
    modelUsed?: string; 
    activeMemorySectors?: MemoryType[]; 
    truthState?: string; 
    fdeSignature?: string;
    doubtLevel?: number;
    refinementStatus?: 'RAW' | 'REFINED' | 'CLARIFICATION_NEEDED';
    cognitiveCard?: {
        intent: 'TASK' | 'EMOTIONAL' | 'QUERY' | 'PHILOSOPHICAL';
        original: string;
        data: any;
    };
    groundingMetadata?: any;
    harvested?: boolean;
  };
}

interface GraphNode {
  id: string;
  label: string;
  status: 'idle' | 'active' | 'completed' | 'warning'; 
}

interface UserEnvironment {
  os: string;
  language: string; 
  isLegacyPathRisk: boolean; 
}

interface SystemDNA {
  layoutMode: 'STANDARD' | 'CODER' | 'WRITER' | 'MINIMAL';
  themeColor: 'cyan' | 'emerald' | 'rose' | 'violet';
  aiPersona: 'ANALYTICAL' | 'EMPATHETIC' | 'CREATIVE';
  generation: number;
}

const getApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY || '';
    }
  } catch (e) { return ''; }
  return '';
};
const API_KEY = getApiKey();
const ai = new GoogleGenAI({ apiKey: API_KEY || 'DUMMY' });

const detectSystemEnv = (): UserEnvironment => {
  try {
    const userAgent = navigator.userAgent;
    let os = 'Unknown';
    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    else if (userAgent.indexOf("Mac") !== -1) os = "Mac";
    else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    
    return {
      os,
      language: navigator.language || 'en-US',
      isLegacyPathRisk: os === 'Windows' && navigator.language.startsWith('ko')
    };
  } catch (e) { return { os: 'Unknown', language: 'en-US', isLegacyPathRisk: false }; }
};

// --- COMPONENTS ---

const RemoteDesktop = ({ url, onClose }: { url: string, onClose: () => void }) => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-orange-500 animate-pulse text-sm">terminal</span>
                    <span className="text-xs font-bold text-orange-400">REMOTE DESKTOP: JUPYTER LAB</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 rounded">{url}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-[9px] text-slate-500">Full Access (Root)</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-white flex items-center bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-sm mr-1">close</span> CLOSE SESSION
                    </button>
                </div>
            </div>
            <div className="flex-1 relative bg-[#111]">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs">Establishing Tunnel...</p>
                    </div>
                )}
                <iframe 
                    src={url} 
                    className="w-full h-full border-none" 
                    allow="clipboard-read; clipboard-write"
                    onLoad={() => setLoading(false)}
                />
                {/* Warning overlay for Ngrok free tier page */}
                <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-orange-500/30 p-3 rounded max-w-xs text-[10px] text-slate-400">
                    <strong className="text-orange-400 block mb-1">Seeing a warning page?</strong>
                    Ngrok might ask you to click "Visit Site". If the screen is blank or shows a warning, please interact with the iframe.
                </div>
            </div>
        </div>
    );
};

const BlueprintViewer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<SpecKey>('01_VISION.md');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-purple-400">architecture</span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-200">ZIA SPECKIT VIEWER</h2>
                            <p className="text-[10px] text-slate-500">System Specification v2.0 (Evolution Ready)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                    {(Object.keys(SPECS) as SpecKey[]).map((key) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-3 text-xs font-mono border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{key}</button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar bg-[#0d1117]">
                    <pre className="whitespace-pre-wrap font-sans">{SPECS[activeTab]}</pre>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, clientId, setClientId, isDriveConnected, onSimulateConnection, onDisconnect, onGetScript }: any) => {
    const [manualToken, setManualToken] = useState('');

    const handleManualConnect = () => {
        if (manualToken.trim()) {
            driveBridge.setManualToken(manualToken.trim(), () => {
                onSimulateConnection(); 
            });
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center"><span className="material-symbols-outlined mr-2">settings</span>SYSTEM CONFIG</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-500 hover:text-white">close</span></button>
                </div>
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                        <span className="text-xs text-slate-300">Bridge Status</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDriveConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {isDriveConnected ? 'CONNECTED' : 'OFFLINE'}
                        </span>
                    </div>

                    {!isDriveConnected ? (
                        <>
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-amber-500 uppercase flex items-center">
                                        <span className="material-symbols-outlined text-sm mr-1">key</span>
                                        Developer Bypass (Recommended)
                                    </label>
                                    <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-[10px] text-cyan-500 hover:underline">Get Token Here ↗</a>
                                </div>
                                <p className="text-[10px] text-slate-400">Paste 'Access Token' from Google OAuth Playground to bypass Client ID issues.</p>
                                <div className="flex space-x-2">
                                    <input 
                                        type="password" 
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:border-amber-500 outline-none font-mono"
                                        placeholder="ya29.a0..."
                                        value={manualToken}
                                        onChange={(e) => setManualToken(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleManualConnect}
                                        className="bg-amber-900/20 border border-amber-800 text-amber-400 hover:bg-amber-900/40 px-3 rounded text-xs font-bold"
                                    >
                                        CONNECT WITH TOKEN
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 opacity-50 hover:opacity-100 transition-opacity">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Standard OAuth (Client ID)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 outline-none font-mono"
                                    placeholder="...apps.googleusercontent.com"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                />
                                <button 
                                    onClick={() => driveBridge.login()}
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 py-2 rounded text-xs font-bold"
                                >
                                    LOGIN WITH CLIENT ID
                                </button>
                            </div>

                            <div className="text-center text-[9px] text-slate-600 font-mono py-2">- OR -</div>
                            
                            <button 
                                onClick={onSimulateConnection}
                                className="w-full bg-purple-900/10 border border-purple-800/30 text-purple-400 hover:bg-purple-900/20 py-2 rounded text-xs font-bold flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm mr-2">science</span>SIMULATION MODE
                            </button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 bg-green-900/10 border border-green-800/30 rounded text-center space-y-2">
                                <div>
                                    <div className="text-green-500 text-xs font-bold mb-1">BRIDGE ACTIVE</div>
                                    <div className="text-[10px] text-green-400/70">ZIA is synced with Cloud Storage.</div>
                                </div>
                                <button 
                                    onClick={onGetScript}
                                    className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-[10px] flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm mr-1">terminal</span> GET COLAB WORKER SCRIPT
                                </button>
                            </div>
                            <button 
                                onClick={onDisconnect}
                                className="w-full bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/40 py-2 rounded text-xs font-bold flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined text-sm mr-2">link_off</span>DISCONNECT BRIDGE
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KnowledgeInjectionModal = ({ isOpen, onClose, onInject }: { isOpen: boolean, onClose: () => void, onInject: (content: string) => void }) => {
    const [content, setContent] = useState('');
    
    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center"><span className="material-symbols-outlined mr-2">input</span>KNOWLEDGE INJECTION</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-500 hover:text-white">close</span></button>
                </div>
                <div className="p-4">
                    <p className="text-xs text-slate-400 mb-2">Inject raw text, code, or axioms directly into ZIA's FDE Memory Core.</p>
                    <textarea 
                        className="w-full h-40 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none resize-none"
                        placeholder="Paste knowledge here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={() => { onInject(content); setContent(''); onClose(); }}
                            disabled={!content.trim()}
                            className="bg-cyan-900/30 border border-cyan-800 text-cyan-400 hover:bg-cyan-900/50 px-4 py-2 rounded text-xs font-bold flex items-center disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm mr-2">memory</span>INJECT & HASH
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArtifactsCanvas = ({ content, isOpen, onClose, dna, isExpanded, toggleExpand, isDriveConnected }: { content: string | null, isOpen: boolean, onClose: () => void, dna: SystemDNA, isExpanded: boolean, toggleExpand: () => void, isDriveConnected: boolean }) => {
    if (!isOpen) return null;
    const widthClass = isExpanded ? 'w-full absolute inset-0 z-50' : (dna.layoutMode === 'CODER' || dna.layoutMode === 'WRITER' ? 'w-2/3' : 'w-1/2');
    
    const runOnColab = () => {
        if (!content) return;
        if (!isDriveConnected) {
            alert("Connect Google Drive (Bridge) first to run code on Colab.");
            return;
        }
        // Send execution command to Drive
        const cmdId = Date.now().toString();
        driveBridge.saveFile(`cmd_exec_${cmdId}.json`, {
            id: cmdId,
            action: 'execute_python',
            payload: content
        }).then(() => {
            alert("🚀 Execution Command Sent to Drive! Check your Colab worker.");
        }).catch(e => alert("Failed to send command: " + e));
    };

    return (
        <div className={`${widthClass} h-full bg-slate-900 border-l border-slate-800 flex flex-col animate-slide-in-right z-20 shadow-2xl transition-all duration-300`}>
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950">
                 <div className="flex items-center space-x-2"><span className="material-symbols-outlined text-cyan-400 text-sm">code_blocks</span><span className="text-xs font-bold text-slate-300">Artifact Canvas ({dna.layoutMode})</span></div>
                 <div className="flex items-center space-x-2">
                    {content && (
                        <button 
                            onClick={runOnColab} 
                            className="mr-2 flex items-center bg-green-900/20 border border-green-800 text-green-400 hover:bg-green-900/40 px-2 py-1 rounded text-[10px] font-bold transition-all"
                            title="Run on Colab Swarm"
                        >
                            <span className="material-symbols-outlined text-[12px] mr-1">play_circle</span> RUN ON COLAB
                        </button>
                    )}
                    <button onClick={toggleExpand} className="text-slate-500 hover:text-slate-300" title={isExpanded ? "Collapse" : "Expand"}>
                        <span className="material-symbols-outlined text-sm">{isExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
                    </button>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><span className="material-symbols-outlined text-sm">close</span></button>
                 </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0d1117]">
                {content ? <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{content}</pre> : <div className="flex flex-col items-center justify-center h-full text-slate-600"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">draw</span><span className="text-xs">No active artifacts</span></div>}
            </div>
        </div>
    );
};

const MetaCognitionPanel = ({ graphNodes, isThinking, userEnv, onOpenSpec, dna, isOpen, toggle, width, setWidth }: any) => {
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  }, []);

  if (!isOpen) return null;
  
  return (
    <div className="bg-slate-950 border-r border-slate-900 flex flex-col h-full flex-shrink-0 z-20 shadow-xl font-mono relative" style={{ width: `${width}px` }}>
      <div className="p-4 border-b border-slate-900 bg-slate-950/50 flex justify-between items-start">
        <div>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mathematical Core</h2>
            <div className="flex items-center space-x-2 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${API_KEY ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-red-500'}`}></div><span className="text-xs text-slate-300">ONLINE</span></div>
            <div className="text-[9px] text-slate-600">{userEnv.os} / {userEnv.language}</div>
        </div>
        <button onClick={toggle} className="text-slate-600 hover:text-slate-400 md:hidden"><span className="material-symbols-outlined text-sm">close</span></button>
      </div>
      <div className="p-4 border-b border-slate-900/50">
        <div className="bg-purple-900/10 border border-purple-500/30 p-2 rounded cursor-pointer hover:bg-purple-900/20 transition" onClick={onOpenSpec}>
             <div className="flex items-center space-x-1 mb-1"><span className="material-symbols-outlined text-[10px] text-purple-400">verified</span><span className="text-[9px] text-purple-300 font-bold">GENESIS AXIOM</span></div>
             <div className="text-[8px] text-purple-400/80 leading-tight">"Poverty is structural dependency."</div>
        </div>
      </div>
      <div className="p-4 border-b border-slate-900/50">
        <h3 className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-wider">Evolution Status</h3>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 space-y-1">
             <div className="flex justify-between text-[9px] text-slate-400"><span>Generation</span><span className="text-cyan-400 font-bold">Gen {dna.generation}</span></div>
             <div className="flex justify-between text-[9px] text-slate-400"><span>Mode</span><span className="text-cyan-400">{dna.layoutMode}</span></div>
             <div className="flex justify-between text-[9px] text-slate-400"><span>Persona</span><span className="text-cyan-400">{dna.aiPersona}</span></div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <h3 className="text-[9px] text-slate-600 uppercase mb-3 font-bold tracking-wider">Cognitive Graph</h3>
        <div className="space-y-3 relative pl-1">
          <div className="absolute left-[15px] top-2 bottom-4 w-px bg-slate-800/50"></div>
          {graphNodes.map((node: any) => (
            <div key={node.id} className="relative flex items-center space-x-3 group">
              <div className={`z-10 w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 ${node.status === 'active' ? 'bg-cyan-950 border-cyan-500/50 text-cyan-400 scale-110' : node.status === 'completed' ? 'bg-slate-900 border-slate-700 text-slate-500' : node.status === 'warning' ? 'bg-amber-900/20 border-amber-500/50 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
                <span className="material-symbols-outlined text-[14px]">{node.id === 'input' ? 'input' : node.id === 'refiner' ? 'manage_search' : node.id === 'verification' ? 'gavel' : node.id === 'orchestrator' ? 'hub' : node.id === 'memory' ? 'database' : 'chat'}</span>
              </div>
              <span className={`text-[10px] uppercase font-bold ${node.status === 'active' ? 'text-cyan-300' : node.status === 'warning' ? 'text-amber-500' : 'text-slate-700'}`}>{node.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Resize Handle - Width Increased */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize hover:bg-cyan-500/50 transition-colors z-30"
        onMouseDown={startResizing}
      />
    </div>
  );
};

const ContextPanel = ({ activeSectors, stats, nodes, benevolencePool, isOpen, toggle, isDriveConnected, onDisconnect }: any) => {
  if (!isOpen) return null;
  return (
    <div className="w-72 bg-slate-950 border-l border-slate-900 flex flex-col h-full flex-shrink-0 z-20 shadow-xl font-mono">
      <div className="p-4 border-b border-slate-900 bg-slate-950/50 flex justify-between items-center">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memory & Swarm</h2>
        <button onClick={toggle} className="text-slate-600 hover:text-slate-400 md:hidden"><span className="material-symbols-outlined text-sm">close</span></button>
      </div>
      <div className="p-4 border-b border-slate-900/30">
        <div className="flex items-center space-x-2 bg-amber-900/10 p-2 rounded border border-amber-800/30">
            <span className="material-symbols-outlined text-amber-500 text-sm">volunteer_activism</span>
            <div className="flex flex-col w-full"><span className="text-[9px] text-amber-500 font-bold uppercase">Benevolence Pool</span><span className="text-[10px] text-slate-300">{benevolencePool.toFixed(1)} TF (Available)</span></div>
        </div>
        <div className={`mt-2 flex items-center space-x-2 p-2 rounded border transition-colors duration-500 relative group ${isDriveConnected ? 'bg-green-900/10 border-green-800/30' : 'bg-slate-900/30 border-slate-800'}`}>
            <span className={`material-symbols-outlined text-sm ${isDriveConnected ? 'text-green-500' : 'text-slate-500'}`}>cloud_sync</span>
            <div className="flex flex-col w-full">
                <span className={`text-[9px] font-bold uppercase ${isDriveConnected ? 'text-green-500' : 'text-slate-500'}`}>{isDriveConnected ? 'Drive Connected' : 'Local Storage'}</span>
                <span className="text-[9px] text-slate-400">{isDriveConnected ? 'Bridge Active (Ready)' : 'Offline Mode'}</span>
            </div>
            {isDriveConnected && (
                <button 
                    onClick={onDisconnect}
                    className="absolute right-2 top-2 p-1.5 bg-red-900/20 rounded hover:bg-red-900/50 text-red-400 transition-colors"
                    title="Disconnect"
                >
                    <span className="material-symbols-outlined text-[12px]">link_off</span>
                </button>
            )}
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
        <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-2">Memory Layers (FDE)</h3>
        {['IDENTITY', 'USER_CONTEXT', 'WORLD_KNOWLEDGE'].map((sector) => (
             <div key={sector} className={`p-2 rounded border transition-all duration-300 ${activeSectors.includes(sector) ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-slate-900/30 border-slate-800'}`}>
                <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold ${activeSectors.includes(sector) ? 'text-cyan-400' : 'text-slate-400'}`}>{sector}</span>
                    <span className="text-[9px] text-slate-600 font-mono">
                        {sector === 'IDENTITY' ? stats.identity : sector === 'USER_CONTEXT' ? stats.user : stats.world} Nodes
                    </span>
                </div>
             </div>
        ))}
        <div className="mt-4 pt-4 border-t border-slate-900">
             <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-2">Active Swarm Nodes</h3>
             {nodes.length === 0 ? <div className="text-[9px] text-slate-700 italic">No external nodes. Local Mode.</div> : nodes.map((n:any) => <div key={n.id} className="text-[9px] text-green-500">{n.name}: ONLINE</div>)}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInjection, setShowInjection] = useState(false);
  
  // Layout States
  const [showCanvas, setShowCanvas] = useState(false);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);
  
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(256);

  // Stats State
  const [memoryStats, setMemoryStats] = useState(orchestrator.getStats());

  // Auth States
  const [googleClientId, setGoogleClientId] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // Remote Desktop (Jupyter Tunnel)
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false);

  // System DNA
  const [systemDNA, setSystemDNA] = useState<SystemDNA>({
      layoutMode: 'STANDARD',
      themeColor: 'cyan',
      aiPersona: 'ANALYTICAL',
      generation: 1
  });

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: 'input', label: 'Input Signal', status: 'idle' },
    { id: 'refiner', label: 'Intent Refiner', status: 'idle' },
    { id: 'verification', label: 'Skepticism Loop', status: 'idle' },
    { id: 'orchestrator', label: 'Orchestrator', status: 'idle' },
    { id: 'memory', label: 'Memory Retrieval', status: 'idle' },
    { id: 'response', label: 'Core Response', status: 'idle' }
  ]);
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  const userEnv = useRef(detectSystemEnv()).current;
  const chatRef = useRef<any>(null);
  const refinerChatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
        const savedMessages = localStorage.getItem('ZIA_CHAT_LOG');
        if (savedMessages) setMessages(JSON.parse(savedMessages, (key, value) => key === 'timestamp' ? new Date(value) : value));
        
        const savedDNA = localStorage.getItem('ZIA_SYSTEM_DNA');
        if (savedDNA) setSystemDNA(JSON.parse(savedDNA));

        const savedClientId = localStorage.getItem('ZIA_GOOGLE_CLIENT_ID');
        if (savedClientId) {
            setGoogleClientId(savedClientId);
        }

        const savedDriveStatus = localStorage.getItem('ZIA_DRIVE_CONNECTED');
        if (savedDriveStatus === 'true') {
            setIsDriveConnected(true);
        }
        
        setMemoryStats(orchestrator.getStats());
    } catch (e) { console.error("Restore failed:", e); }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) localStorage.setItem('ZIA_CHAT_LOG', JSON.stringify(messages));
    localStorage.setItem('ZIA_SYSTEM_DNA', JSON.stringify(systemDNA));
    if (googleClientId) localStorage.setItem('ZIA_GOOGLE_CLIENT_ID', googleClientId);
    localStorage.setItem('ZIA_DRIVE_CONNECTED', isDriveConnected.toString());
  }, [messages, systemDNA, googleClientId, isDriveConnected]);

  // Handle Client ID Change
  useEffect(() => {
    if (googleClientId) {
        driveBridge.init(googleClientId, (token) => setIsDriveConnected(true));
    }
  }, [googleClientId]);

  // Polling for Drive Bridge (Result Files & Connection Info)
  useEffect(() => {
      let interval: any;
      if (isDriveConnected) {
          interval = setInterval(async () => {
              // 1. Check for Command Results
              try {
                  const files = await driveBridge.searchFiles("name contains 'res_' and trashed=false");
                  if (files && files.length > 0) {
                      for (const file of files) {
                          const content = await driveBridge.getFileContent(file.id);
                          await driveBridge.deleteFile(file.id); // Consumption
                          
                          setMessages(prev => [...prev, { 
                              id: Date.now().toString(), 
                              role: 'system', 
                              text: `[COLAB RESULT]:\n${content.output || JSON.stringify(content)}`, 
                              timestamp: new Date() 
                          }]);
                      }
                  }
              } catch (e) { console.error("Bridge polling error:", e); }

              // 2. Check for Remote Desktop Connection Info
              try {
                  const connFiles = await driveBridge.searchFiles("name = 'connection_info.json' and trashed=false");
                  if (connFiles && connFiles.length > 0) {
                      const connInfo = await driveBridge.getFileContent(connFiles[0].id);
                      if (connInfo.url && connInfo.url !== remoteUrl) {
                          setRemoteUrl(connInfo.url);
                      }
                  }
              } catch (e) { console.error("Connection polling error:", e); }

          }, 5000); // Check every 5s
      }
      return () => clearInterval(interval);
  }, [isDriveConnected, remoteUrl]);

  const updateGraphNode = (id: string, status: GraphNode['status']) => {
    setGraphNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const showColabScript = () => {
      setCanvasContent(PYTHON_WORKER_SCRIPT);
      setShowCanvas(true);
      // Also evolve to coder mode
      setSystemDNA(prev => ({ ...prev, layoutMode: 'CODER' }));
  };

  const disconnectDrive = () => {
      setIsDriveConnected(false);
      setRemoteUrl(null);
      setShowRemoteDesktop(false);
  };

  const evolveSystem = (intent: string) => {
      let newDNA = { ...systemDNA };
      let changed = false;

      if (intent === 'TASK' && systemDNA.layoutMode !== 'CODER') {
          newDNA.layoutMode = 'CODER';
          newDNA.aiPersona = 'ANALYTICAL';
          changed = true;
      } else if (intent === 'EMOTIONAL' && systemDNA.aiPersona !== 'EMPATHETIC') {
          newDNA.aiPersona = 'EMPATHETIC';
          newDNA.themeColor = 'rose';
          changed = true;
      } else if (intent === 'PHILOSOPHICAL' && systemDNA.layoutMode !== 'WRITER') {
          newDNA.layoutMode = 'WRITER';
          changed = true;
      }

      if (changed) {
          newDNA.generation += 1;
          setSystemDNA(newDNA);
          setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'system', 
              text: `🧬 [SYSTEM EVOLUTION] Adapting UI to '${newDNA.layoutMode}' mode for optimized workflow.`, 
              timestamp: new Date() 
          }]);
          if (newDNA.layoutMode !== 'STANDARD') setShowCanvas(true);
      }
  };

  const handleKnowledgeInjection = (content: string) => {
      orchestrator.store('WORLD_KNOWLEDGE', content, 'User Injection');
      setMemoryStats(orchestrator.getStats());
      
      // If connected, try to save to Drive (Fire & Forget)
      if (isDriveConnected) {
          driveBridge.saveFile(`knowledge_${Date.now()}.json`, { content, type: 'WORLD_KNOWLEDGE', fde: 'sim' });
      }

      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'system', 
          text: `[MEMORY] Injected new knowledge into World DB. (FDE Hashed${isDriveConnected ? ' & Synced to Drive' : ''})`, 
          timestamp: new Date() 
      }]);
  };

  const refineUserIntent = async (input: string): Promise<any> => {
    try {
        if (!refinerChatRef.current) {
            refinerChatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: RECEPTIONIST_SYSTEM_PROMPT, responseMimeType: "application/json" }
            });
        }
        const result = await refinerChatRef.current.sendMessage({ message: input });
        const analysis = JSON.parse(result.text);
        if (!analysis.isClear) return { raw: analysis, type: 'AMBIGUOUS', question: analysis.clarifyingQuestion };
        return { raw: analysis, type: analysis.intent };
    } catch (e) { return { raw: null, type: 'QUERY' }; }
  };
  
  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    
    updateGraphNode('input', 'active'); await new Promise(r => setTimeout(r, 100)); updateGraphNode('input', 'completed');
    updateGraphNode('refiner', 'active');
    const refinement = await refineUserIntent(text);
    
    evolveSystem(refinement.type);

    if (refinement.type === 'AMBIGUOUS') {
        updateGraphNode('refiner', 'warning');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `💡 ${refinement.question}`, timestamp: new Date(), metadata: { refinementStatus: 'CLARIFICATION_NEEDED' } }]);
        setIsThinking(false); setTimeout(() => setGraphNodes(prev => prev.map(n => ({ ...n, status: 'idle' }))), 2000);
        return;
    }
    
    setMessages(prev => [...prev, { id: Date.now().toString() + "_doc", role: 'refiner', text: "Analyzed", timestamp: new Date(), metadata: { cognitiveCard: { intent: refinement.type, original: text, data: refinement.raw.meta } } }]);
    updateGraphNode('refiner', 'completed');
    
    updateGraphNode('verification', 'active');
    const effectivePrompt = refinement.type === 'TASK' ? refinement.raw.meta.optimizedPrompt : text;
    const skepticismResult = SkepticismProtocol(effectivePrompt, "");
    if (!skepticismResult.safe) {
        updateGraphNode('verification', 'warning');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SKEPTICISM] ${skepticismResult.reason}`, timestamp: new Date() }]);
        setIsThinking(false); return; 
    }
    updateGraphNode('verification', 'completed');

    updateGraphNode('orchestrator', 'active');
    const sectors = await orchestrator.routeQuery(text);
    setActiveSectors(sectors);
    
    const relatedMemories = orchestrator.retrieveRelatedMemories(effectivePrompt);
    const userContext = orchestrator.retrieveUserContext();
    updateGraphNode('orchestrator', 'completed');

    updateGraphNode('memory', 'active');
    try {
        if (!chatRef.current) {
            if (!API_KEY) throw new Error("API Key Missing");
            chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: system_instruction_augmentation, tools: [{ googleSearch: {} }] } });
        }
        
        let finalMessage = effectivePrompt;
        let systemNote = "";
        
        if (userContext) systemNote += `[RECENT USER CONTEXT]:\n${userContext}\n\n`;
        if (relatedMemories) systemNote += `[RECALLED MEMORIES (FDE Similarity)]: \n${relatedMemories}\n\n`;
        if (isDriveConnected) systemNote += `[SYSTEM STATUS]: Drive Bridge is ACTIVE. You are connected to the user's Google Drive and can use it as memory/storage.\n`;
        if (remoteUrl) systemNote += `[SYSTEM STATUS]: Remote Desktop (Jupyter Lab) is ACTIVE at ${remoteUrl}. You can tell the user to click the REMOTE DESKTOP button.\n`;
        
        if (systemNote) finalMessage = `${systemNote}[USER REQUEST]: ${effectivePrompt}`;

        updateGraphNode('memory', 'completed');
        updateGraphNode('response', 'active');
        
        const result = await chatRef.current.sendMessage({ message: finalMessage });
        const responseText = result.text;
        const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

        const fdeSig = computeSimHashSignature(responseText);
        const logicScore = calculateLogicDensity(responseText);
        let harvested = false;
        
        // Relaxed criteria for demonstration: harvest if search happened OR text is reasonable length
        if (groundingMetadata || (responseText.length > 50) || refinement.type === 'QUERY') {
            const harvestSource = groundingMetadata ? 'Web Search' : 'Internal Reasoning';
            const stored = orchestrator.store('WORLD_KNOWLEDGE', responseText, harvestSource);
            if (stored) harvested = true;
            
            // Sync to Drive if connected
            if (isDriveConnected && harvested) {
                driveBridge.saveFile(`harvest_${Date.now()}.json`, { content: responseText, source: harvestSource });
            }

            // Force stats update
            setMemoryStats(orchestrator.getStats());
        }

        setMessages(prev => [...prev, {
            id: (Date.now()+1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date(),
            metadata: { 
                fdeSignature: fdeSig, 
                activeMemorySectors: sectors, 
                truthState: 'CANONICAL',
                doubtLevel: skepticismResult.doubtLevel,
                refinementStatus: 'REFINED',
                groundingMetadata: groundingMetadata,
                harvested: harvested
            }
        }]);
        orchestrator.store('USER_CONTEXT', text, 'User Input');
        setMemoryStats(orchestrator.getStats()); 

        if (responseText.includes('```') || responseText.length > 300) {
            setCanvasContent(responseText);
            setShowCanvas(true);
        }

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `Error: ${e.message}`, timestamp: new Date() }]);
    } finally {
        updateGraphNode('response', 'completed');
        setIsThinking(false);
        setTimeout(() => setGraphNodes(prev => prev.map(n => ({ ...n, status: 'idle' }))), 2000);
    }
  };

  const CognitiveCard = ({ card }: { card: any }) => {
    if (!card) return null;
    let colorClass = 'border-slate-700 bg-slate-800/50';
    let icon = 'psychology';
    if (card.intent === 'TASK') { colorClass = 'border-cyan-500/50 bg-cyan-900/20'; icon = 'terminal'; }
    else if (card.intent === 'EMOTIONAL') { colorClass = 'border-rose-500/50 bg-rose-900/20'; icon = 'volunteer_activism'; }
    else if (card.intent === 'QUERY') { colorClass = 'border-emerald-500/50 bg-emerald-900/20'; icon = 'search'; }
    else if (card.intent === 'PHILOSOPHICAL') { colorClass = 'border-violet-500/50 bg-violet-900/20'; icon = 'self_improvement'; }

    return (
        <div className={`flex w-full justify-center my-2 animate-fade-in`}>
            <div className={`w-full max-w-lg rounded-lg border px-3 py-2 flex flex-col space-y-1 ${colorClass}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-xs opacity-80">{icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{card.intent} BLUEPRINT</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-60">REF-ID: {Math.random().toString(36).substr(2,6)}</span>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                {card.intent === 'TASK' && <div className="text-[10px] font-mono text-cyan-200 break-all">{card.data?.optimizedPrompt || card.original}</div>}
                {card.intent === 'EMOTIONAL' && <div className="flex space-x-2 text-[10px]"><span className="text-rose-300">Mood: {card.data?.detectedEmotion}</span><span className="text-slate-400">Tone: {card.data?.responseTone}</span></div>}
                {card.intent === 'QUERY' && <div className="text-[10px] text-emerald-300">Keywords: {card.data?.searchKeywords?.join(', ')}</div>}
            </div>
        </div>
    );
  };

  if (showRemoteDesktop && remoteUrl) {
      return <RemoteDesktop url={remoteUrl} onClose={() => setShowRemoteDesktop(false)} />;
  }

  return (
    <div className={`flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden ${systemDNA.themeColor === 'rose' ? 'selection:bg-rose-500/30' : 'selection:bg-cyan-500/30'}`}>
      
      {/* Left Panel: Meta Cognition */}
      <div className={`transition-all duration-75 ease-linear border-r border-slate-900 ${isLeftPanelOpen ? '' : 'w-0 overflow-hidden'}`} style={{ width: isLeftPanelOpen ? `${leftPanelWidth}px` : '0px' }}>
        <MetaCognitionPanel graphNodes={graphNodes} isThinking={isThinking} userEnv={userEnv} onOpenSpec={() => setShowSpec(true)} dna={systemDNA} isOpen={true} toggle={() => setIsLeftPanelOpen(false)} width={leftPanelWidth} setWidth={setLeftPanelWidth} />
      </div>

      {/* Main Area */}
      <div className={`flex-1 flex flex-col bg-slate-950 relative min-w-0 z-10 transition-all duration-300`}>
         <div className="h-12 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur">
             <div className="flex items-center space-x-4">
                 <button onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)} className={`text-slate-500 hover:text-cyan-400 ${isLeftPanelOpen ? 'text-cyan-400' : ''}`} title="Toggle Left Panel"><span className="material-symbols-outlined">dock_to_right</span></button>
                 <div className="flex items-center space-x-2"><span className="text-sm font-bold tracking-widest text-slate-200">ZIA: HOLON WORLD</span><span className="text-[9px] bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-1.5 py-0.5 rounded font-bold shadow-lg">COMPETITION EDITION</span></div>
             </div>
             
             {/* Center: Remote Desktop Status */}
             {remoteUrl && (
                 <button 
                    onClick={() => setShowRemoteDesktop(true)}
                    className="flex items-center bg-orange-900/20 border border-orange-500/50 px-3 py-1 rounded text-orange-400 hover:bg-orange-900/40 hover:text-orange-300 transition-all animate-pulse"
                 >
                     <span className="material-symbols-outlined text-sm mr-2">terminal</span>
                     <span className="text-[10px] font-bold">REMOTE DESKTOP READY</span>
                 </button>
             )}

             <div className="flex items-center space-x-4">
                 <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-slate-300" title="Settings"><span className="material-symbols-outlined text-sm">settings</span></button>
                 <div className="h-4 w-px bg-slate-800"></div>
                 <button onClick={() => setShowCanvas(!showCanvas)} className={`text-slate-500 hover:text-cyan-400 ${showCanvas ? 'text-cyan-400' : ''}`} title="Toggle Canvas"><span className="material-symbols-outlined">space_dashboard</span></button>
                 <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className={`text-slate-500 hover:text-amber-400 ${isRightPanelOpen ? 'text-amber-400' : ''}`} title="Toggle Right Panel"><span className="material-symbols-outlined">dock_to_left</span></button>
             </div>
         </div>
         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full pb-20">
                    <div className="w-20 h-20 mb-8 relative">
                        <div className={`absolute inset-0 border-2 rounded-full animate-[spin_10s_linear_infinite] ${systemDNA.themeColor === 'rose' ? 'border-rose-500/30' : 'border-cyan-500/30'}`}></div>
                        <div className="absolute inset-3 border-2 border-purple-500/30 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-slate-200">fingerprint</span></div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">ZIA COGNITIVE OS</h1>
                    <p className="text-sm text-slate-500 mb-8 font-light">"의심하는 지성, 진화하는 자아"</p>
                    <div className="flex space-x-3">
                        <div className="px-3 py-1 bg-cyan-900/20 border border-cyan-800/50 rounded text-[10px] text-cyan-400">Client-Side FDE</div>
                        <div className="px-3 py-1 bg-purple-900/20 border border-purple-800/50 rounded text-[10px] text-purple-400">Social Benevolence</div>
                        <div className="px-3 py-1 bg-emerald-900/20 border border-emerald-800/50 rounded text-[10px] text-emerald-400">Drive Bridge</div>
                    </div>
                </div>
            ) : (
                messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'refiner' && <CognitiveCard card={msg.metadata?.cognitiveCard} />}
                        {msg.role !== 'refiner' && (
                            <div className={`max-w-xl p-4 rounded-2xl mb-2 ${msg.role === 'user' ? 'bg-cyan-900/10 border border-cyan-800/30 text-cyan-100' : msg.role === 'system' ? 'bg-transparent border border-slate-800 text-slate-500 text-xs font-mono' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                                <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
                                {msg.metadata?.groundingMetadata && (
                                    <div className="mt-3 pt-2 border-t border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center"><span className="material-symbols-outlined text-[10px] mr-1">link</span>Harvested Sources</div>
                                        {msg.metadata.groundingMetadata.groundingChunks?.map((chunk:any, idx:number) => (
                                            <div key={idx} className="text-[9px] text-cyan-500 truncate hover:underline cursor-pointer">{chunk.web?.title || chunk.web?.uri}</div>
                                        ))}
                                    </div>
                                )}
                                {msg.metadata?.harvested && (
                                    <div className="mt-2 p-1.5 bg-emerald-900/20 border border-emerald-800/50 rounded flex items-center text-[9px] text-emerald-400 font-bold animate-pulse">
                                        <span className="material-symbols-outlined text-[12px] mr-1">diamond</span>
                                        KNOWLEDGE HARVESTED (+1 Node)
                                    </div>
                                )}
                                {msg.metadata?.fdeSignature && <div className="mt-2 text-[9px] text-slate-600 font-mono flex justify-between"><span>FDE: {msg.metadata.fdeSignature.substring(0,8)}</span><span>Doubt: {msg.metadata.doubtLevel?.toFixed(2)}</span></div>}
                            </div>
                        )}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
         </div>
         <div className="p-4 bg-slate-950 border-t border-slate-900">
             <div className="relative max-w-4xl mx-auto flex gap-2">
                 <button onClick={() => setShowInjection(true)} className="flex items-center px-4 bg-cyan-600 text-white border border-cyan-500 rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20" title="Inject Knowledge">
                    <span className="material-symbols-outlined text-sm mr-2">psychology</span>
                    <span className="text-xs font-bold">INJECT</span>
                 </button>
                 <textarea className="w-full bg-slate-900 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 border border-slate-800 resize-none h-14 font-mono" placeholder="Enter command..." onKeyDown={(e) => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage((e.target as HTMLTextAreaElement).value); (e.target as HTMLTextAreaElement).value=''; }}} />
             </div>
         </div>
      </div>

      {/* Artifacts Canvas */}
      {showCanvas && (
        <ArtifactsCanvas 
            content={canvasContent} 
            isOpen={showCanvas} 
            onClose={() => setShowCanvas(false)} 
            dna={systemDNA} 
            isExpanded={isCanvasExpanded}
            toggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
            isDriveConnected={isDriveConnected}
        />
      )}

      {/* Right Panel: Context & Memory */}
      <div className={`transition-all duration-300 ease-in-out border-l border-slate-900 ${isRightPanelOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
          <ContextPanel 
            activeSectors={activeSectors} 
            stats={memoryStats} 
            nodes={swarm.getActiveNodes()} 
            benevolencePool={swarm.getBenevolencePoolStats()} 
            isOpen={true} 
            toggle={() => setIsRightPanelOpen(false)} 
            isDriveConnected={isDriveConnected} 
            onDisconnect={disconnectDrive}
          />
      </div>

      <BlueprintViewer isOpen={showSpec} onClose={() => setShowSpec(false)} />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        clientId={googleClientId} 
        setClientId={setGoogleClientId} 
        isDriveConnected={isDriveConnected} 
        onSimulateConnection={() => setIsDriveConnected(true)}
        onDisconnect={disconnectDrive}
        onGetScript={showColabScript} 
      />
      <KnowledgeInjectionModal 
        isOpen={showInjection} 
        onClose={() => setShowInjection(false)} 
        onInject={handleKnowledgeInjection} 
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
