
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { system_instruction_augmentation } from '../01_SOUL/knowledge_archive';
import { orchestrator, MemoryType } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../03_NERVES/drive_bridge';
import { Message, GraphNode, UserEnvironment, SystemDNA } from '../types';

const detectSystemEnv = (): UserEnvironment => {
  try {
    const userAgent = navigator.userAgent;
    let os = 'Unknown';
    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    else if (userAgent.indexOf("Mac") !== -1) os = "Mac";
    else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    return { os, language: navigator.language || 'en-US', isLegacyPathRisk: os === 'Windows' && navigator.language.startsWith('ko') };
  } catch (e) { return { os: 'Unknown', language: 'en-US', isLegacyPathRisk: false }; }
};

export const useZiaOS = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  
  // Auth State
  const [apiKey, setApiKey] = useState<string>('');
  
  // Layout States
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);
  const [visualArtifact, setVisualArtifact] = useState<{image?: string, html?: string} | undefined>(undefined);
  
  // Core Systems
  const [memoryStats, setMemoryStats] = useState(orchestrator.getStats());
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  
  // Remote Desktop State
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false);
  
  // SWARM STATE
  const [swarmMemoryStatus, setSwarmMemoryStatus] = useState<string>('Connecting...');
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [swarmVectorCount, setSwarmVectorCount] = useState<number>(0);
  const [swarmLastPulse, setSwarmLastPulse] = useState<number>(0);

  // System DNA
  const [systemDNA, setSystemDNA] = useState<SystemDNA>({
      layoutMode: 'STANDARD',
      themeColor: 'cyan',
      aiPersona: 'ANALYTICAL',
      generation: 2
  });

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: 'input', label: 'Input Signal', status: 'idle' },
    { id: 'refiner', label: 'Intent Refiner', status: 'idle' },
    { id: 'swarm', label: 'Swarm Compute', status: 'idle' },
    { id: 'orchestrator', label: 'Orchestrator', status: 'idle' },
    { id: 'response', label: 'Core Response', status: 'idle' }
  ]);
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  const userEnv = useRef(detectSystemEnv()).current;
  const autoSaveTimer = useRef<any>(null);

  // 1. INIT
  useEffect(() => {
    try {
        const savedMessages = localStorage.getItem('ZIA_CHAT_LOG');
        if (savedMessages) setMessages(JSON.parse(savedMessages, (key, value) => key === 'timestamp' ? new Date(value) : value));
        const savedDNA = localStorage.getItem('ZIA_SYSTEM_DNA');
        if (savedDNA) setSystemDNA(JSON.parse(savedDNA));
        const savedApiKey = localStorage.getItem('ZIA_GEMINI_API_KEY');
        if (savedApiKey) setApiKey(savedApiKey);
        setMemoryStats(orchestrator.getStats());
    } catch (e) { console.error("Restore failed:", e); }
  }, []);

  // 2. AUTO-SAVE & SYNC
  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('ZIA_CHAT_LOG', JSON.stringify(messages));
    if (isDriveConnected && messages.length > 0) {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            const memSnapshot = orchestrator.snapshot();
            const soulPacket = { messages: messages, memory: memSnapshot, timestamp: Date.now(), dna: systemDNA, env: userEnv };
            driveBridge.saveFile('zia_soul_backup.json', soulPacket).catch(e => console.warn("Auto-sync failed", e));
        }, 15000); 
    }
    localStorage.setItem('ZIA_SYSTEM_DNA', JSON.stringify(systemDNA));
    if (apiKey) localStorage.setItem('ZIA_GEMINI_API_KEY', apiKey);
    return () => { if(autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [messages, systemDNA, apiKey, isDriveConnected]);

  // 3. SWARM POLLING
  useEffect(() => {
      let interval: any;
      if (isDriveConnected) {
          interval = setInterval(async () => {
              try {
                  const statusFiles = await driveBridge.searchFiles("name = 'swarm_status.json' and trashed=false");
                  if (statusFiles.length > 0) {
                      const statusData = await driveBridge.getFileContent(statusFiles[0].id);
                      if (!isSwarmActive) setIsSwarmActive(true);
                      setSwarmVectorCount(statusData.memory_count || 0);
                      setSwarmLastPulse(Date.now());
                      setSwarmMemoryStatus("Active (Colab Connected)");
                  } else {
                      if (Date.now() - swarmLastPulse > 8000) { 
                          setIsSwarmActive(false);
                          setSwarmMemoryStatus("Offline (Check Colab)");
                      }
                  }
                  // Response Polling
                  const files = await driveBridge.searchFiles("name contains 'res_' and trashed=false");
                  for (const file of files) {
                      const content = await driveBridge.getFileContent(file.id);
                      await driveBridge.deleteFile(file.id);
                      
                      if (file.name === 'res_python_exec.json') {
                         if (content.status === 'error') {
                            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SWARM ERROR]:\n${content.error}`, timestamp: new Date() }]);
                         } else {
                             const output = content.output || {};
                             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[EXECUTION RESULT]:\n${output.stdout || ''}\n${output.stderr || ''}`, timestamp: new Date() }]);
                             if (output.image || output.html) {
                                 setVisualArtifact({ image: output.image, html: output.html });
                                 setShowCanvas(true);
                             }
                         }
                      } else if (file.name === 'res_app_url.json') {
                          setRemoteUrl(content.url);
                          setShowRemoteDesktop(true);
                      } else {
                         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[SWARM]: ${JSON.stringify(content)}`, timestamp: new Date() }]);
                      }
                  }
              } catch (e) { }
          }, 2000); 
      }
      return () => clearInterval(interval);
  }, [isDriveConnected, swarmLastPulse, isSwarmActive]);

  const handleCloudBackup = async () => {
    if(!isDriveConnected) { alert("Connect Drive first."); return; }
    const memSnapshot = orchestrator.snapshot();
    const soulPacket = { messages, memory: memSnapshot, timestamp: Date.now(), dna: systemDNA, env: userEnv };
    await driveBridge.saveFile('zia_soul_backup.json', soulPacket);
  };

  const handleCloudRestore = async (): Promise<boolean> => {
    if(!isDriveConnected) { alert("Connect Drive first."); return false; }
    try {
        const files = await driveBridge.searchFiles("name = 'zia_soul_backup.json' and trashed=false");
        if (files.length === 0) return false;
        const soulData = await driveBridge.getFileContent(files[0].id);
        if (soulData.messages) setMessages(soulData.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})));
        if (soulData.memory) { orchestrator.restore(soulData.memory); setMemoryStats(orchestrator.getStats()); }
        return true;
    } catch(e) { console.error(e); return false; }
  };

  const testBrainConnection = async (key: string): Promise<string> => {
      try {
          const ai = new GoogleGenAI({ apiKey: key });
          await ai.models.countTokens({
            model: 'gemini-2.5-flash',
            contents: "ping",
          });
          return "SUCCESS";
      } catch (e: any) {
          return e.message || "Unknown Error";
      }
  };

  const handleSendMessage = async (text: string, onRequestKey: () => void) => {
    if (!apiKey) { onRequestKey(); alert("BRAIN MISSING: Please enter your Gemini API Key."); return; }
    
    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    
    // 2. Orchestration
    setGraphNodes(prev => prev.map(n => n.id === 'orchestrator' ? { ...n, status: 'active' } : n));
    const sectors = await orchestrator.routeQuery(text);
    setActiveSectors(sectors);
    orchestrator.store('USER_CONTEXT', text, 'User Input');
    const context = orchestrator.retrieveRelatedMemories(text); 
    setMemoryStats(orchestrator.getStats());

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const generate = async (retry: boolean = false) => {
             const chat = ai.chats.create({ 
                model: 'gemini-2.5-flash', 
                config: { 
                    systemInstruction: system_instruction_augmentation, 
                    temperature: 0.9, 
                    topP: 0.95 
                } 
            });
            
            // On retry, simplify prompt to avoid 500
            let prompt = retry ? text : (context ? `[CONTEXT]: ${context}\n\n[USER]: ${text}` : text);
            if (retry) prompt = `[SYSTEM]: Retry mode. Short answer only.\n\n${text}`;

            return await chat.sendMessage({ message: prompt });
        };

        let result;
        try {
            result = await generate(false);
        } catch (e: any) {
            // RETRY LOGIC for 500 or 503
            if (e.message?.includes('500') || e.message?.includes('503')) {
                console.warn("API 500 Error. Retrying with simplified prompt...");
                result = await generate(true);
            } else {
                throw e;
            }
        }
        
        const responseText = result.text;
        
        // Command Parsing
        const jsonRegex = /\{[\s\S]*?\}/g; 
        const matches = responseText.match(jsonRegex) || [];
        for (const match of matches) {
            try {
                const cmd = JSON.parse(match);
                if (cmd.req_python_exec) {
                    let code = cmd.req_python_exec.code || cmd.req_python_exec;
                    await driveBridge.saveFile('req_python_exec.json', { code, return_image: true, id: Date.now().toString() });
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚡ [SWARM] Executing Code...", timestamp: new Date() }]);
                } else if (cmd.req_git_clone) {
                    await driveBridge.saveFile('req_git_clone.json', { ...cmd.req_git_clone, id: Date.now().toString() });
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚡ [SWARM] Cloning Repo...", timestamp: new Date() }]);
                }
            } catch(e) {}
        }

        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text: responseText, timestamp: new Date() }]);

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `Error: ${e.message}`, timestamp: new Date() }]);
    } finally {
        setGraphNodes(prev => prev.map(n => ({ ...n, status: 'idle' })));
        setIsThinking(false);
    }
  };

  return {
    messages, setMessages, isThinking,
    apiKey, setApiKey,
    showCanvas, setShowCanvas, canvasContent, setCanvasContent, visualArtifact,
    memoryStats, setMemoryStats,
    isDriveConnected, setIsDriveConnected,
    remoteUrl, showRemoteDesktop, setShowRemoteDesktop,
    swarmMemoryStatus, isSwarmActive, swarmVectorCount,
    graphNodes, activeSectors,
    handleCloudBackup, handleCloudRestore, testBrainConnection, handleSendMessage
  };
};
