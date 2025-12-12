
import React, { useState } from 'react';

interface RemoteDesktopProps {
    url: string;
    onClose: () => void;
}

export const RemoteDesktop: React.FC<RemoteDesktopProps> = ({ url, onClose }) => {
    const [loading, setLoading] = useState(true);
    
    // Determine app type from URL or just generic
    const appTitle = url.includes('ngrok') ? "SECURE TUNNEL (Jupyter/n8n)" : "REMOTE DESKTOP";

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
            <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shadow-lg shrink-0">
                <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-orange-500 animate-pulse text-lg">terminal</span>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{appTitle}</span>
                        <div className="flex items-center space-x-2">
                             <span className="text-[9px] text-slate-500 font-mono hidden md:inline-block max-w-[200px] truncate">{url}</span>
                             {/* AI Control Indicator: Shows the user that AI is still working in the background */}
                             <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-green-900/20 rounded border border-green-900/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[8px] font-bold text-green-400">AI CONTROL: ACTIVE (BACKEND)</span>
                             </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                     <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-900/30 border border-cyan-700/50 text-cyan-400 rounded text-[10px] font-bold hover:bg-cyan-900/50 transition-all"
                     >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        <span>OPEN IN BROWSER</span>
                     </a>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded border border-slate-700 hover:bg-slate-700">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 relative bg-[#111] overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
                        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-mono">ESTABLISHING VISUAL FEED...</p>
                        <p className="text-[9px] text-slate-600 mt-2">Connecting to Neural Swarm...</p>
                    </div>
                )}
                
                {/* Overlay Instruction for Ngrok Free Users */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-slate-300 px-6 py-4 rounded-xl text-xs z-20 backdrop-blur-md border border-slate-700/50 shadow-2xl text-center max-w-sm pointer-events-none">
                    <div className="flex items-center justify-center text-amber-500 font-bold mb-2">
                        <span className="material-symbols-outlined mr-1">security</span>
                        SECURITY GATE CHECK
                    </div>
                    <p className="mb-2">
                        If you see a <b className="text-white bg-slate-700 px-1 rounded mx-1">Visit Site</b> button below,<br/>
                        please click it to enable the <b>Visual Feed</b>.
                    </p>
                    <div className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 text-left">
                        <div className="flex items-start space-x-2">
                             <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                             <div>
                                <span className="text-green-400 font-bold">SYSTEM STATUS:</span><br/>
                                ZIA is already connected via Backend.<br/>
                                This step is only for <b>your eyes</b>.
                             </div>
                        </div>
                    </div>
                </div>

                <iframe 
                    src={url} 
                    className={`w-full h-full border-none relative z-10 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} 
                    onLoad={() => setLoading(false)} 
                    allow="clipboard-read; clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
            </div>
        </div>
    );
};
