
import React from 'react';
import { GraphNode } from '../../types';

interface LeftPanelProps {
    nodes: GraphNode[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ nodes }) => {
    return (
        <div className="w-64 border-r border-slate-900 pt-16 hidden md:flex flex-col bg-slate-950 z-10 shrink-0">
            <div className="p-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center">
                     <span className="material-symbols-outlined text-sm mr-1">account_tree</span>COGNITIVE GRAPH
                </h3>
                <div className="space-y-3 relative pl-2">
                    <div className="absolute left-[13px] top-2 bottom-4 w-px bg-slate-800/50"></div>
                    {nodes.map((node) => (
                        <div key={node.id} className="relative flex items-center space-x-3 group">
                            <div className={`z-10 w-6 h-6 rounded-md flex items-center justify-center border transition-all duration-300 ${
                                node.status === 'active' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 
                                node.status === 'completed' ? 'bg-slate-900 border-slate-700 text-slate-500' :
                                'bg-slate-950 border-slate-800 text-slate-700'
                            }`}>
                                <span className={`material-symbols-outlined text-[12px] ${node.status === 'active' ? 'animate-spin' : ''}`}>
                                    {node.status === 'completed' ? 'check' : node.status === 'active' ? 'progress_activity' : 'circle'}
                                </span>
                            </div>
                            <span className={`text-[10px] uppercase font-bold transition-colors ${
                                node.status === 'active' ? 'text-cyan-300' : 
                                node.status === 'completed' ? 'text-slate-400' :
                                'text-slate-700'
                            }`}>
                                {node.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-slate-900">
                <div className="text-[9px] text-slate-600">
                    <div className="mb-1 font-bold">ZIA IDENTITY:</div>
                    <div className="font-mono text-slate-500">The Architect</div>
                </div>
            </div>
        </div>
    );
};
