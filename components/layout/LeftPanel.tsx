
import React from 'react';
import { TaskLog } from '../../types';

interface LeftPanelProps {
    taskLog: TaskLog[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ taskLog }) => {
    return (
        <div className="w-64 border-r border-slate-900 pt-16 hidden md:flex flex-col bg-slate-950 z-10 shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-900 bg-slate-950">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">smart_toy</span>AGENT MANAGER
                    </h3>
                    <span className="text-[9px] bg-slate-800 px-1.5 rounded text-slate-400">{taskLog.length}</span>
                </div>
            </div>

            {/* Task List (Agent Workflow) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 relative">
                {taskLog.length === 0 && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                        {/* Idle Visualization (Heartbeat) - Restored Visual Feedback */}
                        <div className="flex space-x-1 mb-2 h-8 items-end">
                            <div className="w-1 bg-cyan-500 h-2 animate-[bounce_1s_infinite]"></div>
                            <div className="w-1 bg-cyan-500 h-4 animate-[bounce_1.2s_infinite]"></div>
                            <div className="w-1 bg-cyan-500 h-3 animate-[bounce_0.8s_infinite]"></div>
                            <div className="w-1 bg-cyan-500 h-5 animate-[bounce_1.5s_infinite]"></div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">AGENTS STANDBY</div>
                        <div className="text-[8px] text-slate-700 mt-1">Waiting for Signal...</div>
                     </div>
                )}
                {taskLog.slice().reverse().map((task) => (
                    <div key={task.id} className="group relative pl-4 pr-2 py-2 border-l-2 border-slate-800 hover:border-cyan-500 transition-colors bg-slate-900/30 rounded-r mb-1 animate-slide-in-right">
                        <div className="flex justify-between items-start">
                            <span className={`text-[9px] font-bold uppercase ${
                                task.status === 'processing' ? 'text-cyan-400 animate-pulse' : 
                                task.status === 'failed' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                                {task.stage}
                            </span>
                            <span className="text-[8px] text-slate-600 font-mono">{new Date(task.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 leading-tight">{task.message}</div>
                        {task.details && (
                            <div className="mt-1 text-[9px] text-slate-500 font-mono bg-slate-950 p-1 rounded hidden group-hover:block">
                                {task.details}
                            </div>
                        )}
                        {/* Status Dot */}
                        <div className={`absolute left-[-5px] top-2.5 w-2 h-2 rounded-full border-2 border-slate-950 ${
                             task.status === 'processing' ? 'bg-cyan-500' : 
                             task.status === 'completed' ? 'bg-emerald-500' : 
                             task.status === 'failed' ? 'bg-red-500' : 'bg-slate-700'
                        }`}></div>
                    </div>
                ))}
            </div>
            
            <div className="mt-auto p-4 border-t border-slate-900 bg-slate-950">
                <div className="flex items-center space-x-2 text-[9px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                    <span>System Nominal</span>
                </div>
            </div>
        </div>
    );
};
