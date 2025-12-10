
import React from 'react';

interface HeaderProps {
    isSwarmActive: boolean;
    onShowSettings: () => void;
    onShowSpec: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSwarmActive, onShowSettings, onShowSpec }) => {
    return (
        <div className="absolute top-0 left-0 right-0 h-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur z-20 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-cyan-500">fingerprint</span>
                <span className="text-sm font-bold tracking-widest text-slate-200">ZIA: HOLON WORLD</span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Core v2.1</span>
            </div>
            <div className="flex items-center space-x-4">
                {isSwarmActive && (
                    <div className="flex items-center text-green-400 text-[10px] font-bold animate-pulse mr-2">
                        <span className="material-symbols-outlined text-sm mr-1">hub</span>SWARM ACTIVE
                    </div>
                )}
                <button onClick={onShowSettings} className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
                <button onClick={onShowSpec} className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">architecture</span>
                </button>
            </div>
        </div>
    );
};
