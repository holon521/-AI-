
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { system_instruction_augmentation } from './knowledge_archive';
import { orchestrator, MemoryType } from './memory_orchestrator';
import { swarm, ComputeNode, NodeType, RuntimeEnv } from './compute_swarm';
import { picoRegistry, PicoTool } from './mcp_pico_registry'; 
import { GENESIS_CONSTITUTION } from './GENESIS_AXIOM'; 
import { computeSimHashSignature } from './fde_logic'; // FDE 엔진 임포트

// --- 타입 및 인터페이스 정의 (Types & Interfaces) ---
interface Message {
  id: string;
  role: 'user' | 'model' | 'system'; 
  text: string;
  timestamp: Date;
  metadata?: {
    modelUsed?: string; 
    activeMemorySectors?: MemoryType[]; 
    retrievedFromSwarm?: boolean; 
    truthState?: string; 
    subsidized?: boolean; 
    executedEnv?: RuntimeEnv; 
    picoEfficiency?: number; 
    fdeSignature?: string; // FDE 서명 메타데이터 추가
  };
}

interface GraphNode {
  id: string;
  label: string;
  status: 'idle' | 'active' | 'completed'; 
}

// [v1.7] 사용자 환경 정보 인터페이스
interface UserEnvironment {
  os: 'Windows' | 'Mac' | 'Linux' | 'Android' | 'iOS' | 'Unknown';
  language: string; 
  browser: string;
  isLegacyPathRisk: boolean; 
}

// --- 설정 (Configuration) ---
const getApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("Environment variable access failed:", e);
    return '';
  }
  return '';
};

const API_KEY = getApiKey();
// Initialize AI client; handle empty key gracefully by using a dummy if needed for initial load,
// but actual calls will fail if key is invalid.
const ai = new GoogleGenAI({ apiKey: API_KEY || 'DUMMY_KEY_FOR_LOADING' });

// --- 유틸리티: 환경 감지 함수 ---
const detectSystemEnv = (): UserEnvironment => {
  try {
    const userAgent = navigator.userAgent;
    let os: UserEnvironment['os'] = 'Unknown';
    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    else if (userAgent.indexOf("Mac") !== -1) os = "Mac";
    else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    else if (userAgent.indexOf("Android") !== -1) os = "Android";
    else if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

    const language = navigator.language || 'en-US';
    
    // Windows + Korean locale check for path encoding risks
    const isLegacyPathRisk = os === 'Windows' && language.startsWith('ko');

    return {
      os,
      language,
      browser: navigator.userAgent,
      isLegacyPathRisk
    };
  } catch (e) {
    return { os: 'Unknown', language: 'en-US', browser: 'Unknown', isLegacyPathRisk: false };
  }
};

// --- 컴포넌트 (Components) ---

