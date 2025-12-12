import React, { useState } from 'react';
import { MemoryType } from '../../02_CORTEX/memory_orchestrator';
import { MemoryModal } from '../features/MemoryModal';
import { TaskLog } from '../../types';
import { CognitiveGraph } from '../shared/CognitiveGraph'; // Import the graph

interface RightPanelProps {
    memoryStats: { identity: number; user: number; world: number; total: number; synced: number; };
    activeSectors: MemoryType[];
    isSwarmActive: boolean;
    swarmMemoryStatus: string;
    swarmVectorCount: number;
    activeTaskLog: TaskLog[]; 
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
    memoryStats, 
    activeSectors, 
    isSwarmActive, 
    swarmMemoryStatus, 
    swarmVectorCount,
    activeTaskLog
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<MemoryType | null>(null);

    // Determine current active stage from the latest processing task
    const currentActiveStage = activeTaskLog.slice().reverse().find(t => t.status === 'processing')?.stage;

    const openModal = (filter: MemoryType | null) => {
        setSelectedFilter(filter);
        setIsModalOpen(true);
    };

    return (
        <div className="w-72 border-l border-slate-900 pt-16 hidden md:flex flex-col bg-slate-950 z-10 shrink-0 transition-all duration-300">
            {/* Section 1: Memory Live Topology (The Visible Brain) */}
            <div className="h-64 border-b border-slate-900 relative group overflow-hidden bg-[#050a15]">
                {/* Embedded Mini Graph */}
                <div className="absolute inset-0 z-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <CognitiveGraph mini={true} activeStage={currentActiveStage} />
                </div>

                {/* HUD Overlay */}
                <div className="absolute inset-0 z-10 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center bg-slate-950/50 px-1 rounded backdrop-blur">
                            <span className="material-symbols-outlined text-sm mr-1">hub</span>CORTEX
                        </h3>
                        <div className="flex space-x-1 items-center bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur">
                            <span className="text-[9px] text-white font-mono font-bold">{memoryStats.total}</span>
                            <span className="text-[9px] text-slate-600">/</span>
                            <span className="text-[9px] text-green-500 font-mono font-bold">{memoryStats.synced}</span>
                        </div>
                    </div>

                    {/* Stats Buttons (Clickable via pointer-events-auto) */}
                    <div className="grid grid-cols-3 gap-2 pointer-events-auto">
                        <button 
                            onClick={() => openModal('IDENTITY')}
                            className="flex flex-col items-center justify-center p-2 bg-slate-900/80 hover:bg-slate-800 border border-purple-900/30 hover:border-purple-500/50 rounded backdrop-blur transition-all"
                        >
                            <span className="text-[8px] text-purple-400 font-bold mb-0.5">ID</span>
                            <span className="text-xs font-mono text-white">{memoryStats.identity}</span>
                        </button>

                        <button 
                            onClick={() => openModal('USER_CONTEXT')}
                            className="flex flex-col items-center justify-center p-2 bg-slate-900/80 hover:bg-slate-800 border border-cyan-900/30 hover:border-cyan-500/50 rounded backdrop-blur transition-all"
                        >
                            <span className="text-[8px] text-cyan-400 font-bold mb-0.5">USER</span>
                            <span className="text-xs font-mono text-white">{memoryStats.user}</span>
                        </button>

                        <button 
                            onClick={() => openModal('WORLD_KNOWLEDGE')}
                            className="flex flex-col items-center justify-center p-2 bg-slate-900/80 hover:bg-slate-800 border border-green-900/30 hover:border-green-500/50 rounded backdrop-blur transition-all"
                        >
                            <span className="text-[8px] text-green-400 font-bold mb-0.5">WRLD</span>
                            <span className="text-xs font-mono text-white">{memoryStats.world}</span>
                        </button>
                    </div>
                </div>
                
                {/* Fullscreen Hint */}
                <div 
                    className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 cursor-pointer pointer-events-auto"
                    onClick={() => openModal(null)}
                >
                    <span className="text-[10px] font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20 backdrop-blur">
                        EXPAND VIEW
                    </span>
                </div>
            </div>

            {/* Section 2: Opal Engine (The Body) */}
            <div className="p-4 flex-1 bg-slate-950 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">all_inclusive</span>OPAL ENGINE
                    </h3>
                    {isSwarmActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>}
                </div>

                {/* Opal Trinity Grid */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                    
                    {/* 1. COMPUTE (Colab) */}
                    <div className={`p-2 rounded border flex items-center justify-between transition-all ${isSwarmActive ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 ${isSwarmActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                                <span className="material-symbols-outlined text-sm">memory</span>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-slate-400">COMPUTE</div>
                                <div className="text-[8px] text-slate-500">Google Colab</div>
                            </div>
                        </div>
                        <div className="text-[8px] font-mono text-right">
                            {isSwarmActive ? <span className="text-cyan-400">ONLINE</span> : <span className="text-slate-600">OFFLINE</span>}
                        </div>
                    </div>

                    {/* 2. STORAGE (Drive) */}
                    <div className={`p-2 rounded border flex items-center justify-between transition-all ${isSwarmActive ? 'bg-slate-900/80 border-green-500/30' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 ${isSwarmActive ? 'text-green-400' : 'text-slate-600'}`}>
                                <span className="material-symbols-outlined text-sm">hard_drive</span>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-slate-400">STORAGE</div>
                                <div className="text-[8px] text-slate-500">Google Drive</div>
                            </div>
                        </div>
                        <div className="text-[8px] font-mono text-right">
                            {isSwarmActive ? <span className="text-green-400">LINKED</span> : <span className="text-slate-600">--</span>}
                        </div>
                    </div>

                    {/* 3. WORKFLOW (n8n) */}
                    <div className={`p-2 rounded border flex items-center justify-between transition-all ${isSwarmActive ? 'bg-slate-900/80 border-rose-500/30' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 ${isSwarmActive ? 'text-rose-400' : 'text-slate-600'}`}>
                                <span className="material-symbols-outlined text-sm">schema</span>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-slate-400">WORKFLOW</div>
                                <div className="text-[8px] text-slate-500">n8n Automation</div>
                            </div>
                        </div>
                        <div className="text-[8px] font-mono text-right">
                            {isSwarmActive ? <span className="text-rose-400">STANDBY</span> : <span className="text-slate-600">--</span>}
                        </div>
                    </div>
                </div>

                {isSwarmActive && (
                    <div className="mt-auto pt-3 border-t border-slate-900 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                            <span>Vector Memory</span>
                            <span className="font-mono text-green-400">{swarmVectorCount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                        <div className="text-[9px] text-slate-600 text-center mt-2 italic">
                            {swarmMemoryStatus}
                        </div>
                    </div>
                )}
            </div>
            
            <MemoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                initialFilter={selectedFilter}
                activeStage={currentActiveStage}
            />
        </div>
    );
};