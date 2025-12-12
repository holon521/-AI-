
import React, { useRef, useEffect, useState } from 'react';
import { Message, ReasoningMode, LLMProvider, TaskLog, BranchingOption } from '../../types';

interface ChatInterfaceProps {
    messages: Message[];
    isThinking: boolean;
    onSendMessage: (text: string, attachment?: { mimeType: string; data: string }) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    // New Props for Agentic Controls
    activeModel: string;
    onSetModel: (model: string) => void;
    reasoningMode: ReasoningMode;
    onSetReasoningMode: (mode: ReasoningMode) => void;
    llmProvider: LLMProvider;
    // [NEW] Real-time Task Status
    activeTask?: TaskLog;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    messages, isThinking, onSendMessage, isMuted, onToggleMute,
    activeModel, onSetModel, reasoningMode, onSetReasoningMode, llmProvider,
    activeTask
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<{ mimeType: string; data: string; preview: string } | null>(null);
    
    // UI Toggles
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showReasoningMenu, setShowReasoningMenu] = useState(false);
    
    // Cycling Axioms
    const [axiomIndex, setAxiomIndex] = useState(0);
    const AXIOMS = [
        "Poverty is structural dependency.",
        "Truth is not a democracy.",
        "The best part is no part.",
        "Intelligence is the ability to connect."
    ];

    useEffect(() => {
        if (messages.length === 0) {
            const timer = setInterval(() => {
                setAxiomIndex(prev => (prev + 1) % AXIOMS.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking, attachment]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value;
            if (val.trim() || attachment) {
                onSendMessage(val, attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined);
                e.currentTarget.value = '';
                setAttachment(null);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setAttachment({
                mimeType: file.type,
                data: base64Data,
                preview: base64String
            });
        };
        reader.readAsDataURL(file);
    };

    // Handle Branch Selection
    const handleBranchSelect = (option: BranchingOption) => {
        onSendMessage(option.next_action);
    };

    // Constants for Selectors
    const MODEL_OPTIONS = llmProvider === 'GOOGLE' 
        ? [
            { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview", desc: "ZIA Native Core" },
            { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Fast & Efficient" },
            { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Exp", desc: "Legacy Stable" },
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", desc: "Complex Reasoning" }
          ]
        : [
            { id: "gpt-4o", label: "GPT-4o", desc: "Omni Model" },
            { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet", desc: "Nuanced Code" },
            { id: "llama3.2", label: "Llama 3.2", desc: "Local / Ollama" }
          ];

    const REASONING_OPTIONS: { id: ReasoningMode, label: string, icon: string, color: string }[] = [
        { id: 'AUTO', label: 'AUTO (Dynamic)', icon: 'auto_mode', color: 'text-amber-400' },
        { id: 'FAST', label: 'FAST (1-Shot)', icon: 'bolt', color: 'text-cyan-400' },
        { id: 'PRECISE', label: 'PRECISE (Re-Check)', icon: 'check_circle', color: 'text-purple-400' },
        { id: 'DEBATE', label: 'DEBATE (Dual)', icon: 'diversity_3', color: 'text-rose-400' },
        { id: 'RESEARCH', label: 'RESEARCH (Web)', icon: 'public', color: 'text-emerald-400' },
    ];

    const currentReasoning = REASONING_OPTIONS.find(r => r.id === reasoningMode) || REASONING_OPTIONS[0];

    // Helper to render Grounding Sources
    const renderSources = (groundingMetadata: any) => {
        if (!groundingMetadata || !groundingMetadata.groundingChunks) return null;
        
        return (
            <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center">
                    <span className="material-symbols-outlined text-xs mr-1">public</span>
                    SOURCES (GOOGLE SEARCH)
                </div>
                <div className="flex flex-wrap gap-2">
                    {groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                        if (chunk.web?.uri) {
                            return (
                                <a 
                                    key={i} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-slate-950 hover:bg-slate-800 text-[9px] text-cyan-400 px-2 py-1 rounded border border-slate-800 transition-colors flex items-center max-w-[200px] truncate"
                                    title={chunk.web.title}
                                >
                                    <span className="truncate">{chunk.web.title || "Source"}</span>
                                    <span className="material-symbols-outlined text-[10px] ml-1 opacity-50">open_in_new</span>
                                </a>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col pt-12 relative h-full">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <span className="material-symbols-outlined text-6xl mb-4 text-slate-700 animate-pulse">psychology</span>
                        <div className="h-6 overflow-hidden relative text-center">
                            <p key={axiomIndex} className="text-sm font-light text-slate-500 animate-fade-in transition-all duration-500">
                                "{AXIOMS[axiomIndex]}"
                            </p>
                        </div>
                        <div className="flex space-x-2 mt-4">
                            <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-500 font-mono">{activeModel}</span>
                            <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-500 font-mono">{reasoningMode}</span>
                        </div>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                        <div className={`max-w-2xl p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-cyan-900/10 border border-cyan-800/30 text-cyan-100' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                            
                            {/* [TRANSPARENCY] Interpreted Intent Display */}
                            {msg.metadata?.interpretedIntent && (
                                <div className="mb-2 pb-2 border-b border-slate-700/50 flex items-center space-x-2 opacity-70">
                                    <span className="material-symbols-outlined text-xs text-amber-500">translate</span>
                                    <span className="text-[10px] text-amber-400 font-mono">"{msg.metadata.interpretedIntent}"</span>
                                </div>
                            )}

                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                            
                            {/* Branching Options (One-Click Decision Tree - INLINE MODE) */}
                            {msg.role === 'model' && msg.metadata?.branchingOptions && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {msg.metadata.branchingOptions.map((opt) => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => handleBranchSelect(opt)}
                                            className="text-left bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 p-3 rounded-lg transition-all group flex flex-col shadow-lg"
                                        >
                                            <div className="flex items-center text-xs font-bold text-cyan-400 group-hover:text-cyan-300 mb-1">
                                                {opt.icon && <span className="material-symbols-outlined text-sm mr-2">{opt.icon}</span>}
                                                {opt.label}
                                            </div>
                                            {opt.description && <div className="text-[10px] text-slate-500 group-hover:text-slate-400">{opt.description}</div>}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Sources Display */}
                            {msg.role === 'model' && msg.metadata?.groundingMetadata && renderSources(msg.metadata.groundingMetadata)}
                        </div>
                        {msg.role === 'model' && (
                            <div className="mt-1 flex items-center space-x-2 opacity-50 text-[9px] text-slate-500 px-2">
                                <span>{msg.timestamp.toLocaleTimeString()}</span>
                                {msg.metadata?.modelUsed && <span>• {msg.metadata.modelUsed}</span>}
                                {msg.metadata?.appliedStrategy && (
                                    <span className={`px-1 rounded border border-slate-700 bg-slate-800/50 ${REASONING_OPTIONS.find(r=>r.id===msg.metadata?.appliedStrategy)?.color}`}>
                                        {msg.metadata.appliedStrategy}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-center space-x-3 text-xs text-slate-500 pl-2 animate-pulse">
                        <span className={`material-symbols-outlined text-sm ${currentReasoning.color} animate-spin`}>
                            {currentReasoning.id === 'DEBATE' ? 'sync' : 
                             currentReasoning.id === 'RESEARCH' ? 'public' : 'hourglass_top'}
                        </span>
                        <div className="flex flex-col">
                            <span className="font-mono font-bold text-slate-400">
                                {activeTask?.status === 'processing' 
                                    ? activeTask.stage.toUpperCase() 
                                    : 'PROCESSING'}
                            </span>
                            <span className="text-[10px] text-slate-600">
                                {activeTask?.status === 'processing' ? activeTask.message : "Orchestrating..."}
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Control Deck) */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 shrink-0">
                {/* 1. Agentic Control Bar (Above Input) */}
                <div className="flex items-center space-x-2 mb-2 px-1 relative">
                    
                    {/* Model Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => { setShowModelMenu(!showModelMenu); setShowReasoningMenu(false); }}
                            className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">smart_toy</span>
                            <span>{activeModel}</span>
                            <span className="material-symbols-outlined text-xs">expand_less</span>
                        </button>
                        {showModelMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-2 bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500">SELECT INTELLIGENCE</div>
                                {MODEL_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onSetModel(opt.id); setShowModelMenu(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-800 transition-colors ${activeModel === opt.id ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-300'}`}
                                    >
                                        <span className="font-bold">{opt.label}</span>
                                        <span className="text-[9px] text-slate-500">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reasoning Strategy Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => { setShowReasoningMenu(!showReasoningMenu); setShowModelMenu(false); }}
                            className={`flex items-center space-x-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 transition-colors ${currentReasoning.color}`}
                        >
                            <span className="material-symbols-outlined text-sm">{currentReasoning.icon}</span>
                            <span>{currentReasoning.label.split('(')[0].trim()}</span>
                            <span className="material-symbols-outlined text-xs">expand_less</span>
                        </button>
                        {showReasoningMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-2 bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500">AGENTIC WORKFLOW</div>
                                {REASONING_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onSetReasoningMode(opt.id); setShowReasoningMenu(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-slate-800 transition-colors ${reasoningMode === opt.id ? 'bg-slate-800/50' : ''}`}
                                    >
                                        <span className={`material-symbols-outlined text-sm ${opt.color}`}>{opt.icon}</span>
                                        <span className={reasoningMode === opt.id ? 'text-white' : 'text-slate-400'}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <span className="text-[9px] text-slate-600 border-l border-slate-800 pl-2 ml-2">
                        {llmProvider} BRIDGE
                    </span>
                </div>

                {/* 2. Attachment Preview */}
                {attachment && (
                    <div className="mb-2 flex items-center bg-slate-900/80 p-2 rounded border border-slate-700 w-fit animate-slide-in-right">
                        <img src={attachment.preview} alt="Preview" className="h-10 w-10 object-cover rounded mr-2" />
                        <span className="text-[10px] text-slate-300 mr-2">Visual Context Added</span>
                        <button onClick={() => setAttachment(null)} className="text-slate-500 hover:text-red-400">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}

                {/* 3. Main Input Area */}
                <div className="max-w-4xl mx-auto relative flex items-end space-x-2">
                    {onToggleMute && (
                        <button 
                            onClick={onToggleMute}
                            className={`p-3 bg-slate-900 border border-slate-800 rounded-xl transition-colors h-[46px] ${isMuted ? 'text-slate-600' : 'text-cyan-400'}`}
                            title={isMuted ? "Unmute Voice" : "Mute Voice"}
                        >
                            <span className="material-symbols-outlined">{isMuted ? 'volume_off' : 'volume_up'}</span>
                        </button>
                    )}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-cyan-400 transition-colors h-[46px]"
                        title="Attach Image"
                    >
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileSelect}
                    />
                    
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            className={`w-full bg-slate-900 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 border ${isThinking ? 'border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-slate-800'} font-mono shadow-inner transition-all`}
                            placeholder={`Direct ${activeModel} via ${reasoningMode} Protocol...`}
                            onKeyDown={handleKeyDown}
                        />
                        {/* Neural Spark Input Indicator */}
                        {isThinking && (
                            <div className="absolute bottom-0 left-4 right-12 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-[shimmer_2s_infinite]"></div>
                        )}
                        <button 
                            onClick={() => { 
                                if(inputRef.current?.value || attachment) { 
                                    onSendMessage(inputRef.current?.value || "", attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined); 
                                    if (inputRef.current) inputRef.current.value='';
                                    setAttachment(null);
                                } 
                            }}
                            className="absolute right-2 top-2 p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
