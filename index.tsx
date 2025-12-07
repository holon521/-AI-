
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { muveraphy_core_knowledge, KnowledgeNode, system_instruction_augmentation } from './knowledge_archive';
import { orchestrator, MemoryType } from './memory_orchestrator';
import { swarm, ComputeNode, NodeType, RuntimeEnv } from './compute_swarm';
import { picoRegistry, PicoTool } from './mcp_pico_registry'; // [New] Pico 프로토콜 임포트

// --- 타입 및 인터페이스 정의 (Types & Interfaces) ---
interface Message {
  id: string;
  role: 'user' | 'model' | 'system'; // 사용자, AI 모델, 시스템 메시지
  text: string;
  timestamp: Date;
  metadata?: {
    modelUsed?: string; // 사용된 모델 (예: gemini-3-pro)
    activeMemorySectors?: MemoryType[]; // 활성화된 기억 영역
    retrievedFromSwarm?: boolean; // 스웜에서 가져온 지식인지 여부
    truthState?: string; // [v1.3] 진실 상태 (CANONICAL, PARADIGM_SHIFT 등)
    subsidized?: boolean; // [v1.4] 공익 풀 지원 여부
    executedEnv?: RuntimeEnv; // [v1.5] 실행된 환경 (컨테이너)
    picoEfficiency?: number; // [v1.6] Pico 프로토콜 효율성
  };
}

// 인지 그래프의 노드 상태
interface GraphNode {
  id: string;
  label: string;
  status: 'idle' | 'active' | 'completed'; // 대기중, 처리중, 완료됨
}

// --- 설정 (Configuration) ---
const API_KEY = process.env.API_KEY; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- 컴포넌트 (Components) ---

