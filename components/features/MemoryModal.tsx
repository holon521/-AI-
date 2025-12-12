
import React, { useState, useMemo, useEffect } from 'react';
import { CognitiveGraph } from '../shared/CognitiveGraph';
import { MemoryType, orchestrator, MemoryNode } from '../../02_CORTEX/memory_orchestrator';

interface MemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilter: MemoryType | null;
    activeStage?: string; 
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose, initialFilter, activeStage }) => {
    const [activeFilter, setActiveFilter] = useState<MemoryType | null>(initialFilter);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [memoryList, setMemoryList] = useState<MemoryNode[]>([]);

    useEffect(() => {
        if(isOpen) {
            setActiveFilter(initialFilter);
            setMemoryList(orchestrator.getAllMemories());
        } else {
            setSelectedNodeId(null);
            setSearchQuery('');
        }
    }, [isOpen, initialFilter]);

    // Derived List based on filter and search
    const filteredList = useMemo(() => {
        let result = memoryList;
        if (activeFilter) {
            result = result.filter(n => n.metadata.type === activeFilter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n => n.pageContent.toLowerCase().includes(q));
        }
        return result;
    }, [memoryList, activeFilter, searchQuery]);

    const handleNodeSelect = (id: string) => {
        setSelectedNodeId(id);
        // Scroll list to this item
        const el = document.getElementById(`mem-item-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                
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

                {/* Split Content */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left: Interactive Graph (65%) */}
                    <div className="flex-[2] relative bg-[#020617] border-r border-slate-900">
                        <CognitiveGraph 
                            filter={activeFilter} 
                            activeStage={activeStage} 
                            selectedNodeId={selectedNodeId}
                            onNodeSelect={handleNodeSelect}
                        />
                        <div className="absolute bottom-4 left-4 p-2 bg-slate-900/80 rounded border border-slate-800 backdrop-blur pointer-events-none text-[9px] text-slate-500">
                            VISUALIZER MODE
                        </div>
                    </div>

                    {/* Right: Chronological List (35%) */}
                    <div className="flex-1 bg-slate-950 flex flex-col min-w-[300px]">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-slate-900">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search Memory Stream..." 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 pl-8 text-xs text-slate-300 focus:border-cyan-500/50 focus:outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <span className="material-symbols-outlined absolute left-2 top-2 text-slate-600 text-sm">search</span>
                            </div>
                        </div>

                        {/* List Stream */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {filteredList.length === 0 && (
                                <div className="text-center text-slate-600 text-xs py-10 italic">No memories found.</div>
                            )}
                            {filteredList.map(node => (
                                <div 
                                    key={node.id}
                                    id={`mem-item-${node.id}`}
                                    onClick={() => setSelectedNodeId(node.id)}
                                    className={`p-3 rounded border cursor-pointer transition-all ${
                                        selectedNodeId === node.id 
                                        ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                node.metadata.type === 'IDENTITY' ? 'bg-purple-500' :
                                                node.metadata.type === 'USER_CONTEXT' ? 'bg-cyan-500' : 'bg-green-500'
                                            }`}></span>
                                            <span className={`text-[9px] font-bold ${
                                                node.metadata.type === 'IDENTITY' ? 'text-purple-400' :
                                                node.metadata.type === 'USER_CONTEXT' ? 'text-cyan-400' : 'text-green-400'
                                            }`}>{node.metadata.type}</span>
                                        </div>
                                        <span className="text-[8px] text-slate-600 font-mono">
                                            {new Date(node.metadata.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-mono">
                                        {node.pageContent}
                                    </div>
                                    {selectedNodeId === node.id && (
                                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-[9px] text-slate-500">
                                            <span>Logic: {(node.metadata.logicScore * 100).toFixed(0)}%</span>
                                            <span>{node.metadata.source.substring(0, 15)}...</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
