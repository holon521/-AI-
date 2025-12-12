
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { orchestrator, MemoryType } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../04_NERVES/drive_bridge';
import { agentOrchestrator } from '../03_AGENTS/agent_orchestrator';
import { Message, SystemDNA, LLMProvider, TaskLog } from '../types';
import { PYTHON_WORKER_SCRIPT } from '../04_NERVES/zia_worker_script';

export const useZiaOS = () => {
  // --- STATE LAYER ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [taskLog, setTaskLog] = useState<TaskLog[]>([]);
  
  // Auth & Config
  const [apiKey, setApiKey] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemini-2.0-flash-exp');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('GOOGLE');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false); 
  
  // UI States
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);
  const [visualArtifact, setVisualArtifact] = useState<{image?: string, html?: string} | undefined>(undefined);
  const [memoryStats, setMemoryStats] = useState(orchestrator.getStats());
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  
  // Bridge States
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false);
  const [swarmMemoryStatus, setSwarmMemoryStatus] = useState<string>('Connecting...');
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [swarmVectorCount, setSwarmVectorCount] = useState<number>(0);
  const [swarmLastPulse, setSwarmLastPulse] = useState<number>(0);

  // Identity
  const [systemDNA, setSystemDNA] = useState<SystemDNA>({
      layoutMode: 'STANDARD',
      themeColor: 'cyan',
      aiPersona: 'ANALYTICAL',
      generation: 5,
      reasoningMode: 'AUTO'
  });

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
        if (savedDNA) setSystemDNA(JSON.parse(savedDNA));
        
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

  // --- DEMO MODE (JUDGE FRIENDLY & SCREENSHOT READY) ---
  const handleEnableDemoMode = () => {
      console.log("Entering Demo Mode...");
      setIsDriveConnected(true);
      setIsSwarmActive(true);
      setSwarmMemoryStatus("Demo / Simulation Mode");
      setSwarmVectorCount(12048);
      
      // 1. Inject Fake Memories for Graph Visualization (Right Panel)
      orchestrator.store('WORLD_KNOWLEDGE', 'Gemini 2.0 Flash Exp is the primary reasoning engine for ZIA.', 'DemoLoader');
      orchestrator.store('WORLD_KNOWLEDGE', 'MuVERA FDE allows O(1) retrieval of vector embeddings via simple bitwise operations.', 'DemoLoader');
      orchestrator.store('WORLD_KNOWLEDGE', 'Sovereign AI Architecture minimizes dependency on centralized cloud providers.', 'DemoLoader');
      orchestrator.store('IDENTITY', 'ZIA Core Protocol v10.9 Online.', 'System');
      orchestrator.store('USER_CONTEXT', 'User requested system diagnostic visualization.', 'User');
      
      setMemoryStats(orchestrator.getStats());
      
      // 2. Chat Log
      setMessages(prev => [
          ...prev, 
          { id: 'demo1', role: 'system', text: '⚡ **DEMO MODE ACTIVATED**\n- Swarm Bridge: Simulated\n- Vector DB: 12,048 Records (Mock)\n- Logic Core: Gemini 2.0 Flash Exp', timestamp: new Date() },
          { id: 'demo2', role: 'model', text: 'System ready. I have generated a **Real-time Diagnostic Dashboard** to visualize my internal Holon state. You can capture this for your records.', timestamp: new Date() }
      ]);

      // 3. Inject Visual Artifact (Perfect for Thumbnail)
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
                <div class="space-y-2 relative z-10">
                    <div class="flex justify-between text-xs border-b border-cyan-900 pb-1"><span>VECTOR COUNT</span><span class="text-white">12,048</span></div>
                    <div class="flex justify-between text-xs border-b border-cyan-900 pb-1"><span>SYNC STATUS</span><span class="text-green-400">100%</span></div>
                    <div class="flex justify-between text-xs border-b border-cyan-900 pb-1"><span>DIMENSION</span><span class="text-white">768</span></div>
                </div>
            </div>
            
            <div class="bg-purple-900/10 border border-purple-800 p-4 rounded-lg">
                <h2 class="text-sm font-bold text-slate-400 mb-2">COMPUTE SWARM</h2>
                <div class="space-y-2">
                     <div class="bg-slate-900 p-2 rounded border border-slate-800 flex items-center">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span class="text-xs flex-1">COLAB WORKER #1</span>
                        <span class="text-xs text-slate-500">IDLE</span>
                     </div>
                     <div class="bg-slate-900 p-2 rounded border border-slate-800 flex items-center">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        <span class="text-xs flex-1">LOCAL GPU</span>
                        <span class="text-xs text-slate-500">CONN...</span>
                     </div>
                </div>
            </div>
            
            <div class="col-span-2 bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                 <div class="text-4xl mb-2">🧠</div>
                 <div class="text-lg font-bold text-white">GEMINI 2.0 FLASH EXP</div>
                 <div class="text-xs text-slate-500 mt-1">PRIMARY REASONING CORE ACTIVE</div>
                 <div class="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-cyan-500 to-purple-500 w-2/3 h-full animate-[shimmer_2s_infinite]"></div>
                 </div>
            </div>
        </div>
      </body>
      </html>
      `;
      
      setVisualArtifact({ html: demoHtml });
      setShowCanvas(true);
  };

  // --- SWARM MONITORING & RESULT POLLING ---
  useEffect(() => {
      let interval: any;
      if (isDriveConnected) {
          interval = setInterval(async () => {
              // Bypass checks if in Demo/Simulated mode
              if (swarmMemoryStatus.includes('Demo')) {
                  setSwarmLastPulse(Date.now());
                  return;
              }

              if (!driveBridge.getStatus().isAuthenticated) {
                   setIsDriveConnected(false); setIsSwarmActive(false); return;
              }

              try {
                  // Status Check
                  const statusFiles = await driveBridge.searchFiles("name = 'swarm_status.json' and trashed=false");
                  if (statusFiles.length > 0) {
                      const statusData = await driveBridge.getFileContent(statusFiles[0].id);
                      if (!isSwarmActive) setIsSwarmActive(true);
                      setSwarmVectorCount(statusData.memory_count || 0);
                      setSwarmLastPulse(Date.now());
                      setSwarmMemoryStatus("Active (Colab Connected)");
                  } else {
                      if (Date.now() - swarmLastPulse > 8000) { 
                          setIsSwarmActive(false); setSwarmMemoryStatus("Offline (Check Colab)");
                      }
                  }
                  
                  // Result Polling
                  const files = await driveBridge.searchFiles("name contains 'res_' and trashed=false");
                  for (const file of files) {
                      const content = await driveBridge.getFileContent(file.id);
                      await driveBridge.deleteFile(file.id);
                      
                      // 1. Python Execution Result
                      if (file.name === 'res_python_exec.json') {
                         if (content.status === 'error') {
                            const errorMsg = `[SWARM ERROR]:\n${content.error}`;
                            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: errorMsg, timestamp: new Date(), metadata: { swarmResult: true } }]);
                            speak("Swarm execution failed.");
                         } else {
                             const output = content.output || {};
                             let resultText = `[EXECUTION RESULT]:\n${output.stdout || ''}\n${output.stderr || ''}`;
                             if (output.image) resultText += "\n[SYSTEM]: An image was generated and displayed on the Artifact Canvas.";
                             if (output.html) resultText += "\n[SYSTEM]: An HTML artifact was generated.";

                             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: resultText, timestamp: new Date(), metadata: { swarmResult: true } }]);
                             
                             if (output.image || output.html) {
                                 setVisualArtifact({ image: output.image, html: output.html });
                                 setShowCanvas(true);
                                 speak("Visual artifact generated.");
                             }
                         }
                      } 
                      // 2. Memory Recall Result
                      else if (file.name === 'res_query_memory.json') {
                          const docs = content.documents || [];
                          if (docs.length > 0) {
                              const memoryText = docs.map((d: string, i: number) => `[SWARM MEMORY #${i+1}]: ${d}`).join('\n');
                              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🧠 **Swarm Recall:**\n${memoryText}`, timestamp: new Date(), metadata: { swarmResult: true } }]);
                              speak("Swarm memory retrieved.");
                          } else {
                              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SWARM]: No relevant memories found in Vector DB.`, timestamp: new Date(), metadata: { swarmResult: true } }]);
                          }
                      }
                      // 3. n8n Proxy Result
                      else if (file.name === 'res_n8n_proxy.json') {
                          const resText = `[N8N RESULT]: Status ${content.n8n_status}\n${content.response ? JSON.stringify(content.response).substring(0, 500) : ''}`;
                          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: resText, timestamp: new Date(), metadata: { swarmResult: true } }]);
                      }
                      // 4. Remote Tunnel
                      else if (file.name === 'res_app_url.json') {
                          setRemoteUrl(content.url);
                          setShowRemoteDesktop(true);
                          speak("Remote tunnel established.");
                      }
                  }
              } catch (e: any) { 
                  if (e.message && e.message.includes('401')) {
                      setIsDriveConnected(false); setIsSwarmActive(false);
                  }
              }
          }, 2000); 
      }
      return () => clearInterval(interval);
  }, [isDriveConnected, swarmLastPulse, isSwarmActive, swarmMemoryStatus]);


  // --- MAIN INTERACTION LOGIC ---
  const handleSendMessage = async (text: string, attachment?: { mimeType: string; data: string }, onRequestKey?: () => void) => {
    if (!apiKey && !baseUrl) { onRequestKey && onRequestKey(); alert("BRAIN MISSING: Please check Settings."); return; }
    
    // Distinguish System Trigger vs User Message
    const isSystemTrigger = text.startsWith('[SYSTEM_TRIGGER]');
    
    if (!isSystemTrigger) {
        const userMsg: Message = { 
            id: Date.now().toString(), role: 'user', text: attachment ? `[IMAGE ATTACHED] ${text}` : text, timestamp: new Date() 
        };
        setMessages(prev => [...prev, userMsg]);
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
                history: messages.slice(-15), // Extended Context
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

        // Visuals
        if (result.visualArtifact) {
            setVisualArtifact(result.visualArtifact);
            setShowCanvas(true);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🛠️ [MICRO-APP GENERATED]`, timestamp: new Date() }]);
        }

        // Command Handling
        if (result.swarmCommand) {
            // [DEMO MODE INTERCEPT]
            if (swarmMemoryStatus.includes('Demo')) {
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(), 
                    role: 'system', 
                    text: `[SIMULATION] Swarm Command Intercepted: ${result.swarmCommand?.type}\n(In Demo Mode, actual execution is skipped to prevent errors.)`, 
                    timestamp: new Date() 
                }]);
                setIsThinking(false);
                setMemoryStats(orchestrator.getStats());
                return;
            }

            const cmdType = result.swarmCommand.type;
            const payload = result.swarmCommand.payload;
            if (!payload.id) payload.id = Date.now().toString();

            // [LOCAL EXECUTION] Drive List/Read (No need for Colab)
            if (cmdType === 'req_drive_list') {
                if (isDriveConnected) {
                    setTaskLog(prev => [...prev, { id: Date.now().toString(), stage: 'SWARM', status: 'processing', message: `Scanning Drive for '${payload.query}'...`, timestamp: Date.now() }]);
                    try {
                        const files = await driveBridge.globalSearch(payload.query);
                        const fileList = files.length > 0 
                            ? files.map((f: any) => `- ${f.name} (ID: ${f.id})`).join('\n')
                            : "No files found.";
                        
                        const sysMsg = `[DRIVE SEARCH RESULT]:\n${fileList}`;
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: sysMsg, timestamp: new Date() }]);
                    } catch (e: any) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[DRIVE ERROR]: ${e.message}`, timestamp: new Date() }]);
                    }
                } else {
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚠️ Drive not connected.", timestamp: new Date() }]);
                }
            }
            else if (cmdType === 'req_drive_read') {
                 if (isDriveConnected) {
                    setTaskLog(prev => [...prev, { id: Date.now().toString(), stage: 'SWARM', status: 'processing', message: `Reading File ID ${payload.file_id}...`, timestamp: Date.now() }]);
                    try {
                        const content = await driveBridge.readTextFile(payload.file_id);
                        const sysMsg = `[FILE CONTENT]:\n${content.substring(0, 2000)}${content.length > 2000 ? '...(truncated)' : ''}`;
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: sysMsg, timestamp: new Date() }]);
                    } catch (e: any) {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[READ ERROR]: ${e.message}`, timestamp: new Date() }]);
                    }
                 }
            }
            // [REMOTE EXECUTION] Python/Git (Send to Colab)
            else {
                if (isDriveConnected) {
                    const filename = `${cmdType}_${payload.id}.json`;
                    driveBridge.saveFile(filename, payload).then(() => {
                        setTaskLog(prev => [...prev, { id: Date.now().toString(), stage: 'SWARM', status: 'processing', message: `Dispatched ${cmdType} to Neural Grid...`, timestamp: Date.now() }]);
                        speak("Executing on Swarm.");
                    }).catch(e => {
                         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SWARM DISPATCH ERROR]: ${e.message}`, timestamp: new Date() }]);
                    });
                } else {
                     setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `⚠️ [SYSTEM]: Cannot execute ${cmdType} - Swarm Disconnected.`, timestamp: new Date() }]);
                     speak("Swarm disconnected.");
                }
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

        // Auto-Memory Store
        if (result.responseText && result.responseText.length > 50) {
            orchestrator.store('USER_CONTEXT', result.responseText, 'ZIA Response');
        }

    } catch (e: any) {
        let errorMsg = e.message || String(e);
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Quota')) {
            const suggestion = `⚠️ **API Rate Limit Exceeded (429)**\n\nThe brain is tired. Your API quota is exhausted.\n\n**SUGGESTED ACTIONS:**\n1. Switch to **Gemini 2.5 Flash** (Higher limits).\n2. Wait 60 seconds and try again.\n3. Check your billing at AI Studio.`;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: suggestion, timestamp: new Date() }]);
            speak("System overload. Please standby.");
        } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `Critical Error: ${errorMsg}`, timestamp: new Date() }]);
        }
    } finally {
        setIsThinking(false);
        setMemoryStats(orchestrator.getStats());
    }
  };

  // [MULTI-TURN AUTOMATION]
  // Auto-trigger Agent when a Swarm Result arrives
  useEffect(() => {
      if (messages.length === 0 || isThinking) return;
      
      const lastMsg = messages[messages.length - 1];
      
      // If last message is a Swarm Result, trigger interpretation
      if (lastMsg.role === 'system' && lastMsg.metadata?.swarmResult) {
          const timer = setTimeout(() => {
              handleSendMessage('[SYSTEM_TRIGGER] Swarm Task Completed. Analyze the result and continue.', undefined);
          }, 800);
          return () => clearTimeout(timer);
      }
  }, [messages, isThinking]);

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
    handleEnableDemoMode // Export new handler
  };
};
