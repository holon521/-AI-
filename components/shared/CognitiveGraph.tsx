
import React, { useEffect, useRef, useState } from 'react';
import { orchestrator } from '../../02_CORTEX/memory_orchestrator';

interface CognitiveGraphProps {
    filter?: 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE' | null;
    activeStage?: string; // [NEW] 'ROUTER', 'MEMORY', 'SWARM', etc.
}

export const CognitiveGraph: React.FC<CognitiveGraphProps> = ({ filter, activeStage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<{content: string, type: string, id: string} | null>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({ 
                    width: entry.contentRect.width, 
                    height: entry.contentRect.height 
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set actual canvas size to match display size for sharpness
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        let animationFrameId: number;
        const { nodes: allNodes } = orchestrator.getGraphData();
        
        // Filter Nodes
        const nodes = filter ? allNodes.filter(n => n.type === filter) : allNodes;

        // Initial positions (random spread)
        const simulationNodes = nodes.map(n => ({
            ...n,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            activeConnection: false // [Visual] For beam effect
        }));

        let time = 0;

        const render = () => {
            time += 0.05;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // --- 1. Draw Central Agent Hub (The Active Mind) ---
            if (activeStage) {
                // Pulse Animation
                const pulseSize = 15 + Math.sin(time * 5) * 5; 
                ctx.beginPath();
                ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
                
                // Color based on Stage
                if (activeStage === 'ROUTER') ctx.fillStyle = 'rgba(251, 191, 36, 0.5)'; // Amber
                else if (activeStage === 'MEMORY') ctx.fillStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan
                else if (activeStage === 'SWARM') ctx.fillStyle = 'rgba(16, 185, 129, 0.5)'; // Green
                else ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                
                ctx.fill();
                
                // Core
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();

                // Ring
                ctx.beginPath();
                ctx.arc(cx, cy, pulseSize + 5, 0, Math.PI * 2);
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // --- 2. Physics & Node Logic ---
            simulationNodes.forEach(n => {
                // Basic Repulsion
                for (let other of simulationNodes) {
                    if (n.id === other.id) continue;
                    const dx = n.x - other.x;
                    const dy = n.y - other.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    if (dist < 100) {
                        const force = 80 / (dist * dist); 
                        n.vx += (dx / dist) * force;
                        n.vy += (dy / dist) * force;
                    }
                }

                // Gravity to Center
                n.vx += (cx - n.x) * 0.005;
                n.vy += (cy - n.y) * 0.005;

                // [VISUAL] Active Beam (If Stage is MEMORY, pull related nodes closer)
                if (activeStage === 'MEMORY') {
                     // Simulate "Search": Pull matching types slightly closer to center
                     if (n.type === 'USER_CONTEXT' || n.type === 'WORLD_KNOWLEDGE') {
                         n.vx += (cx - n.x) * 0.01;
                         n.vy += (cy - n.y) * 0.01;
                         n.activeConnection = true;
                     }
                } else {
                    n.activeConnection = false;
                }

                // Apply Velocity
                n.vx *= 0.9;
                n.vy *= 0.9;
                n.x += n.vx;
                n.y += n.vy;
                
                // Bounds
                n.x = Math.max(10, Math.min(canvas.width - 10, n.x));
                n.y = Math.max(10, Math.min(canvas.height - 10, n.y));

                // --- 3. Draw Beams (Active Thoughts) ---
                if (activeStage && n.activeConnection && Math.random() > 0.9) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(n.x, n.y);
                    ctx.strokeStyle = `rgba(6, 182, 212, ${Math.random() * 0.5})`; // Cyan beam
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // --- 4. Draw Nodes ---
                ctx.beginPath();
                const isSelected = selectedNode?.id === n.id;
                const size = isSelected ? 8 : (n.val > 0.8 ? 5 : 3);
                ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
                
                if (n.type === 'IDENTITY') ctx.fillStyle = '#a855f7'; 
                else if (n.type === 'USER_CONTEXT') ctx.fillStyle = '#06b6d4'; 
                else ctx.fillStyle = '#10b981'; 
                
                ctx.fill();
                
                ctx.lineWidth = isSelected ? 3 : 1.5;
                ctx.strokeStyle = isSelected ? '#fbbf24' : (n.synced ? '#ffffff' : '#ef4444'); 
                ctx.stroke();

                if (isSelected) {
                     ctx.fillStyle = '#fff';
                     ctx.font = '10px monospace';
                     ctx.fillText(n.content.substring(0,20) + "...", n.x + 12, n.y + 4);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        // Click Handler
        const handleClick = (e: MouseEvent) => {
             const rect = canvas.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;

             const clicked = simulationNodes.find(n => {
                 const dx = n.x - x;
                 const dy = n.y - y;
                 return Math.sqrt(dx*dx + dy*dy) < 15; 
             });

             if (clicked) {
                 setSelectedNode({ content: clicked.content, type: clicked.type, id: clicked.id });
             } else {
                 setSelectedNode(null);
             }
        };

        canvas.addEventListener('mousedown', handleClick);
        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousedown', handleClick);
        }
    }, [dimensions, filter, activeStage]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-slate-950 rounded overflow-hidden">
            <canvas ref={canvasRef} className="block" />
            
            {/* Legend Overlay */}
            <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 opacity-70 pointer-events-none">
                 <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full border border-white bg-slate-800"></span><span className="text-[9px] text-slate-400">Synced</span></div>
                 <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full border border-red-500 bg-slate-800"></span><span className="text-[9px] text-slate-400">Pending</span></div>
            </div>

            {/* Content Preview Overlay */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur-sm animate-fade-in shadow-xl z-20">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold px-1.5 rounded ${selectedNode.type === 'IDENTITY' ? 'bg-purple-900 text-purple-300' : selectedNode.type === 'USER_CONTEXT' ? 'bg-cyan-900 text-cyan-300' : 'bg-green-900 text-green-300'}`}>
                            {selectedNode.type}
                        </span>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                    <div className="text-xs text-slate-300 font-mono leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                        {selectedNode.content}
                    </div>
                </div>
            )}
        </div>
    );
};
