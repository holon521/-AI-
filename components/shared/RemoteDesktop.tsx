
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
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shadow-lg">
                <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-orange-500 animate-pulse text-sm">terminal</span>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{appTitle}</span>
                </div>
                <div className="flex items-center space-x-3">
                     <span className="text-[9px] text-slate-500 font-mono hidden md:inline-block">{url}</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
            </div>
            <div className="flex-1 relative bg-[#111]">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
                        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-mono">ESTABLISHING NGROK TUNNEL...</p>
                        <p className="text-[9px] text-slate-600 mt-2">This may take 5-10 seconds</p>
                    </div>
                )}
                {/* z-10 ensures iframe sits on top of loader when loaded */}
                <iframe 
                    src={url} 
                    className={`w-full h-full border-none relative z-10 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} 
                    onLoad={() => setLoading(false)} 
                    allow="clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
};
