
import React from 'react';
import { MemoryType } from '../../memory_orchestrator';

interface RightPanelProps {
    memoryStats: { identity: number; user: number; world: number; };
    activeSectors: MemoryType[];
    isSwarmActive: boolean;
    swarmMemoryStatus: string;
    swarmVectorCount: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
    memoryStats, 
    activeSectors, 
    isSwarmActive, 
    swarmMemoryStatus, 
    swarmVectorCount 
}) => {
    return (
        <div className="w-72 border-l border-slate-900 pt-16 hidden md:flex flex-col bg-slate-950 z-10 shrink-0 transition-all duration-300">
            {/* Section 1: Memory Stats */}
            <div className="p-4 border-b border-slate-900">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">memory</span>MEMORY ORCHESTRATOR
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500">IDENTITY</div>
                        <div className="text-lg font-mono text-purple-400">{memoryStats.identity}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="text-[9px] text-slate-500">USER CTX</div>
                        <div className="text-lg font-mono text-cyan-400">{memoryStats.user}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 col-span-2">
                        <div className="text-[9px] text-slate-500">WORLD KNOWLEDGE</div>
                        <div className="text-lg font-mono text-emerald-400">{memoryStats.world}</div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="text-[9px] text-slate-500 mb-1">ACTIVE SECTORS</div>
                    <div className="flex flex-wrap gap-1">
                        {activeSectors.length > 0 ? activeSectors.map(s => (
                            <span key={s} className="px-2 py-1 bg-slate-800 rounded text-[9px] text-slate-300 border border-slate-700 animate-fade-in">{s}</span>
                        )) : <span className="text-[9px] text-slate-600 italic">Idle</span>}
                    </div>
                </div>
            </div>

            {/* Section 2: Swarm Status */}
            <div className="p-4 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">hub</span>COMPUTE SWARM
                </h3>

                <div className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all duration-500 ${isSwarmActive ? 'bg-green-900/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-900/50 border-slate-800/30'}`}>
                    <span className={`material-symbols-outlined text-4xl mb-2 transition-colors duration-300 ${isSwarmActive ? 'text-green-500 animate-pulse' : 'text-slate-700'}`}>
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
                            <span>FDE Vectors</span>
                            <span className="font-mono text-green-400">{swarmVectorCount.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                            <span>Latency</span>
                            <span className="font-mono text-green-400">~1.5s</span>
                        </div>
                        <div className="text-[9px] text-slate-600 text-center mt-2 italic">
                            Running on Google Colab (Python 3.10)
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
