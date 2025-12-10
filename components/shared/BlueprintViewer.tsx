
import React, { useState } from 'react';
import { SPECS, SpecKey } from '../../spec_loader';

interface BlueprintViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SpecKey>('00_MASTER_PLAN.md');
    
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="text-sm font-bold text-slate-200">ZIA SPECKIT VIEWER</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                    {(Object.keys(SPECS) as SpecKey[]).map((key) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-3 text-xs font-mono border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{key}</button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar bg-[#0d1117]">
                    <pre className="whitespace-pre-wrap font-sans">{SPECS[activeTab]}</pre>
                </div>
            </div>
        </div>
    );
};
