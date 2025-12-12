
import React from 'react';
import { CognitiveGraph } from '../shared/CognitiveGraph';
import { MemoryType } from '../../02_CORTEX/memory_orchestrator';

interface MemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilter: MemoryType | null;
    activeStage?: string; // [NEW]
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, initialFilter, activeStage }) => {
    const [activeFilter, setActiveFilter] = React.useState<MemoryType | null>(initialFilter);

    // Update filter if prop changes when opening
    React.useEffect(() => {
        if(isOpen) setActiveFilter(initialFilter);
    }, [isOpen, initialFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="h-12 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-sm font-bold text-slate-200 flex items-center">
                            <span className="material-symbols-outlined mr-2 text-cyan-500">hub</span>
                            MEMORY TOPOLOGY VIEWER
                        </h2>
                        {/* Filter Tabs */}
                        <div className="flex space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
                            <button onClick={() => setActiveFilter(null)} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!activeFilter ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>ALL</button>
                            <button onClick={() => setActiveFilter('IDENTITY')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${activeFilter === 'IDENTITY' ? 'bg-purple-900/50 text-purple-300 border border-purple-800' : 'text-slate-500 hover:text-purple-300'}`}>IDENTITY</button>
                            <button onClick={() => setActiveFilter('USER_CONTEXT')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${activeFilter === 'USER_CONTEXT' ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800' : 'text-slate-500 hover:text-cyan-300'}`}>USER</button>
                            <button onClick={() => setActiveFilter('WORLD_KNOWLEDGE')} className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${activeFilter === 'WORLD_KNOWLEDGE' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'text-slate-500 hover:text-green-300'}`}>WORLD</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                         {activeStage && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-slate-800 rounded border border-slate-700 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                <span className="text-[9px] font-bold text-cyan-400 uppercase">{activeStage} ACTIVE</span>
                            </div>
                        )}
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Graph Container */}
                <div className="flex-1 relative bg-[#020617]">
                    <CognitiveGraph filter={activeFilter} activeStage={activeStage} />
                    
                    <div className="absolute top-4 left-4 p-3 bg-slate-900/80 rounded border border-slate-800 backdrop-blur pointer-events-none">
                        <div className="text-[10px] text-slate-400 font-mono mb-1">INTERACTION MODE</div>
                        <ul className="text-[9px] text-slate-500 space-y-1">
                            <li>• Hover to stabilize nodes</li>
                            <li>• Click node to inspect content</li>
                            <li>• Switch tabs to filter topology</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
