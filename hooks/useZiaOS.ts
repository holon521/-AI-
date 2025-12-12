
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { system_instruction_augmentation } from '../01_SOUL/knowledge_archive';
import { orchestrator, MemoryType } from '../02_CORTEX/memory_orchestrator';
import { driveBridge } from '../03_NERVES/drive_bridge';
import { Message, GraphNode, UserEnvironment, SystemDNA } from '../types';

// [INTENT ROUTER SYSTEM PROMPT]
const ROUTER_INSTRUCTION = `
You are the KERNEL ROUTER of the ZIA OS.
Your job is NOT to answer the user, but to ANALYZE the intent and route it to the correct subsystem.

Input: User's latest message + Recent Context.
Output: A JSON object defining the required operation.

Valid Operations:
1. "APP_GENERATION": User wants a visual tool, calculator, game, or interactive simulation. (Route to req_render_app).
2. "UI_ADAPTATION": User wants to change look/feel/theme.
3. "MEMORY_SEARCH": User asks about past events/knowledge.
4. "CODE_EXECUTION": Heavy Math, Python analysis, Data Science.
5. "FILE_SYSTEM": Drive search/read.
6. "CASUAL_CHAT": Greetings.
7. "IMAGE_ANALYSIS": User uploaded an image or asks about visual data.

Response Schema (JSON):
{
  "intent": "APP_GENERATION" | "UI_ADAPTATION" | "MEMORY_SEARCH" | "CODE_EXECUTION" | "FILE_SYSTEM" | "CASUAL_CHAT" | "IMAGE_ANALYSIS",
  "reasoning": "Brief explanation.",
  "search_query": "String for memory or file search",
  "requires_swarm": boolean
}
`;

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
  
  // Auth & Config State
  const [apiKey, setApiKey] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-flash');
  const [isMuted, setIsMuted] = useState(false); // Voice Control
  
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

  // System DNA (Mutable Self)
  const [systemDNA, setSystemDNA] = useState<SystemDNA>({
      layoutMode: 'STANDARD',
      themeColor: 'cyan',
      aiPersona: 'ANALYTICAL',
      generation: 4 // Gen 4: Sandboxed Autonomy
  });

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: 'input', label: 'Input Signal', status: 'idle' },
    { id: 'router', label: 'Intent Router', status: 'idle' }, 
    { id: 'memory', label: 'Memory Core', status: 'idle' },   
    { id: 'swarm', label: 'Swarm Compute', status: 'idle' },
    { id: 'response', label: 'Core Response', status: 'idle' }
  ]);
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  const userEnv = useRef(detectSystemEnv()).current;
  const autoSaveTimer = useRef<any>(null);

  // --- AUDIO ENGINE (TTS) ---
  const speak = (text: string) => {
      if (isMuted || !window.speechSynthesis) return;
      
      // Cleanup text (remove code blocks, markdown)
      const cleanText = text.replace(/```[\s\S]*?```/g, "Code Block Generated.")
                            .replace(/\[.*?\]/g, "")
                            .substring(0, 200); // Limit length for sanity
                            
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const korVoice = voices.find(v => v.lang.includes('ko'));
      if (korVoice) utterance.voice = korVoice;
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      window.speechSynthesis.cancel(); // Stop previous
      window.speechSynthesis.speak(utterance);
  };

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
        
        // Pre-load voices
        window.speechSynthesis.getVoices();
    } catch (e) { console.error("Restore failed:", e); }
  }, []);

  // 2. AUTO-SAVE & SYNC & DREAMING
  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('ZIA_CHAT_LOG', JSON.stringify(messages));
    
    // Auto-Save to Drive
    if (isDriveConnected && messages.length > 0) {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => {
            const memSnapshot = orchestrator.snapshot();
            const soulPacket = { messages: messages, memory: memSnapshot, timestamp: Date.now(), dna: systemDNA, env: userEnv };
            driveBridge.saveFile('zia_soul_backup.json', soulPacket).catch(e => console.warn("Auto-sync failed", e));
            
            // [DREAMING] If idle for 15s, try to consolidate memory
            if (isSwarmActive) {
                // Future: Send dream request to Colab
                // console.log("Dreaming...");
            }
        }, 15000); 
    }
    localStorage.setItem('ZIA_SYSTEM_DNA', JSON.stringify(systemDNA));
    if (apiKey) localStorage.setItem('ZIA_GEMINI_API_KEY', apiKey);
    return () => { if(autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [messages, systemDNA, apiKey, isDriveConnected, isSwarmActive]);

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
                            const errorMsg = `[SWARM ERROR]:\n${content.error}`;
                            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: errorMsg, timestamp: new Date() }]);
                            speak("Swarm execution failed.");
                         } else {
                             const output = content.output || {};
                             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `[EXECUTION RESULT]:\n${output.stdout || ''}\n${output.stderr || ''}`, timestamp: new Date() }]);
                             if (output.image || output.html) {
                                 setVisualArtifact({ image: output.image, html: output.html });
                                 setShowCanvas(true);
                                 speak("Visual artifact generated.");
                             }
                         }
                      } else if (file.name === 'res_app_url.json') {
                          setRemoteUrl(content.url);
                          setShowRemoteDesktop(true);
                          speak("Remote tunnel established.");
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
        speak("Resurrection complete. Welcome back.");
        return true;
    } catch(e) { console.error(e); return false; }
  };

  const testBrainConnection = async (key: string): Promise<string> => {
      try {
          const ai = new GoogleGenAI({ apiKey: key });
          await ai.models.countTokens({ model: activeModel, contents: "ping" });
          speak("Brain connection verified.");
          return "SUCCESS";
      } catch (e: any) { return e.message || "Unknown Error"; }
  };
  
  const generateEmbedding = async (ai: GoogleGenAI, text: string): Promise<number[] | undefined> => {
      try {
          const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
          });
          return result.embeddings?.[0]?.values;
      } catch (e) {
          console.warn("Embedding generation failed:", e);
          return undefined;
      }
  };

  // --- AGENTIC CORE WORKFLOW ---
  // [v10.2 Update] Now accepts 'attachment' for Multimodal input
  const handleSendMessage = async (text: string, attachment?: { mimeType: string; data: string }, onRequestKey?: () => void) => {
    if (!apiKey) { onRequestKey && onRequestKey(); alert("BRAIN MISSING: Please enter your Gemini API Key."); return; }
    
    // 0. Update UI
    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: attachment ? `[IMAGE ATTACHED] ${text}` : text, 
        timestamp: new Date(),
        metadata: attachment ? { harvested: true } : undefined 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 0b. Store User Input (Only Text for now, Vision is ephemeral context)
    if (text) {
        generateEmbedding(ai, text).then(vec => {
            orchestrator.store('USER_CONTEXT', text, 'User Input', vec);
            setMemoryStats(orchestrator.getStats());
        });
    }

    try {
        // --- STEP 1: THE ROUTER ---
        setGraphNodes(prev => prev.map(n => n.id === 'router' ? { ...n, status: 'active' } : { ...n, status: 'idle' }));
        
        // If image attached, bypass router text analysis and force Image Analysis intent
        let intentData = { intent: attachment ? 'IMAGE_ANALYSIS' : 'CASUAL_CHAT', search_query: text, requires_swarm: false, reasoning: '' };
        
        if (!attachment) {
            try {
                const routerRes = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: text,
                    config: { systemInstruction: ROUTER_INSTRUCTION, responseMimeType: "application/json" }
                });
                if (routerRes.text) intentData = JSON.parse(routerRes.text);
            } catch(e) { console.warn("Router failed", e); }
        }

        // --- STEP 2: THE EXECUTOR ---
        setGraphNodes(prev => prev.map(n => n.id === 'router' ? { ...n, status: 'completed' } : n));
        
        let contextBlock = "";
        let memoryStatus: 'idle' | 'active' = 'idle';
        let swarmStatus: 'idle' | 'active' = 'idle';

        // 2a. Memory Retrieval
        if (intentData.intent === 'MEMORY_SEARCH' || intentData.intent === 'FILE_SYSTEM') {
            memoryStatus = 'active';
            setGraphNodes(prev => prev.map(n => n.id === 'memory' ? { ...n, status: 'active' } : n));
            
            const searchQ = intentData.search_query || text;
            const queryVec = await generateEmbedding(ai, searchQ);
            const memories = orchestrator.computeSystemAttention(searchQ, queryVec);
            
            if (memories) contextBlock += `\n[📚 RECALLED MEMORY]:\n${memories}\n`;
        }
        
        // 2b. Current State Injection
        contextBlock += `\n[SYSTEM DNA]: Mode=${systemDNA.layoutMode}, Theme=${systemDNA.themeColor}\n`;

        // 2c. Swarm Prep
        if (intentData.intent === 'CODE_EXECUTION' || intentData.requires_swarm) {
            swarmStatus = 'active';
            setGraphNodes(prev => prev.map(n => n.id === 'swarm' ? { ...n, status: 'active' } : n));
            contextBlock += `\n[⚡ SWARM INSTRUCTION]: The user needs CODE EXECUTION. Generate 'req_python_exec' JSON.\n`;
        }
        
        // --- STEP 3: THE SPEAKER ---
        setGraphNodes(prev => prev.map(n => {
            if (n.id === 'memory') return { ...n, status: memoryStatus === 'active' ? 'completed' : 'idle' };
            if (n.id === 'swarm') return { ...n, status: swarmStatus === 'active' ? 'completed' : 'idle' };
            if (n.id === 'response') return { ...n, status: 'active' };
            return n;
        }));

        const chat = ai.chats.create({ 
            model: activeModel, 
            config: { systemInstruction: system_instruction_augmentation, temperature: 0.7 } 
        });

        const metaPrompt = `[ROUTER DECISION]: ${JSON.stringify(intentData)}\n${contextBlock}\n[USER MESSAGE]:\n${text}`;
        
        // Construct Payload
        let responseText = "";
        if (attachment) {
            // Multimodal Request
            const result = await ai.models.generateContent({
                model: activeModel,
                contents: {
                    parts: [
                        { inlineData: { mimeType: attachment.mimeType, data: attachment.data } },
                        { text: metaPrompt }
                    ]
                },
                config: { systemInstruction: system_instruction_augmentation }
            });
            responseText = result.text || "";
        } else {
            // Text-only Chat
            const result = await chat.sendMessage({ message: metaPrompt });
            responseText = result.text;
        }

        // --- STEP 4: TOOL EXECUTION (Client-Side OS Actions) ---
        const jsonRegex = /\{[\s\S]*?\}/g; 
        const matches = responseText?.match(jsonRegex) || [];
        for (const match of matches) {
            try {
                const cmd = JSON.parse(match);
                // 4a. Swarm Tools
                if (cmd.req_python_exec) {
                    let code = cmd.req_python_exec.code || cmd.req_python_exec;
                    await driveBridge.saveFile('req_python_exec.json', { code, return_image: true, id: Date.now().toString() });
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚡ [SWARM] Executing Code...", timestamp: new Date() }]);
                    speak("Executing code on Swarm.");
                } 
                else if (cmd.req_git_clone) {
                    await driveBridge.saveFile('req_git_clone.json', { ...cmd.req_git_clone, id: Date.now().toString() });
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "⚡ [SWARM] Cloning Repo...", timestamp: new Date() }]);
                }
                // 4b. File System Tools
                else if (cmd.req_drive_list) {
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `📂 Searching Drive for '${cmd.req_drive_list.query}'...`, timestamp: new Date() }]);
                    const files = await driveBridge.globalSearch(cmd.req_drive_list.query, cmd.req_drive_list.limit || 5);
                    const fileListStr = files.map((f:any) => `- [${f.name}] (ID: ${f.id})`).join('\n');
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `[FILE SYSTEM RESULTS]:\n${fileListStr || "No files found."}`, timestamp: new Date() }]);
                }
                else if (cmd.req_drive_read) {
                     setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `📖 Reading File (ID: ${cmd.req_drive_read.file_id})...`, timestamp: new Date() }]);
                     const content = await driveBridge.readTextFile(cmd.req_drive_read.file_id);
                     orchestrator.store('USER_CONTEXT', `[READ FILE CONTENT]: ${content.substring(0, 500)}...`, 'FileRead');
                     setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `[FILE CONTENT PREVIEW]:\n${content.substring(0, 300)}...\n(Full content loaded into memory context)`, timestamp: new Date() }]);
                }
                // 4c. App Generation (The "Untied Hand")
                else if (cmd.req_render_app) {
                    const { title, html, description } = cmd.req_render_app;
                    setVisualArtifact({ html: html });
                    setShowCanvas(true);
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🛠️ [MICRO-APP]: Generating "${title}" in Sandbox...`, timestamp: new Date() }]);
                    speak(`Generating ${title}.`);
                }
                // 4d. UI Mutation
                else if (cmd.req_ui_change) {
                    const { mode, theme } = cmd.req_ui_change;
                    setSystemDNA(prev => ({
                        ...prev,
                        layoutMode: mode || prev.layoutMode,
                        themeColor: theme || prev.themeColor
                    }));
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `🧬 [AUTOPOIESIS]: Mutating Interface to ${mode || 'CURRENT'} / ${theme || 'CURRENT'}`, timestamp: new Date() }]);
                }
            } catch(e) {}
        }

        if (responseText) {
            setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'model', text: responseText, timestamp: new Date() }]);
            speak(responseText);
        }

    } catch (e: any) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `Error: ${e.message}`, timestamp: new Date() }]);
        speak("An error occurred.");
    } finally {
        setGraphNodes(prev => prev.map(n => ({ ...n, status: 'idle' })));
        setIsThinking(false);
        setMemoryStats(orchestrator.getStats());
    }
  };

  // [v2.2] New Signal Handler for Fractal Sandbox
  const handleArtifactSignal = (type: string, payload: any) => {
      switch(type) {
          case 'ZIA_SAY':
              setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'user', 
                  text: `[FROM MICRO-APP]: ${payload.text}`, 
                  timestamp: new Date() 
              }]);
              handleSendMessage(`[SYSTEM]: Micro-App sent signal: "${payload.text}". Respond accordingly.`);
              break;
          case 'ZIA_SAVE':
              orchestrator.store('USER_CONTEXT', JSON.stringify(payload.value), `Micro-App: ${payload.key}`);
              setMemoryStats(orchestrator.getStats());
              setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'system', 
                  text: `💾 [MEMORY]: Saved data from App [${payload.key}]`, 
                  timestamp: new Date() 
              }]);
              break;
          case 'ZIA_COMPUTE':
              handleSendMessage(`[SYSTEM]: Micro-App requested execution. Code:\n${payload.code}`, undefined);
              break;
      }
  };

  return {
    messages, setMessages, isThinking,
    apiKey, setApiKey, activeModel, setActiveModel, isMuted, setIsMuted, // Voice
    showCanvas, setShowCanvas, canvasContent, setCanvasContent, visualArtifact,
    memoryStats, setMemoryStats,
    isDriveConnected, setIsDriveConnected,
    remoteUrl, showRemoteDesktop, setShowRemoteDesktop,
    swarmMemoryStatus, isSwarmActive, swarmVectorCount,
    graphNodes, activeSectors,
    systemDNA, setSystemDNA, 
    handleCloudBackup, handleCloudRestore, testBrainConnection, handleSendMessage,
    handleArtifactSignal 
  };
};
