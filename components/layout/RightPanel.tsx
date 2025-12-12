
import React, { useState } from 'react';
import { MemoryType } from '../../02_CORTEX/memory_orchestrator';
import { MemoryModal } from '../features/MemoryModal';
import { TaskLog } from '../../types';

interface RightPanelProps {
    memoryStats: { identity: number; user: number; world: number; total: number; synced: number; };
    activeSectors: MemoryType[];
    isSwarmActive: boolean;
    swarmMemoryStatus: string;
    swarmVectorCount: number;
    activeTaskLog: TaskLog[]; // [NEW]
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
            {/* Section 1: Memory Compact View */}
            <div className="p-4 border-b border-slate-900">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">hub</span>MEMORY TOPOLOGY
                    </h3>
                    <div className="flex space-x-1 items-center bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <span className="text-[10px] text-white font-mono font-bold">{memoryStats.total}</span>
                        <span className="text-[10px] text-slate-600">/</span>
                        <span className="text-[10px] text-green-500 font-mono font-bold">{memoryStats.synced}</span>
                    </div>
                </div>
                
                {/* 3 Clickable Boxes */}
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => openModal('IDENTITY')}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded transition-all group relative overflow-hidden"
                    >
                        {currentActiveStage === 'MEMORY' && <div className="absolute inset-0 bg-purple-500/10 animate-pulse"></div>}
                        <span className="text-[9px] text-slate-500 group-hover:text-purple-400 mb-1">IDENTITY</span>
                        <span className="text-sm font-mono font-bold text-slate-300 group-hover:text-white">{memoryStats.identity}</span>
                    </button>

                    <button 
                        onClick={() => openModal('USER_CONTEXT')}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded transition-all group relative overflow-hidden"
                    >
                         {currentActiveStage === 'MEMORY' && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse delay-75"></div>}
                        <span className="text-[9px] text-slate-500 group-hover:text-cyan-400 mb-1">USER</span>
                        <span className="text-sm font-mono font-bold text-slate-300 group-hover:text-white">{memoryStats.user}</span>
                    </button>

                    <button 
                        onClick={() => openModal('WORLD_KNOWLEDGE')}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-green-500/50 rounded transition-all group relative overflow-hidden"
                    >
                         {currentActiveStage === 'MEMORY' && <div className="absolute inset-0 bg-green-500/10 animate-pulse delay-150"></div>}
                        <span className="text-[9px] text-slate-500 group-hover:text-green-400 mb-1">WORLD</span>
                        <span className="text-sm font-mono font-bold text-slate-300 group-hover:text-white">{memoryStats.world}</span>
                    </button>
                </div>

                <div className="mt-3 text-[9px] text-slate-600 text-center italic cursor-pointer hover:text-cyan-400" onClick={() => openModal(null)}>
                    Click specific sector to visualize graph
                </div>
            </div>

            {/* Section 2: Swarm Status */}
            <div className="p-4 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">dns</span>COMPUTE SWARM
                </h3>

                <div className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all duration-500 ${isSwarmActive ? 'bg-green-900/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-900/50 border-slate-800/30'}`}>
                    <span className={`material-symbols-outlined text-4xl mb-2 transition-colors duration-300 ${isSwarmActive ? 'text-green-500 animate-pulse' : 'text-slate-700'} ${currentActiveStage === 'SWARM' ? 'animate-spin' : ''}`}>
                        {isSwarmActive ? 'api' : 'cloud_off'}
                    </span>
                    <div className={`text-xs font-bold transition-colors duration-300 ${isSwarmActive ? 'text-green-400' : 'text-slate-500'}`}>
                        {isSwarmActive ? 'SWARM ONLINE' : 'DISCONNECTED'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1 text-center">{swarmMemoryStatus}</div>
                </div>

                {isSwarmActive && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                            <span>Vector DB (Remote)</span>
                            <span className="font-mono text-green-400">{swarmVectorCount.toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] text-slate-600 text-center mt-2 italic">
                            Syncing via Drive Bridge...
                        </div>
                    </div>
                )}
            </div>
            
            <MemoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                initialFilter={selectedFilter}
                activeStage={currentActiveStage} // [NEW] Pass the active thinking stage
            />
        </div>
    );
};