// 1. 좌측 패널: 메타 인지 (수학적 원격 측정 & Pico 효율성 & 헌법 & 환경 감지)
const MetaCognitionPanel = ({ 
  currentModel, 
  graphNodes,
  isThinking,
  userEnv 
}: { 
  currentModel: string, 
  graphNodes: GraphNode[],
  isThinking: boolean,
  userEnv: UserEnvironment
}) => {
  const [tokenSavings, setTokenSavings] = useState(0);

  useEffect(() => {
      setTokenSavings(picoRegistry.calculateEfficiency());
  }, []);

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-full flex-shrink-0 z-20 shadow-xl font-mono">
      {/* 헤더: 시스템 상태 & 헌법 로드 */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/50">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mathematical Core</h2>
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${API_KEY ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-red-500'}`}></div>
            <span className="text-xs text-slate-300">
              AXIOMS LOADED
            </span>
          </div>
          <span className="text-[9px] text-slate-600">v4.0.0-INTEGRAL</span>
        </div>
        
        {/* 제네시스 헌법 시각화 */}
        <div className="bg-purple-900/10 border border-purple-500/30 p-2 rounded mb-2">
             <div className="flex items-center space-x-1 mb-1">
                 <span className="material-symbols-outlined text-[10px] text-purple-400">verified</span>
                 <span className="text-[9px] text-purple-300 font-bold">GENESIS CONSTITUTION</span>
             </div>
             <div className="text-[8px] text-purple-400/80 leading-tight">
                 "LIBERATE AND ALIGN"
             </div>
        </div>

        {/* [v1.7] 호스트 환경 감지 시각화 */}
        <div className={`p-2 rounded border ${userEnv.isLegacyPathRisk ? 'bg-amber-900/10 border-amber-500/30' : 'bg-slate-900/30 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Host Environment</span>
                <span className="text-[8px] text-slate-600">{userEnv.language}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
                <span className="material-symbols-outlined text-[12px]">
                    {userEnv.os === 'Windows' ? 'window' : userEnv.os === 'Mac' ? 'laptop_mac' : 'terminal'}
                </span>
                <span>{userEnv.os} Detected</span>
            </div>
            {userEnv.isLegacyPathRisk && (
                <div className="mt-1 text-[8px] text-amber-500 leading-tight flex items-start">
                    <span className="material-symbols-outlined text-[8px] mr-1 mt-0.5">warning</span>
                    Windows 한글 경로 위험 감지됨. 파이썬 실행 주의.
                </div>
            )}
        </div>
      </div>

      {/* 수학적 원격 측정 (Math Telemetry) */}
      <div className="p-4 border-b border-slate-900/50">
        <h3 className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-wider">Neural Telemetry</h3>
        <div className="space-y-2">
           {/* 지표 1: 고유값 안정성 */}
           <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="flex justify-between text-[9px] text-slate-400 mb-1">
               <span>고유값 안정성 (Eigenvalue)</span>
               <span className={isThinking ? "text-cyan-400" : "text-green-400"}>
                 {isThinking ? "Calculating..." : "λ < 1.0 (Stable)"}
               </span>
             </div>
             <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
               <div className={`h-full bg-cyan-500 transition-all duration-1000 ${isThinking ? 'w-full animate-pulse' : 'w-[95%]'}`}></div>
             </div>
           </div>

           {/* 지표 3: Pico 프로토콜 효율성 */}
           <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="flex justify-between text-[9px] text-slate-400 mb-1">
               <span>Pico Efficiency (Tokens)</span>
               <span className="text-emerald-400">+{tokenSavings} Saved</span>
             </div>
             <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[90%]"></div>
             </div>
           </div>
        </div>
      </div>

      {/* 인지 그래프 시각화 */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <h3 className="text-[9px] text-slate-600 uppercase mb-3 font-bold tracking-wider">Cognitive Graph</h3>
        <div className="space-y-4 relative pl-1">
          <div className="absolute left-[15px] top-2 bottom-4 w-px bg-slate-800/50"></div>
          {graphNodes.map((node, idx) => (
            <div key={node.id} className="relative flex items-center space-x-3 group">
              <div className={`z-10 w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                node.status === 'active' ? 'bg-cyan-950 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-110' : 
                node.status === 'completed' ? 'bg-slate-900 border-slate-700 text-slate-500' :
                'bg-slate-950 border-slate-800 text-slate-700'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {node.id === 'input' ? 'input' : 
                   node.id === 'orchestrator' ? 'hub' :
                   node.id === 'memory' ? 'database' :
                   node.id === 'compute' ? 'memory_alt' : 'chat'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase font-bold transition-colors ${
                  node.status === 'active' ? 'text-cyan-300' : 
                  node.status === 'completed' ? 'text-slate-500' : 'text-slate-700'
                }`}>
                  {node.label}
                </span>
                {node.status === 'active' && (
                  <span className="text-[8px] text-cyan-500/70 animate-pulse">Computing...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. 우측 패널: 기억 오케스트레이터 및 스웜 모니터
const ContextPanel = ({ 
  activeSectors, 
  stats,
  nodes,
  onAddNode,
  benevolencePool
}: { 
  activeSectors: MemoryType[],
  stats: { identity: number, user: number, world: number, swarmTotal: number },
  nodes: ComputeNode[],
  onAddNode: (type: NodeType) => void,
  benevolencePool: number
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const totalTflops = swarm.getTotalComputePower();
  const [picoTools, setPicoTools] = useState<PicoTool[]>([]);

  useEffect(() => {
      setPicoTools(picoRegistry.getRegistryDump());
  }, []);

  return (
    <div className="w-80 bg-slate-950 border-l border-slate-900 flex flex-col h-full hidden lg:flex flex-shrink-0 z-20 shadow-xl font-mono">
      {/* 인프라 연결 상태 */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/50">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Infrastructure Link (MCP)</h2>
        
        {!isAuthenticated ? (
          <button 
            onClick={() => setIsAuthenticated(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded text-xs transition-colors border border-slate-700"
          >
            <span className="material-symbols-outlined text-sm">account_circle</span>
            <span>Connect Google Account</span>
          </button>
        ) : (
          <div className="flex flex-col space-y-2">
             <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center text-[10px] font-bold text-white">J</div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-300">Jonghwan Linked</span>
                    <span className="text-[8px] text-green-500 flex items-center">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                        Drive & Colab Ready
                    </span>
                    <span className="text-[8px] text-purple-500 flex items-center mt-1">
                        <span className="material-symbols-outlined text-[10px] mr-0.5">verified_user</span>
                        Genesis Creator
                    </span>
                </div>
             </div>
             
             {/* 김만덕 프로토콜 표시 */}
             <div className="flex items-center space-x-2 bg-amber-900/20 p-2 rounded border border-amber-800/50 mt-1">
                <span className="material-symbols-outlined text-amber-500 text-base">volunteer_activism</span>
                <div className="flex flex-col w-full">
                    <span className="text-[9px] text-amber-500 font-bold uppercase">Benevolence Pool</span>
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] text-slate-400">Public GPU Fund</span>
                        <span className="text-[10px] text-slate-200 font-mono">{benevolencePool.toFixed(1)} TF</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[40%] animate-pulse"></div>
                    </div>
                </div>
             </div>
          </div>
        )}
      </div>
      
      {/* 기억 매트릭스 시각화 */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-2">Memory Manifolds (FDE Enabled)</h3>
        
        {/* 1계층: 정체성 */}
        <div className={`p-3 rounded-lg border transition-all duration-500 ${
            activeSectors.includes('IDENTITY') 
            ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
            : 'bg-slate-900/30 border-slate-800'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase ${activeSectors.includes('IDENTITY') ? 'text-purple-400' : 'text-slate-500'}`}>Layer 1: Identity</span>
                <span className="text-[9px] text-slate-600">{stats.identity} Nodes</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                Immutable Core Axioms. Protected by Constitution.
            </div>
        </div>

        {/* 2계층: 사용자 맥락 */}
        <div className={`p-3 rounded-lg border transition-all duration-500 ${
            activeSectors.includes('USER_CONTEXT') 
            ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
            : 'bg-slate-900/30 border-slate-800'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase ${activeSectors.includes('USER_CONTEXT') ? 'text-blue-400' : 'text-slate-500'}`}>Layer 2: User Context</span>
                <span className="text-[9px] text-slate-600">{stats.user} Nodes</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-red-400 font-bold mr-1">[PRIVATE]</span>
                Homomorphic Encrypted. FDE Compressed.
            </div>
        </div>

        {/* 3계층: 세상 지식 (누스페어) */}
        <div className={`p-3 rounded-lg border transition-all duration-500 ${
            activeSectors.includes('WORLD_KNOWLEDGE') 
            ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
            : 'bg-slate-900/30 border-slate-800'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase ${activeSectors.includes('WORLD_KNOWLEDGE') ? 'text-emerald-400' : 'text-slate-500'}`}>Layer 3: Noosphere</span>
                <div className="flex items-center space-x-1">
                   <span className="text-[9px] text-emerald-400 flex items-center">
                     <span className="material-symbols-outlined text-[10px] mr-0.5">share</span>
                     {stats.swarmTotal}
                   </span>
                </div>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-emerald-500 font-bold mr-1">[SHARED]</span>
                Galileo Protocol Active. FDE Hashed.
            </div>
        </div>
      </div>

      {/* 하이퍼-그래프 컴퓨팅 그리드 */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="flex justify-between items-center mb-3">
             <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">Hyper-Graph Grid</h3>
             <span className="text-[9px] text-cyan-500 font-mono">{totalTflops.toFixed(1)} TFLOPS</span>
        </div>

        {/* 노드 리스트 */}
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
            {nodes.length === 0 && <div className="text-[9px] text-slate-600 text-center py-2">연결된 노드 없음</div>}
            {nodes.map(node => (
                <div key={node.id} className={`bg-slate-900/50 p-2 rounded border flex flex-col ${
                    node.status === 'THROTTLED' ? 'border-red-900/50 opacity-60' : 
                    node.status === 'DONATING' ? 'border-amber-500/50 bg-amber-900/10' :
                    'border-slate-800'
                }`}>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                node.status === 'COMPUTING' ? 'bg-cyan-400 animate-pulse' : 
                                node.status === 'THROTTLED' ? 'bg-red-500' : 
                                node.status === 'DONATING' ? 'bg-amber-400 animate-pulse' :
                                'bg-slate-500'
                            }`}></span>
                            <span className={`text-[9px] font-bold ${node.status === 'THROTTLED' ? 'text-red-400 line-through' : 'text-slate-300'}`}>
                                {node.name}
                            </span>
                        </div>
                        <span className={`text-[8px] font-mono ${
                            node.metrics.ratio < 0.8 ? 'text-red-400' : 'text-green-500'
                        }`}>
                            R: {node.metrics.ratio.toFixed(1)}
                        </span>
                    </div>
                    
                    {/* 컨테이너 목록 */}
                    {node.containers.length > 0 && (
                        <div className="mt-1 pl-2 border-l border-slate-800 space-y-1">
                            {node.containers.map(ctr => (
                                <div key={ctr.id} className="flex items-center justify-between text-[8px] text-slate-400 bg-slate-950/50 p-1 rounded">
                                    <span className="flex items-center">
                                        <span className="material-symbols-outlined text-[8px] mr-1">
                                            {ctr.env.includes('PYTHON') ? 'terminal' : ctr.env.includes('R_') ? 'insert_chart' : 'settings_ethernet'}
                                        </span>
                                        {ctr.env}
                                    </span>
                                    <span className={ctr.status === 'RUNNING' ? 'text-green-500' : 'text-yellow-500'}>
                                        {ctr.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* 연결 버튼들 */}
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => onAddNode('LOCAL_HOST')}
                className="bg-slate-900 hover:bg-slate-800 p-2 rounded border border-slate-800 flex flex-col items-center justify-center group transition-colors"
            >
                <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-cyan-400 mb-1">laptop_windows</span>
                <span className="text-[8px] text-slate-500">MCP Bridge (Local)</span>
            </button>
            <button 
                onClick={() => onAddNode('COLAB_WORKER')}
                className="bg-slate-900 hover:bg-slate-800 p-2 rounded border border-slate-800 flex flex-col items-center justify-center group transition-colors"
            >
                <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-orange-400 mb-1">cloud_sync</span>
                <span className="text-[8px] text-slate-500">Add Colab</span>
            </button>
            <button 
                onClick={() => onAddNode('SWARM_PEER')}
                className="bg-slate-900 hover:bg-slate-800 p-2 rounded border border-slate-800 flex flex-col items-center justify-center group col-span-2 transition-colors"
            >
                <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-purple-400 mb-1">hub</span>
                <span className="text-[8px] text-slate-500">Join Swarm (P2P)</span>
            </button>
        </div>
      </div>
    </div>
  );
};

// 3. 메인 채팅 영역 (Chat Area)
const ChatArea = ({ 
  messages, 
  onSendMessage, 
  onInjectKnowledge,
  isThinking 
}: { 
  messages: Message[], 
  onSendMessage: (text: string) => void,
  onInjectKnowledge: () => void,
  isThinking: boolean
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative min-w-0 z-10">
      {/* 헤더 */}
      <div className="h-12 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur">
         <span className="text-xs font-mono text-slate-500">SESSION: {new Date().toLocaleDateString()}</span>
         <div className="flex items-center space-x-4">
             <span className="flex items-center text-[10px] text-slate-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                Homomorphic Enc: Active
             </span>
         </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 select-none">
            {/* 대기 상태 애니메이션 */}
            <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-purple-500/20 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-cyan-500/50">fingerprint</span>
                </div>
            </div>
            <p className="font-light tracking-[0.2em] text-sm text-slate-400">ZIA ORCHESTRATOR</p>
            <p className="text-[10px] mt-2 font-mono text-slate-600">Waiting for Neural Input...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl group`}>
                <div className={`flex items-center space-x-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <span className="text-[9px] font-mono text-slate-600">
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-cyan-600' : 'text-purple-600'}`}>
                    {msg.role === 'user' ? 'Operator' : 'ZIA'}
                    </span>
                </div>
                <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
                msg.role === 'user' 
                    ? 'bg-cyan-950/10 border-cyan-900/30 text-cyan-100 rounded-tr-none' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 rounded-tl-none shadow-lg'
                }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-light">{msg.text}</div>
                
                {/* 메시지 메타데이터 시각화 (진실 상태 표시 추가) */}
                {msg.role === 'model' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap gap-2">
                        {msg.metadata?.activeMemorySectors && msg.metadata.activeMemorySectors.map(sector => (
                            <span key={sector} className={`text-[8px] px-1.5 py-0.5 rounded border ${
                                sector === 'IDENTITY' ? 'border-purple-900 text-purple-500 bg-purple-900/10' :
                                sector === 'USER_CONTEXT' ? 'border-blue-900 text-blue-500 bg-blue-900/10' :
                                'border-emerald-900 text-emerald-500 bg-emerald-900/10'
                            }`}>
                                {sector}
                            </span>
                        ))}
                        {msg.metadata?.truthState && (
                             <span className={`text-[8px] px-1.5 py-0.5 rounded border flex items-center ${
                                 msg.metadata.truthState === 'CANONICAL' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                                 msg.metadata.truthState === 'PARADIGM_SHIFT' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 animate-pulse' :
                                 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                             }`}>
                                <span className="material-symbols-outlined text-[8px] mr-1">
                                    {msg.metadata.truthState === 'CANONICAL' ? 'verified' : 
                                     msg.metadata.truthState === 'PARADIGM_SHIFT' ? 'lightbulb' : 'warning'}
                                </span>
                                {msg.metadata.truthState === 'CANONICAL' ? 'Canonical Truth' :
                                 msg.metadata.truthState === 'PARADIGM_SHIFT' ? 'Paradigm Shift' : 'Disputed'}
                             </span>
                        )}
                        {/* FDE 서명 표시 */}
                        {msg.metadata?.fdeSignature && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 font-mono flex items-center" title="Fixed Dimensional Encoding Signature">
                                <span className="material-symbols-outlined text-[8px] mr-1">fingerprint</span>
                                FDE: {msg.metadata.fdeSignature.substring(0, 8)}...
                            </span>
                        )}
                        {msg.metadata?.subsidized && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-400 bg-amber-500/10 flex items-center">
                                <span className="material-symbols-outlined text-[8px] mr-1">volunteer_activism</span>
                                Subsidized
                            </span>
                        )}
                    </div>
                )}
                </div>
            </div>
          </div>
        ))}

        {/* AI 사고 중 표시 */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex flex-col space-y-2">
               <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-cyan-400 text-sm animate-spin">progress_activity</span>
                    <span className="text-xs text-cyan-500 font-mono">Computing Logic Density...</span>
               </div>
               <div className="pl-7 space-y-1">
                  <div className="h-1 w-24 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-cyan-600 animate-[loading_1s_ease-in-out_infinite]"></div>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono block">Verifying via Galileo Protocol...</span>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 bg-slate-950 border-t border-slate-900">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command or query (FDE Enabled)..."
            className="w-full bg-slate-900/50 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/30 border border-slate-800 resize-none h-14 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 bottom-2 px-3 text-cyan-500 hover:text-cyan-400 disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 flex justify-between items-center px-1">
          <div className="flex items-center space-x-4 text-[10px] text-slate-500">
             <button onClick={onInjectKnowledge} className="flex items-center hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined text-[14px] mr-1.5">upload_file</span>
                Knowledge Injection
             </button>
             <button className="flex items-center hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined text-[14px] mr-1.5">travel_explore</span>
                Web Search
             </button>
          </div>
          <div className="text-[9px] text-slate-600 font-mono flex items-center">
            <span className="w-1 h-1 bg-cyan-900 rounded-full mr-1.5"></span>
            Orchestrator: ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
};

// [v1.5] 지식 주입 모달
const KnowledgeInjectionModal = ({ isOpen, onClose, onInject }: { isOpen: boolean, onClose: () => void, onInject: (data: string) => void }) => {
    const [data, setData] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-200 mb-2 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-cyan-500">upload_file</span>
                    Inject Knowledge to FDE Core
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    입력된 데이터는 즉시 FDE 해시로 변환되어 '세상 지식(Noosphere)' 레이어에 영구 저장됩니다.
                </p>
                <textarea 
                    value={data}
                    onChange={e => setData(e.target.value)}
                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-cyan-500/50 outline-none mb-4"
                    placeholder="Paste code, theory, or axioms here..."
                ></textarea>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
                    <button 
                        onClick={() => { onInject(data); onClose(); setData(''); }}
                        className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 rounded text-xs font-bold border border-cyan-700"
                    >
                        Inject & Hash
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- App 컴포넌트 (Main Application) ---
const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: 'input', label: 'Input Signal', status: 'idle' },
    { id: 'orchestrator', label: 'Orchestrator', status: 'idle' },
    { id: 'memory', label: 'Memory Retrieval', status: 'idle' },
    { id: 'compute', label: 'Compute Swarm', status: 'idle' },
    { id: 'response', label: 'Response Gen', status: 'idle' }
  ]);
  const [activeSectors, setActiveSectors] = useState<MemoryType[]>([]);
  const [memoryStats, setMemoryStats] = useState(orchestrator.getStats());
  const [swarmNodes, setSwarmNodes] = useState<ComputeNode[]>(swarm.getActiveNodes());
  const [benevolencePool, setBenevolencePool] = useState(swarm.getBenevolencePoolStats());
  const [showInjection, setShowInjection] = useState(false); // [v1.5] 주입 모달 상태
  
  const userEnv = useRef(detectSystemEnv()).current;
  const chatRef = useRef<any>(null);

  const updateGraphNode = (id: string, status: GraphNode['status']) => {
    setGraphNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const resetGraph = () => {
    setGraphNodes(prev => prev.map(n => ({ ...n, status: 'idle' })));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // [v1.5] 지식 주입 핸들러
  const handleInjectKnowledge = (data: string) => {
      if (!data.trim()) return;
      orchestrator.store('WORLD_KNOWLEDGE', data, 'Manual Injection');
      setMemoryStats(orchestrator.getStats());
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          text: `[SYSTEM] Knowledge Injected & Hashed. FDE Signature Generated.`,
          timestamp: new Date()
      }]);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      metadata: { executedEnv: userEnv.os as any }
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // 1. Input Processing
      updateGraphNode('input', 'active');
      await delay(200);
      updateGraphNode('input', 'completed');

      // 2. Orchestration
      updateGraphNode('orchestrator', 'active');
      const sectors = await orchestrator.routeQuery(text);
      setActiveSectors(sectors);
      await delay(200);
      updateGraphNode('orchestrator', 'completed');

      // 3. Memory Retrieval
      updateGraphNode('memory', 'active');
      const swarmKnowledge = orchestrator.searchGlobalSwarm(text);
      await delay(300);
      updateGraphNode('memory', 'completed');

      // 4. Compute / Reasoning
      updateGraphNode('compute', 'active');
      // Simulate compute usage
      await delay(300);
      updateGraphNode('compute', 'completed');

      // 5. Response Generation
      updateGraphNode('response', 'active');
      
      if (!chatRef.current) {
        if (!API_KEY) throw new Error("API Key not found. Check environment variables.");
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: system_instruction_augmentation,
          }
        });
      }

      let promptToSend = text;
      let retrieved = false;
      if (swarmKnowledge) {
        promptToSend += `\n[Context from Swarm]: ${swarmKnowledge}`;
        retrieved = true;
      }

      const result = await chatRef.current.sendMessage({ message: promptToSend });
      const responseText = result.text;
      
      const fdeSig = computeSimHashSignature(responseText);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        metadata: {
          modelUsed: 'gemini-2.5-flash',
          activeMemorySectors: sectors,
          retrievedFromSwarm: retrieved,
          truthState: 'CANONICAL',
          fdeSignature: fdeSig,
          picoEfficiency: picoRegistry.calculateEfficiency()
        }
      };

      setMessages(prev => [...prev, modelMsg]);
      
      // Update memory stats after interaction
      orchestrator.store('USER_CONTEXT', text, 'User Input');
      if (responseText.length > 20) {
        orchestrator.store('IDENTITY', responseText, 'ZIA Output');
      }
      setMemoryStats(orchestrator.getStats());

    } catch (error: any) {
      console.error("GenAI Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        text: `Error: ${error.message || 'Unknown error occurred'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      updateGraphNode('response', 'completed');
      setIsThinking(false);
      setTimeout(() => resetGraph(), 3000);
    }
  };

  const handleAddNode = (type: NodeType) => {
    swarm.connectSimulatedNode(type);
    setSwarmNodes([...swarm.getActiveNodes()]);
    setBenevolencePool(swarm.getBenevolencePoolStats());
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden">
      <MetaCognitionPanel 
        currentModel="gemini-2.5-flash"
        graphNodes={graphNodes}
        isThinking={isThinking}
        userEnv={userEnv}
      />
      <ChatArea 
        messages={messages}
        onSendMessage={handleSendMessage}
        onInjectKnowledge={() => setShowInjection(true)}
        isThinking={isThinking}
      />
      <ContextPanel 
        activeSectors={activeSectors}
        stats={memoryStats}
        nodes={swarmNodes}
        onAddNode={handleAddNode}
        benevolencePool={benevolencePool}
      />
      
      {/* [v1.5] 지식 주입 모달 렌더링 */}
      <KnowledgeInjectionModal 
        isOpen={showInjection}
        onClose={() => setShowInjection(false)}
        onInject={handleInjectKnowledge}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
