
import React, { useState, useEffect, useRef } from 'react';

interface ArtifactCanvasProps {
    isOpen: boolean;
    content: string | null;
    visualArtifact?: { image?: string; html?: string };
    onClose: () => void;
    onSignal?: (type: string, payload: any) => void; // Bridge to Kernel
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({ isOpen, content, visualArtifact, onClose, onSignal }) => {
    const [viewMode, setViewMode] = useState<'CODE' | 'PREVIEW'>('PREVIEW');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Auto-switch to preview if visual artifact exists
    useEffect(() => {
        if (visualArtifact?.image || visualArtifact?.html) {
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
        <div className="absolute right-0 top-12 bottom-0 w-full md:w-1/2 lg:w-2/5 border-l border-slate-900 bg-slate-950 flex flex-col animate-slide-in-right z-30 shadow-2xl">
            {/* Header */}
            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
                <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-300">ARTIFACT CANVAS (SANDBOX)</span>
                    <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800">
                        <button 
                            onClick={() => setViewMode('CODE')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${viewMode === 'CODE' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >CODE</button>
                        <button 
                            onClick={() => setViewMode('PREVIEW')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${viewMode === 'PREVIEW' ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >PREVIEW</button>
                    </div>
                </div>
                <button onClick={onClose}><span className="material-symbols-outlined text-sm text-slate-500 hover:text-white">close</span></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-[#0d1117] relative">
                {viewMode === 'CODE' && (
                    <div className="p-4">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{content || "// No code content"}</pre>
                    </div>
                )}

                {viewMode === 'PREVIEW' && (
                    <div className="h-full flex flex-col items-center justify-center p-4">
                        {visualArtifact?.image ? (
                            <div className="bg-white p-2 rounded shadow-lg max-w-full overflow-hidden">
                                <img src={`data:image/png;base64,${visualArtifact.image}`} alt="Visual Output" className="max-w-full h-auto" />
                            </div>
                        ) : visualArtifact?.html ? (
                            <iframe 
                                ref={iframeRef}
                                srcDoc={getSandboxedSrc(visualArtifact.html)}
                                className="w-full h-full bg-white rounded border-none"
                                sandbox="allow-scripts allow-forms allow-popups allow-modals"
                                title="ZIA Micro-App"
                            />
                        ) : (
                            <div className="text-slate-600 text-xs italic flex flex-col items-center">
                                <span className="material-symbols-outlined mb-2 text-2xl">preview_off</span>
                                No Visual Artifact Generated
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
