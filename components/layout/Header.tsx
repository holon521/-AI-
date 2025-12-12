
import React from 'react';

interface HeaderProps {
    isSwarmActive: boolean;
    onShowSettings: () => void;
    onShowSpec: () => void;
    onToggleCanvas: () => void;
    isCanvasOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    isSwarmActive, 
    onShowSettings, 
    onShowSpec,
    onToggleCanvas,
    isCanvasOpen
}) => {
    return (
        <div className="absolute top-0 left-0 right-0 h-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur z-20 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-cyan-500">fingerprint</span>
                <span className="text-sm font-bold tracking-widest text-slate-200">ZIA: HOLON WORLD</span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Core v2.5</span>
            </div>
            
            {/* Center: System Status / Notifications could go here */}

            <div className="flex items-center space-x-2">
                {isSwarmActive && (
                    <div className="flex items-center text-green-400 text-[10px] font-bold animate-pulse mr-4 px-2 py-1 bg-green-900/10 rounded border border-green-900/30">
                        <span className="material-symbols-outlined text-sm mr-1">hub</span>SWARM ACTIVE
                    </div>
                )}
                
                {/* Workbench Toggle (Explicitly Restored) */}
                <button 
                    onClick={onToggleCanvas} 
                    className={`flex items-center space-x-1 px-3 py-1 rounded transition-all border ${
                        isCanvasOpen 
                        ? 'bg-purple-900/30 border-purple-500/50 text-purple-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                    }`}
                    title="Toggle Artifact Workbench"
                >
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span className="text-[10px] font-bold">WORKBENCH</span>
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-2"></div>

                <button onClick={onShowSpec} className="text-slate-500 hover:text-white transition-colors p-1" title="System Specifications">
                    <span className="material-symbols-outlined text-lg">architecture</span>
                </button>
                <button onClick={onShowSettings} className="text-slate-500 hover:text-white transition-colors p-1" title="Settings">
                    <span className="material-symbols-outlined text-lg">settings</span>
                </button>
            </div>
        </div>
    );
};