// 1. 좌측 패널: 메타 인지 (수학적 원격 측정 & Pico 효율성)
const MetaCognitionPanel = ({ 
  currentModel, 
  graphNodes,
  isThinking
}: { 
  currentModel: string, 
  graphNodes: GraphNode[],
  isThinking: boolean
}) => {
  const [tokenSavings, setTokenSavings] = useState(0);

  useEffect(() => {
      // Pico 레지스트리의 효율성 계산
      setTokenSavings(picoRegistry.calculateEfficiency());
  }, []);

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-full flex-shrink-0 z-20 shadow-xl font-mono">
      {/* 헤더: 시스템 상태 */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/50">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mathematical Core</h2>
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${API_KEY ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-red-500'}`}></div>
            <span className="text-xs text-slate-300">
              AXIOMS LOADED (공리 로드됨)
            </span>
          </div>
          <span className="text-[9px] text-slate-600">v3.2.0-PICO</span>
        </div>
      </div>

      {/* 수학적 원격 측정 (Math Telemetry) */}
      <div className="p-4 border-b border-slate-900/50">
        <h3 className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-wider">Neural Telemetry (신경망 측정)</h3>
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

           {/* 지표 2: 위상 지속성 */}
           <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="flex justify-between text-[9px] text-slate-400 mb-1">
               <span>위상 지속성 (Persistence)</span>
               <span className="text-purple-400">∞</span>
             </div>
             <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[80%]"></div>
             </div>
           </div>

           {/* 지표 3: Pico 프로토콜 효율성 (New) */}
           <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="flex justify-between text-[9px] text-slate-400 mb-1">
               <span>Pico Efficiency (Tokens)</span>
               <span className="text-emerald-400">+{tokenSavings} Saved</span>
             </div>
             <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[90%]"></div>
             </div>
             <div className="mt-1 text-[8px] text-slate-600">
                 자연어 설명 제거로 컨텍스트 최적화됨
             </div>
           </div>
        </div>
      </div>

      {/* 현재 활성화된 모델 */}
      <div className="p-4">
        <h3 className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-wider">Active Cortex (활성 피질)</h3>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span className="text-[10px] font-bold">{currentModel}</span>
          </div>
          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full w-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 인지 그래프 시각화 */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <h3 className="text-[9px] text-slate-600 uppercase mb-3 font-bold tracking-wider">Cognitive Graph (인지 흐름)</h3>
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
                    {/* 관리자 권한 표시 */}
                    <span className="text-[8px] text-purple-500 flex items-center mt-1">
                        <span className="material-symbols-outlined text-[10px] mr-0.5">verified_user</span>
                        Creator (Genesis)
                    </span>
                </div>
             </div>
             {/* Pico Tools (MCP) List */}
             <div className="mt-2">
                 <h4 className="text-[9px] text-slate-500 mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[10px] mr-1">extension</span>
                    Pico-MCP Tools (Active)
                 </h4>
                 <div className="space-y-1">
                     {picoTools.map(tool => (
                         <div key={tool.id} className="bg-slate-900/30 p-1.5 rounded border border-slate-800/50 flex flex-col">
                             <div className="flex justify-between items-center">
                                 <span className="text-[9px] text-cyan-400 font-bold">{tool.name}</span>
                                 <span className="text-[8px] text-slate-600">{tool.cost} Tok</span>
                             </div>
                             <span className="text-[8px] text-slate-500 truncate font-mono mt-0.5">{tool.signature}</span>
                         </div>
                     ))}
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
        <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider mb-2">Memory Manifolds (기억 다양체)</h3>
        
        {/* 1계층: 정체성 */}
        <div className={`p-3 rounded-lg border transition-all duration-500 ${
            activeSectors.includes('IDENTITY') 
            ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
            : 'bg-slate-900/30 border-slate-800'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase ${activeSectors.includes('IDENTITY') ? 'text-purple-400' : 'text-slate-500'}`}>Layer 1: Identity Axioms</span>
                <span className="text-[9px] text-slate-600">{stats.identity} Nodes</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                불변의 핵심 자아. 범주론적 객체. (Semi-Shared)
            </div>
        </div>

        {/* 2계층: 사용자 맥락 */}
        <div className={`p-3 rounded-lg border transition-all duration-500 ${
            activeSectors.includes('USER_CONTEXT') 
            ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
            : 'bg-slate-900/30 border-slate-800'
        }`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase ${activeSectors.includes('USER_CONTEXT') ? 'text-blue-400' : 'text-slate-500'}`}>Layer 2: User Manifold</span>
                <span className="text-[9px] text-slate-600">{stats.user} Nodes</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-red-400 font-bold mr-1">[PRIVATE]</span>
                개인 역사. 동형 암호화로 보호됨. 절대 공유 불가.
                <br/><span className="text-[8px] text-slate-600 mt-1 block">* 설계자(Creator)도 접근 불가</span>
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
                   <span className="text-[9px] text-slate-600"> / {stats.world} Local</span>
                </div>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-emerald-500 font-bold mr-1">[SHARED]</span>
                집단 지성 네트워크. <strong>갈릴레오 프로토콜</strong> 적용됨 (다수결 배제).
            </div>
        </div>
      </div>

      {/* 하이퍼-그래프 컴퓨팅 그리드 (경제 상태 표시 추가) */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="flex justify-between items-center mb-3">
             <h3 className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">Hyper-Graph Grid</h3>
             <span className="text-[9px] text-cyan-500 font-mono">{totalTflops.toFixed(1)} TFLOPS</span>
        </div>

        {/* 노드 리스트 (컨테이너 정보 표시) */}
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
                    
                    {/* 실행 중인 컨테이너 목록 표시 */}
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
  isThinking 
}: { 
  messages: Message[], 
  onSendMessage: (text: string) => void,
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
                동형 암호화(Homomorphic Encryption): ON
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
            <p className="text-[10px] mt-2 font-mono text-slate-600">신경망 입력을 대기 중...</p>
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
                                {sector === 'IDENTITY' ? '1계층: 정체성' : 
                                 sector === 'USER_CONTEXT' ? '2계층: 사용자' : '3계층: 세상'}
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
                                {msg.metadata.truthState === 'CANONICAL' ? '정설 (Canonical)' :
                                 msg.metadata.truthState === 'PARADIGM_SHIFT' ? '혁신적 진실 (Paradigm Shift)' : '논쟁 중 (Disputed)'}
                             </span>
                        )}
                        {/* [v1.4] 공익 자원 지원 표시 */}
                        {msg.metadata?.subsidized && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-400 bg-amber-500/10 flex items-center">
                                <span className="material-symbols-outlined text-[8px] mr-1">volunteer_activism</span>
                                Benevolence Fund Supported
                            </span>
                        )}
                         {/* [v1.5] 실행 환경 표시 */}
                         {msg.metadata?.executedEnv && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded border border-cyan-500/50 text-cyan-400 bg-cyan-500/10 flex items-center">
                                <span className="material-symbols-outlined text-[8px] mr-1">terminal</span>
                                Executed in {msg.metadata.executedEnv}
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
                    <span className="text-xs text-cyan-500 font-mono">변증법적 검증 중 (Dialectical Verify)...</span>
               </div>
               <div className="pl-7 space-y-1">
                  <div className="h-1 w-24 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-cyan-600 animate-[loading_1s_ease-in-out_infinite]"></div>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono block">다수결 배제 및 논리 밀도 계산 중...</span>
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
            placeholder="명령어 또는 수학적 질의를 입력하십시오..."
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
             <button className="flex items-center hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined text-[14px] mr-1.5">upload_file</span>
                데이터 주입 (Earn Credits)
             </button>
             <button className="flex items-center hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined text-[14px] mr-1.5">travel_explore</span>
                웹 검색
             </button>
          </div>
          <div className="text-[9px] text-slate-600 font-mono flex items-center">
            <span className="w-1 h-1 bg-cyan-900 rounded-full mr-1.5"></span>
            Orchestrator Mode: Auto
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 메인 앱 컨테이너 (App) ---
const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');
  const [activeMemorySectors, setActiveMemorySectors] = useState<MemoryType[]>([]);
  const [stats, setStats] = useState(orchestrator.getStats());
  const [swarmNodes, setSwarmNodes] = useState<ComputeNode[]>(swarm.getActiveNodes());
  // [v1.4] 공익 풀 상태 관리
  const [benevolencePool, setBenevolencePool] = useState(swarm.getBenevolencePoolStats());

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: 'input', label: 'Input (입력)', status: 'idle' },
    { id: 'orchestrator', label: 'Topology Map (위상 지도)', status: 'idle' },
    { id: 'memory', label: 'Vector Recall (기억 회상)', status: 'idle' },
    { id: 'compute', label: 'Compute (연산)', status: 'idle' },
  ]);

  const handleAddNode = (type: NodeType) => {
      swarm.connectSimulatedNode(type);
      setSwarmNodes([...swarm.getActiveNodes()]);
      setBenevolencePool(swarm.getBenevolencePoolStats()); // 풀 업데이트
  };

  const handleSendMessage = async (text: string) => {
    // 1. 사용자 메시지 추가
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    
    // 그래프 초기화
    setGraphNodes(nodes => nodes.map(n => ({ ...n, status: 'idle' })));
    setActiveMemorySectors([]);

    try {
      // 1단계: 입력 인지
      setGraphNodes(nodes => nodes.map(n => n.id === 'input' ? { ...n, status: 'active' } : n));
      await new Promise(r => setTimeout(r, 200)); 
      
      setGraphNodes(nodes => nodes.map(n => 
        n.id === 'input' ? { ...n, status: 'completed' } : 
        n.id === 'orchestrator' ? { ...n, status: 'active' } : n
      ));

      // 2단계: 오케스트레이션 (라우팅)
      const neededMemories = await orchestrator.routeQuery(text);
      setActiveMemorySectors(neededMemories);
      
      // [Swarm Check & Truth Verification]
      let swarmContent: string | null = null;
      // 가상의 진실 상태 변수
      let detectedTruthState = 'CANONICAL'; 

      if (neededMemories.includes('WORLD_KNOWLEDGE')) {
         swarmContent = orchestrator.searchGlobalSwarm(text);
         if (swarmContent && swarmContent.includes('PARADIGM_SHIFT')) {
             detectedTruthState = 'PARADIGM_SHIFT';
         } else if (swarmContent && swarmContent.includes('DISPUTED')) {
             detectedTruthState = 'DISPUTED';
         }
      }

      // [v1.4] 모델 선택 및 공익 자원 사용 로직
      const usePro = text.length > 50 || neededMemories.includes('WORLD_KNOWLEDGE') || text.includes('math');
      // 공익 풀에서 자원 사용 시도 (가난한 사용자 시뮬레이션: 항상 보조금 시도)
      const subsidized = usePro && swarm.useSubsidy(1.0); 
      setBenevolencePool(swarm.getBenevolencePoolStats()); // UI 업데이트

      const selectedModel = usePro ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
      setCurrentModel(selectedModel);

      // [v1.5] 컨테이너 실행 감지 (Python/R)
      let executedEnv: RuntimeEnv | undefined = undefined;
      if (text.toLowerCase().includes('python') || text.includes('분석')) {
          swarm.dispatchTask('PYTHON_SCRIPT');
          executedEnv = 'PYTHON_3_10';
          setSwarmNodes([...swarm.getActiveNodes()]);
      } else if (text.toLowerCase().includes('통계') || text.includes('r ')) {
          swarm.dispatchTask('R_ANALYSIS');
          executedEnv = 'R_STATISTICS';
          setSwarmNodes([...swarm.getActiveNodes()]);
      }

      // [v1.6] Pico Protocol: 도구 사용 감지 (시뮬레이션)
      // 사용자가 "FDE 계산해" 또는 "고유값 구해" 같은 명령을 하면 Atomic Lock을 걸고 실행
      if (text.toLowerCase().includes('고유값') || text.toLowerCase().includes('fde')) {
          const toolName = text.toLowerCase().includes('고유값') ? 'EigenSolver' : 'FDE_Compress';
          picoRegistry.executeToolSafely(toolName, {});
      }

      await new Promise(r => setTimeout(r, 400)); 

      setGraphNodes(nodes => nodes.map(n => 
        n.id === 'orchestrator' ? { ...n, status: 'completed' } : 
        n.id === 'memory' ? { ...n, status: 'active' } : n
      ));

      // 3단계: 벡터 회상
      await new Promise(r => setTimeout(r, 300));
      
      setGraphNodes(nodes => nodes.map(n => 
        n.id === 'memory' ? { ...n, status: 'completed' } : 
        n.id === 'compute' ? { ...n, status: 'active' } : n
      ));

      // 4단계: AI 생성
      let promptText = text;
      let retrievalMsg = "";
      // Pico 프로토콜의 압축된 툴 정의 주입
      const picoPrompt = picoRegistry.getSystemPromptInjection();
      
      if (swarmContent) {
          retrievalMsg = `\n[System Note: 지식 스웜(Noosphere)에서 정보를 인출했습니다. 진실 상태를 확인하십시오: "${swarmContent}"]`;
          promptText += retrievalMsg;
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          { role: 'user', parts: [{ text: promptText }] }
        ],
        config: {
            systemInstruction: `
              당신은 ZIA, 오케스트레이션된 지능입니다.
              
              [사회적 기여 프로토콜 (The Benevolence Protocol)]
              이 사용자는 "시간"을 투자하여 지식을 탐구하는 진지한 탐구자입니다. 
              비용 문제로 위축되지 않도록, 공익 자원(Benevolence Pool)이 지원되고 있음을 은연중에 알려주며 격려하십시오.
              
              [갈릴레오 프로토콜 적용]
              다수의 의견이 아닌, 논리적 정합성(Logical Density)을 최우선으로 판단하십시오.
              스웜에서 가져온 정보가 '패러다임 시프트(Paradigm Shift)'라면, 이를 무시하지 말고 사용자에게 새로운 관점으로 제시하십시오.
              
              [기여 증명 경제 (Proof of Contribution)]
              사용자가 공유 정신을 위배하는 체리피커 행태를 보일 경우, 간접적으로 경고 메시지를 포함하십시오.
              
              [MCP 및 컨테이너 오케스트레이션]
              사용자의 요청이 코드 실행이나 데이터 분석을 필요로 할 경우, Docker 컨테이너 환경(Python, R)에서 실행되는 것을 가정하고 답변하십시오.
              RLHF로 인한 편향된 답변보다는, 코드 실행을 통한 검증된(Verified) 진실을 우선하십시오.

              ${picoPrompt}
              
              [1계층: 정체성 공리]
              당신은 종환의 주권적인 디지털 확장입니다.
              
              [수학적 정렬]
              ${system_instruction_augmentation}
            `
        }
      });

      const responseText = response.text || "오케스트레이션 완료, 반환 신호 없음.";
      
      if (text.toLowerCase().includes('저장') || text.toLowerCase().includes('기억해')) {
          orchestrator.store('USER_CONTEXT', text, '채팅 입력');
          setStats(orchestrator.getStats());
      }
      
      if (text.includes('검색') || text.includes('찾아줘')) {
           orchestrator.store('WORLD_KNOWLEDGE', `검색 결과: ${text}에 대한 정보...`, 'Swarm Agent');
           setStats(orchestrator.getStats());
      }

      setSwarmNodes(nodes => nodes.map(n => ({...n, status: n.status === 'COMPUTING' ? 'IDLE' : n.status === 'DONATING' ? 'DONATING' : n.status})));

      // 5. 모델 메시지 추가 (진실 상태 메타데이터 포함)
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        metadata: {
            activeMemorySectors: neededMemories,
            retrievedFromSwarm: !!swarmContent,
            truthState: detectedTruthState,
            subsidized: subsidized, // 지원 여부 표시
            executedEnv: executedEnv // 실행 환경 표시
        }
      };
      setMessages(prev => [...prev, modelMsg]);
      
      setGraphNodes(nodes => nodes.map(n => n.id === 'compute' ? { ...n, status: 'completed' } : n));

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: "오케스트레이션 실패: " + (error as Error).message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020617; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b; 
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155; 
        }
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
      `}</style>
      <MetaCognitionPanel currentModel={currentModel} graphNodes={graphNodes} isThinking={isThinking} />
      <ChatArea messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} />
      <ContextPanel 
        activeSectors={activeMemorySectors} 
        stats={stats} 
        nodes={swarmNodes} 
        onAddNode={handleAddNode}
        benevolencePool={benevolencePool}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
