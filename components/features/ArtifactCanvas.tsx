
import React, { useState, useEffect, useRef } from 'react';

interface ArtifactCanvasProps {
    isOpen: boolean;
    content: string | null;
    visualArtifact?: { image?: string; html?: string; logs?: string };
    onClose: () => void;
    onSignal?: (type: string, payload: any) => void; // Bridge to Kernel
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({ isOpen, content, visualArtifact, onClose, onSignal }) => {
    const [viewMode, setViewMode] = useState<'CODE' | 'PREVIEW' | 'TERMINAL'>('PREVIEW');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Auto-switch based on available content
    useEffect(() => {
        if (visualArtifact?.logs && !visualArtifact.image && !visualArtifact.html) {
             setViewMode('TERMINAL');
        } else if (visualArtifact?.image || visualArtifact?.html) {
            setViewMode('PREVIEW');
        } else {
            setViewMode('CODE');
        }
    }, [visualArtifact]);

    // [FRACTAL SANDBOX PROTOCOL]
    // Listen for messages from the iframe (Micro-App)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Security: In production, check event.origin
            if (!event.data || typeof event.data !== 'object') return;
            
            const { type, ...payload } = event.data;
            if (type?.startsWith('ZIA_') && onSignal) {
                console.log(`[ArtifactCanvas] Signal Received: ${type}`, payload);
                onSignal(type, payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSignal]);

    // Inject the ZIA Client SDK into the HTML
    const getSandboxedSrc = (rawHtml: string) => {
        const sdkScript = `
            <script>
                window.ZIA = {
                    save: (key, value) => window.parent.postMessage({ type: 'ZIA_SAVE', key, value }, '*'),
                    say: (text) => window.parent.postMessage({ type: 'ZIA_SAY', text }, '*'),
                    compute: (code) => window.parent.postMessage({ type: 'ZIA_COMPUTE', code }, '*')
                };
                console.log("[Micro-App] ZIA SDK Injected.");
            </script>
        `;
        return rawHtml + sdkScript;
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-12 bottom-0 w-full md:w-1/2 lg:w-2/5 border-l border-slate-700/50 bg-slate-950/90 backdrop-blur-md flex flex-col animate-slide-in-right z-30 shadow-2xl">
            {/* Header (Glass Workbench) */}
            <div className="h-10 border-b border-slate-700/50 flex items-center justify-between px-4 bg-slate-900/50">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-orange-400 text-sm">construction</span>
                        <span className="text-xs font-bold text-slate-200 tracking-widest">WORKBENCH</span>
                    </div>
                    
                    {/* View Switcher */}
                    <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800">
                        <button 
                            onClick={() => setViewMode('CODE')}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${viewMode === 'CODE' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >CODE</button>
                        <button 
                            onClick={() => setViewMode('PREVIEW')}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${viewMode === 'PREVIEW' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >PREVIEW</button>
                        <button 
                            onClick={() => setViewMode('TERMINAL')}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${viewMode === 'TERMINAL' ? 'bg-slate-800 text-green-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >TERMINAL</button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-[9px] text-slate-500 font-mono hidden sm:block">
                        {visualArtifact?.image ? 'IMG' : visualArtifact?.html ? 'HTML' : 'RAW'}
                    </div>
                    <button onClick={onClose}><span className="material-symbols-outlined text-sm text-slate-500 hover:text-white transition-colors">close</span></button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-[#0d1117] relative custom-scrollbar">
                
                {/* 1. CODE VIEW */}
                {viewMode === 'CODE' && (
                    <div className="p-4">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{content || "// No code content available"}</pre>
                    </div>
                )}

                {/* 2. PREVIEW VIEW */}
                {viewMode === 'PREVIEW' && (
                    <div className="h-full flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        {visualArtifact?.image ? (
                            <div className="bg-white p-2 rounded shadow-2xl max-w-full overflow-hidden border border-slate-700 animate-fade-in">
                                <img src={`data:image/png;base64,${visualArtifact.image}`} alt="Visual Output" className="max-w-full h-auto" />
                            </div>
                        ) : visualArtifact?.html ? (
                            <div className="w-full h-full bg-white rounded shadow-2xl overflow-hidden border border-slate-700 animate-fade-in">
                                <iframe 
                                    ref={iframeRef}
                                    srcDoc={getSandboxedSrc(visualArtifact.html)}
                                    className="w-full h-full border-none"
                                    sandbox="allow-scripts allow-forms allow-popups allow-modals"
                                    title="ZIA Micro-App"
                                />
                            </div>
                        ) : (
                            <div className="text-slate-600 text-xs italic flex flex-col items-center border border-slate-800 p-8 rounded-xl bg-slate-900/50">
                                <span className="material-symbols-outlined mb-2 text-2xl opacity-50">preview_off</span>
                                <span>No Visual Artifact Generated</span>
                                <span className="text-[9px] mt-2 text-slate-700">Try running code that outputs a plot or HTML.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TERMINAL VIEW */}
                {viewMode === 'TERMINAL' && (
                    <div className="h-full p-4 font-mono text-xs bg-[#0a0a0a] text-green-500 overflow-y-auto custom-scrollbar">
                        <div className="mb-2 text-slate-600 border-b border-slate-800 pb-1 flex justify-between">
                            <span>zia@holon-swarm:~/workspace$ tail -f execution.log</span>
                            <span className="text-[9px] text-slate-700">SSH-TUNNEL: ACTIVE</span>
                        </div>
                        {visualArtifact?.logs ? (
                            <pre className="whitespace-pre-wrap leading-relaxed">{visualArtifact.logs}</pre>
                        ) : (
                            <div className="text-slate-700 italic">// No execution logs captured.</div>
                        )}
                        <div className="mt-2 w-2 h-4 bg-green-500 animate-pulse inline-block align-middle"></div>
                    </div>
                )}
            </div>
            
            {/* Footer status bar */}
            <div className="h-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-2 text-[9px] text-slate-500 font-mono">
                <div>MODE: {viewMode}</div>
                <div>SANDBOX: SECURE</div>
            </div>
        </div>
    );
};
