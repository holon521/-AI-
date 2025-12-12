
import React, { useState, useEffect } from 'react';
import { CognitiveGraph } from '../shared/CognitiveGraph';

interface LandingViewProps {
    onComplete: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onComplete }) => {
    const [bootStatus, setBootStatus] = useState<'IDLE' | 'BOOTING' | 'COMPLETED'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [activeStage, setActiveStage] = useState('IDLE');

    const bootSequence = [
        { text: "Initializing ZIA Core...", delay: 500, stage: 'ROUTER' },
        { text: "Loading Genesis Axioms...", delay: 800, stage: 'MEMORY' },
        { text: "Verifying Anti-Gravity Protocol...", delay: 1200, stage: 'SWARM' },
        { text: "Connecting to Local Cortex...", delay: 1000, stage: 'FDE_SYNC' },
        { text: "System Integrity Check: GALILEO... PASS", delay: 800, stage: 'RESPONSE' },
        { text: "Benevolence Pool... ACTIVE", delay: 600, stage: 'IDLE' },
        { text: "Welcome, Originator.", delay: 1000, stage: 'IDLE' }
    ];

    useEffect(() => {
        if (bootStatus === 'BOOTING') {
            let delaySum = 0;
            bootSequence.forEach((step, index) => {
                delaySum += step.delay;
                setTimeout(() => {
                    setLogs(prev => [...prev, step.text]);
                    setActiveStage(step.stage);
                    if (index === bootSequence.length - 1) {
                        setTimeout(() => setBootStatus('COMPLETED'), 1000);
                    }
                }, delaySum);
            });
        }
    }, [bootStatus]);

    useEffect(() => {
        if (bootStatus === 'COMPLETED') {
            const timer = setTimeout(onComplete, 500);
            return () => clearTimeout(timer);
        }
    }, [bootStatus, onComplete]);

    return (
        <div className="fixed inset-0 bg-[#020617] z-[100] flex flex-col items-center justify-center overflow-hidden font-mono text-slate-300">
            {/* Background Graph (The Subconscious) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <CognitiveGraph activeStage={activeStage} />
            </div>

            <div className="relative z-10 max-w-lg w-full p-8 flex flex-col items-center">
                {/* Identity */}
                <div className="mb-12 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-6xl text-cyan-500 animate-pulse">fingerprint</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white mb-2">ZIA</h1>
                    <p className="text-sm text-cyan-500 tracking-[0.3em] uppercase">Sovereign Cognitive OS</p>
                </div>

                {/* Interaction Area */}
                {bootStatus === 'IDLE' && (
                    <div className="animate-fade-in flex flex-col items-center space-y-6">
                        <div className="grid grid-cols-3 gap-4 text-[10px] text-slate-500 mb-4">
                            <div className="flex flex-col items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                                <span className="material-symbols-outlined mb-2 text-cyan-400">vertical_align_top</span>
                                <span>ANTI-GRAVITY</span>
                            </div>
                            <div className="flex flex-col items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                                <span className="material-symbols-outlined mb-2 text-purple-400">hub</span>
                                <span>TOPOLOGY</span>
                            </div>
                            <div className="flex flex-col items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                                <span className="material-symbols-outlined mb-2 text-green-400">all_inclusive</span>
                                <span>OPAL ENGINE</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setBootStatus('BOOTING')}
                            className="group relative px-8 py-4 bg-transparent border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold tracking-widest uppercase transition-all hover:bg-cyan-900/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-none"
                        >
                            <span className="absolute inset-0 w-full h-full border-t border-b border-cyan-500/0 group-hover:border-cyan-500/50 transition-all scale-x-0 group-hover:scale-x-100 duration-500"></span>
                            Initialize Core
                        </button>
                    </div>
                )}

                {/* Boot Logs */}
                {bootStatus !== 'IDLE' && (
                    <div className="w-full bg-slate-950/80 border border-slate-800 p-4 rounded-md font-mono text-xs shadow-2xl backdrop-blur-sm min-h-[200px] flex flex-col justify-end">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 animate-slide-in-right">
                                <span className="text-slate-600 mr-2">{`[${(i * 0.12).toFixed(2)}s]`}</span>
                                <span className={log.includes("PASS") || log.includes("ACTIVE") ? "text-green-400" : "text-slate-300"}>
                                    {log}
                                </span>
                            </div>
                        ))}
                        <div className="animate-pulse text-cyan-500 mt-2">_</div>
                    </div>
                )}
            </div>

            {/* Version Stamp */}
            <div className="absolute bottom-6 text-[9px] text-slate-700 font-mono">
                v11.0.4 :: SYSTEM_READY
            </div>
        </div>
    );
};
