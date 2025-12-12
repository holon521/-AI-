
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { orchestrator, MemoryType } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../04_NERVES/drive_bridge';
import { agentOrchestrator } from '../03_AGENTS/agent_orchestrator';
import { Message, SystemDNA, LLMProvider, TaskLog } from '../types';
import { PYTHON_WORKER_SCRIPT } from '../04_NERVES/zia_worker_script';

// [HELIX SAFETY CONFIG]
const MAX_AUTO_LOOPS = 2; 

export const useZiaOS = () => {
  // --- STATE LAYER ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [taskLog, setTaskLog] = useState<TaskLog[]>([]);
  
  // Auth & Config
  const [apiKey, setApiKey] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemini-3-pro-preview');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('GOOGLE');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false); 
  
  // UI States
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);
  const [visualArtifact, setVisualArtifact] = useState<{image?: string, html?: string, logs?: string} | undefined>(undefined);
  const [memoryStats, setMemoryStats] = useState(orchestrator.getStats());
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  
  // Bridge States
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false);
  const [swarmMemoryStatus, setSwarmMemoryStatus] = useState<string>('Connecting...');
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [swarmVectorCount, setSwarmVectorCount] = useState<number>(0);
  
  // Identity & DNA
  const [systemDNA, setSystemDNA] = useState<SystemDNA>({
      layoutMode: 'STANDARD',
      themeColor: 'cyan',
      aiPersona: 'ANALYTICAL',
      generation: 5,
      reasoningMode: 'AUTO',
      // [NEW] Default Interpreter Config
      interpreterConfig: {
          ambiguityThreshold: 0.5, // Balanced by default
          uiMode: 'INLINE',
          showThoughtProcess: false
      }
  });

  // [SAFETY STATE]
  const [autoLoopDepth, setAutoLoopDepth] = useState(0);

  const autoSaveTimer = useRef<any>(null);

  // --- AUDIO OUTPUT ---
  const speak = (text: string) => {
      if (isMuted || !window.speechSynthesis) return;
      const cleanText = text.replace(/```[\s\S]*?```/g, "Code Block.").replace(/\[.*?\]/g, "").substring(0, 200);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const korVoice = voices.find(v => v.lang.includes('ko'));
      if (korVoice) utterance.voice = korVoice;
      utterance.rate = 1.1; utterance.pitch = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
  };

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    try {
        const savedMessages = localStorage.getItem('ZIA_CHAT_LOG');
        if (savedMessages) setMessages(JSON.parse(savedMessages, (key, value) => key === 'timestamp' ? new Date(value) : value));
        
        const savedDNA = localStorage.getItem('ZIA_SYSTEM_DNA');
        if (savedDNA) {
            const parsed = JSON.parse(savedDNA);
            // Merge with defaults to support schema updates
            setSystemDNA(prev => ({ ...prev, ...parsed, interpreterConfig: { ...prev.interpreterConfig, ...parsed.interpreterConfig } }));
        }
        
        const savedApiKey = localStorage.getItem('ZIA_GEMINI_API_KEY');
        if (savedApiKey) setApiKey(savedApiKey);
        
        const savedProvider = localStorage.getItem('ZIA_LLM_PROVIDER');
        if (savedProvider) setLlmProvider(savedProvider as LLMProvider);
        
        const savedBaseUrl = localStorage.getItem('ZIA_LLM_BASE_URL');
        if (savedBaseUrl) setBaseUrl(savedBaseUrl);

        setMemoryStats(orchestrator.getStats());
    } catch (e) { console.error("Restore failed:", e); }
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('ZIA_CHAT_LOG', JSON.stringify(messages));
    localStorage.setItem('ZIA_SYSTEM_DNA', JSON.stringify(systemDNA));
    if (apiKey) localStorage.setItem('ZIA_GEMINI_API_KEY', apiKey);
    return () => { if(autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [messages, systemDNA, apiKey]);

  // --- DEMO MODE ---
  const handleEnableDemoMode = () => {
      console.log("Entering Demo Mode...");
      setIsDriveConnected(true);
      setIsSwarmActive(true);
      setSwarmMemoryStatus("Demo / Simulation Mode");
      setSwarmVectorCount(12048);
      
      orchestrator.store('WORLD_KNOWLEDGE', 'Gemini 3 Pro Preview is the primary reasoning engine for ZIA.', 'DemoLoader');
      orchestrator.store('WORLD_KNOWLEDGE', 'MuVERA FDE allows O(1) retrieval of vector embeddings via simple bitwise operations.', 'DemoLoader');
      orchestrator.store('WORLD_KNOWLEDGE', 'Sovereign AI Architecture minimizes dependency on centralized cloud providers.', 'DemoLoader');
      orchestrator.store('IDENTITY', 'ZIA Core Protocol v10.9 Online.', 'System');
      orchestrator.store('USER_CONTEXT', 'User requested system diagnostic visualization.', 'User');
      
      setMemoryStats(orchestrator.getStats());
      
      setMessages(prev => [
          ...prev, 
          { id: 'demo1', role: 'system', text: '⚡ **DEMO MODE ACTIVATED**\n- Swarm Bridge: Simulated\n- Vector DB: 12,048 Records (Mock)\n- Logic Core: Gemini 3 Pro Preview', timestamp: new Date() },
          { id: 'demo2', role: 'model', text: 'System ready. I have generated a **Real-time Diagnostic Dashboard** to visualize my internal Holon state. You can capture this for your records.', timestamp: new Date() }
      ]);

      const demoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;800&display=swap" rel="stylesheet">
        <style>body { font-family: 'JetBrains Mono', monospace; background: #000; color: #0ff; }</style>
      </head>
      <body class="p-6 h-screen flex flex-col overflow-hidden bg-slate-950 text-cyan-400">
        <div class="border-b-2 border-cyan-900 pb-4 mb-4 flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-black tracking-tighter text-white">ZIA: HOLON OS</h1>
                <div class="text-xs text-cyan-600">SOVEREIGN COGNITIVE ARCHITECTURE</div>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-green-400 animate-pulse">ONLINE</div>
                <div class="text-xs text-slate-500">LATENCY: 12ms</div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4 flex-1">
            <div class="bg-cyan-900/10 border border-cyan-800 p-4 rounded-lg relative overflow-hidden">
                <h2 class="text-sm font-bold text-slate-400 mb-2">MEMORY TOPOLOGY (FDE)</h2>
                <div class="absolute inset-0 opacity-30 flex items-center justify-center">
                    <div class="w-32 h-32 border-4 border-cyan-500 rounded-full animate-ping"></div>
                </div>
            </div>
            <div class="col-span-2 bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                 <div class="text-4xl mb-2">🧠</div>
                 <div class="text-lg font-bold text-white">GEMINI 3 PRO PREVIEW</div>
                 <div class="text-xs text-slate-500 mt-1">PRIMARY REASONING CORE ACTIVE</div>
            </div>
        </div>
      </body>
      </html>
      `;
      
      setVisualArtifact({ html: demoHtml, logs: "[DEMO] Initializing holographic display...\n[DEMO] Connecting to neural core...\n[DEMO] Rendering complete." });
      setShowCanvas(true);
  };

  // --- REACTIVE NERVOUS SYSTEM ---
  useEffect(() => {
      const unsubMemory = orchestrator.subscribe((stats) => {
          setMemoryStats(stats);
      });

      const unsubNerves = driveBridge.subscribe((e) => {
          if (e.type === 'STATUS') {
              if (!isSwarmActive && e.payload.active) setIsSwarmActive(true);
              if (isSwarmActive && !e.payload.active) setIsSwarmActive(false);
              setSwarmMemoryStatus(e.payload.active ? `Active (v${e.payload.version || '?'})` : `Offline (${e.payload.message || '?'})`);
              if (e.payload.vectorCount) setSwarmVectorCount(e.payload.vectorCount);
          } 
          else if (e.type === 'ERROR') {
              if (e.payload.code === 401) {
                  setIsDriveConnected(false);
                  setIsSwarmActive(false);
                  setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚠️ **Auth Token Expired.** Please reconnect in settings.", timestamp: new Date() }]);
              }
          }
          else if (e.type === 'RESULT') {
              const file = e.payload;
              const content = file.content;
              const fname = file.filename;

              if (fname.includes('res_python_exec')) {
                 if (content.status === 'error') {
                    const errorMsg = `[SWARM ERROR]:\n${content.error}`;
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: errorMsg, timestamp: new Date(), metadata: { swarmResult: true } }]);
                    speak("Swarm execution failed.");
                 } else {
                     const output = content.output || {};
                     let resultText = `[EXECUTION RESULT]:\n${output.stdout || ''}\n${output.stderr || ''}`;
                     if (output.image) resultText += "\n[SYSTEM]: An image was generated.";
                     if (output.html) resultText += "\n[SYSTEM]: An HTML artifact was generated.";

                     setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: resultText, timestamp: new Date(), metadata: { swarmResult: true } }]);
                     
                     if (output.image || output.html || output.stdout || output.stderr) {
                         const combinedLogs = (output.stdout || '') + "\n" + (output.stderr || '');
                         setVisualArtifact({ image: output.image, html: output.html, logs: combinedLogs });
                         setShowCanvas(true);
                     }
                 }
              } 
              else if (fname.includes('res_query_memory')) {
                  const docs = content.documents || [];
                  const memoryText = docs.length > 0 
                    ? docs.map((d: string, i: number) => `[SWARM MEMORY #${i+1}]: ${d}`).join('\n')
                    : `No relevant memories found.`;
                  setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🧠 **Swarm Recall:**\n${memoryText}`, timestamp: new Date(), metadata: { swarmResult: true } }]);
              }
              else if (fname.includes('res_n8n_proxy')) {
                  const resText = `[N8N RESULT]: Status ${content.n8n_status}\n${content.response ? JSON.stringify(content.response).substring(0, 500) : ''}`;
                  setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: resText, timestamp: new Date(), metadata: { swarmResult: true } }]);
              }
              else if (fname.includes('res_app_url')) {
                  setRemoteUrl(content.url);
                  setShowRemoteDesktop(true);
                  speak("Remote tunnel established.");
              }
          }
      });

      if (isDriveConnected && !swarmMemoryStatus.includes('Demo')) {
          driveBridge.startPulse();
      } else {
          driveBridge.stopPulse();
      }

      return () => {
          unsubMemory();
          unsubNerves();
          driveBridge.stopPulse();
      };
  }, [isDriveConnected, swarmMemoryStatus, isSwarmActive]);


  // --- MAIN INTERACTION LOGIC ---
  const handleSendMessage = async (text: string, attachment?: { mimeType: string; data: string }, onRequestKey?: () => void) => {
    if (!apiKey && !baseUrl) { onRequestKey && onRequestKey(); alert("BRAIN MISSING: Please check Settings."); return; }
    
    // [HELIX BREAKER] Reset loop depth on USER INTERACTION (Telomere Repair)
    const isSystemTrigger = text.startsWith('[SYSTEM_TRIGGER]');
    if (!isSystemTrigger) {
        setAutoLoopDepth(0); 
        const userMsg: Message = { 
            id: Date.now().toString(), role: 'user', text: attachment ? `[IMAGE ATTACHED] ${text}` : text, timestamp: new Date() 
        };
        setMessages(prev => [...prev, userMsg]);
    } else {
        setAutoLoopDepth(prev => prev + 1);
    }
    
    setIsThinking(true);

    try {
        const result = await agentOrchestrator.processMessage(
            text, 
            attachment,
            {
                apiKey,
                model: activeModel,
                provider: llmProvider,
                baseUrl,
                history: messages.slice(-15),
                dna: systemDNA
            },
            (updatedTask) => {
                setTaskLog(prev => {
                    const exists = prev.find(t => t.id === updatedTask.id);
                    if (exists) return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
                    return [...prev.slice(-19), updatedTask];
                });
            }
        );

        if (result.visualArtifact) {
            setVisualArtifact(result.visualArtifact);
            setShowCanvas(true);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🛠️ [MICRO-APP GENERATED]`, timestamp: new Date() }]);
        }

        if (result.swarmCommand) {
            if (swarmMemoryStatus.includes('Demo')) {
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(), 
                    role: 'system', 
                    text: `[SIMULATION] Swarm Command Intercepted: ${result.swarmCommand?.type}`, 
                    timestamp: new Date() 
                }]);
                setIsThinking(false);
                return;
            }

            const cmdType = result.swarmCommand.type;
            const payload = result.swarmCommand.payload;
            if (!payload.id) payload.id = Date.now().toString();

            if (isDriveConnected) {
                const filename = `${cmdType}_${payload.id}.json`;
                driveBridge.saveFile(filename, payload).then(() => {
                    setTaskLog(prev => [...prev, { id: Date.now().toString(), stage: 'SWARM', status: 'processing', message: `Dispatched ${cmdType} to Neural Grid...`, timestamp: Date.now() }]);
                    speak("Executing on Swarm.");
                }).catch(e => {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SWARM ERROR]: ${e.message}`, timestamp: new Date() }]);
                });
            } else {
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `⚠️ [SYSTEM]: Swarm Disconnected.`, timestamp: new Date() }]);
            }
        }

        if (result.responseText) {
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                role: 'model', 
                text: result.responseText, 
                timestamp: new Date(), 
                metadata: result.metadata 
            }]);
            if (!isSystemTrigger) speak(result.responseText);
        }

        if (result.responseText && result.responseText.length > 50) {
            orchestrator.store('USER_CONTEXT', result.responseText, 'ZIA Response');
        }

    } catch (e: any) {
        let errorMsg = e.message || String(e);
        if (errorMsg.includes('429')) {
            const suggestion = `⚠️ **API Rate Limit Exceeded (429)**. Please standby.`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: suggestion, timestamp: new Date() }]);
        } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `Critical Error: ${errorMsg}`, timestamp: new Date() }]);
        }
    } finally {
        setIsThinking(false);
    }
  };

  // [HELIX BREAKER LOGIC v2]
  useEffect(() => {
      if (messages.length === 0 || isThinking) return;
      
      const lastMsg = messages[messages.length - 1];
      
      if (lastMsg.role === 'system' && lastMsg.metadata?.swarmResult) {
          if (autoLoopDepth >= MAX_AUTO_LOOPS) {
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'system',
                  text: `🛑 **HELIX STABILIZATION ACTIVE**\nAuto-execution loop limit reached. Please confirm to continue.`,
                  timestamp: new Date()
              }]);
              return;
          }

          const timer = setTimeout(() => {
              handleSendMessage('[SYSTEM_TRIGGER] Swarm Task Completed. Analyze the result and continue.', undefined);
          }, 1500);
          return () => clearTimeout(timer);
      }
  }, [messages, isThinking, autoLoopDepth]);

  const handleCloudBackup = async () => {
    if(!isDriveConnected) { alert("Connect Drive first."); return; }
    const memSnapshot = orchestrator.snapshot();
    const soulPacket = { messages, memory: memSnapshot, timestamp: Date.now(), dna: systemDNA };
    await driveBridge.saveFile('zia_soul_backup.json', soulPacket);
    orchestrator.markAllSynced(); 
    speak("Soul backup complete.");
  };

  const handleCloudRestore = async (): Promise<boolean> => {
    if(!isDriveConnected) { alert("Connect Drive first."); return false; }
    try {
        const files = await driveBridge.searchFiles("name = 'zia_soul_backup.json' and trashed=false");
        if (files.length === 0) return false;
        const soulData = await driveBridge.getFileContent(files[0].id);
        if (soulData.messages) setMessages(soulData.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})));
        if (soulData.memory) { orchestrator.restore(soulData.memory); setMemoryStats(orchestrator.getStats()); }
        if (soulData.dna) setSystemDNA(soulData.dna);
        speak("Resurrection complete.");
        return true;
    } catch(e) { console.error(e); return false; }
  };

  const testBrainConnection = async (key: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.countTokens({ model: activeModel, contents: "ping" });
        return "SUCCESS";
    } catch (e: any) { return e.message; }
  };

  const handleArtifactSignal = (type: string, payload: any) => {
      switch(type) {
          case 'ZIA_SAY':
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `[FROM APP]: ${payload.text}`, timestamp: new Date() }]);
              handleSendMessage(`[SYSTEM]: Micro-App signal: "${payload.text}".`);
              break;
          case 'ZIA_SAVE':
              orchestrator.store('USER_CONTEXT', JSON.stringify(payload.value), `Micro-App: ${payload.key}`);
              break;
          case 'ZIA_COMPUTE':
              handleSendMessage(`[SYSTEM]: Micro-App code request:\n${payload.code}`, undefined);
              break;
      }
  };

  return {
    messages, setMessages, isThinking, taskLog,
    apiKey, setApiKey, activeModel, setActiveModel, llmProvider, setLlmProvider, baseUrl, setBaseUrl, isMuted, setIsMuted,
    showCanvas, setShowCanvas, canvasContent, setCanvasContent, visualArtifact,
    memoryStats, setMemoryStats,
    isDriveConnected, setIsDriveConnected,
    remoteUrl, showRemoteDesktop, setShowRemoteDesktop,
    swarmMemoryStatus, isSwarmActive, swarmVectorCount,
    activeSectors,
    systemDNA, setSystemDNA, 
    handleCloudBackup, handleCloudRestore, testBrainConnection, handleSendMessage,
    handleArtifactSignal,
    handleEnableDemoMode
  };
};
