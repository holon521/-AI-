
import React, { useEffect, useRef, useState } from 'react';
import { orchestrator, MemoryType, TruthState } from '../../02_CORTEX/memory_orchestrator';

interface CognitiveGraphProps {
    filter?: 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE' | null;
    activeStage?: string; 
    mini?: boolean; // Optimized mode for RightPanel
    selectedNodeId?: string | null; // [NEW] For sync with list
    onNodeSelect?: (id: string) => void; // [NEW] Callback
}

interface SimNode {
    id: string;
    type: MemoryType;
    val: number;
    synced: boolean;
    content: string;
    truthState: TruthState;
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetX?: number;
    targetY?: number;
    pulse: number;
}

interface Spark {
    path: {x: number, y: number}[]; // Waypoints
    currentIdx: number;
    progress: number;
    speed: number;
}

export const CognitiveGraph: React.FC<CognitiveGraphProps> = ({ filter, activeStage, mini = false, selectedNodeId, onNodeSelect }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Removed internal selectedNode state in favor of props or simple hover
    const [hoveredNode, setHoveredNode] = useState<{content: string, type: string, id: string} | null>(null);
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

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        let animationFrameId: number;
        const { nodes: rawNodes } = orchestrator.getGraphData();
        
        // Filter Nodes
        const nodesToRender = filter ? rawNodes.filter(n => n.type === filter) : rawNodes;

        // --- TRINITY GRAVITY CENTERS (The 3 Axes) ---
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const offset = mini ? canvas.width * 0.25 : canvas.width * 0.3;
        
        // Axis Rotation (Slow Spin for "Axis Infinity")
        let axisRotation = 0;

        // [ANTIGRAVITY MODE]
        // If activeStage is SWARM, FDE_SYNC, or RESPONSE, we activate Anti-Gravity.
        const isAntiGravity = activeStage === 'SWARM' || activeStage === 'FDE_SYNC' || activeStage === 'RESPONSE';

        // Initial Physics State
        const simulationNodes: SimNode[] = nodesToRender.map(n => {
            return {
                ...n,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0,
                pulse: Math.random()
            };
        });

        // Neural Sparks (Data packets)
        const sparks: Spark[] = [];
        const spawnSpark = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
            sparks.push({
                path: [p1, p2],
                currentIdx: 0,
                progress: 0,
                speed: 0.05 + Math.random() * 0.05
            });
        };

        const render = () => {
            // Trail Effect (Motion Blur)
            ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Dark Slate Fade
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // --- AXIS CALCULATION (Rotating Trinity) ---
            // Speed up rotation during Anti-Gravity mode
            axisRotation += isAntiGravity ? 0.01 : 0.002; 
            
            // Calculate dynamic gravity centers based on rotation
            // 1. IDENTITY (Top)
            const idAngle = -Math.PI / 2 + axisRotation;
            const idX = cx + Math.cos(idAngle) * offset * 0.8;
            const idY = cy + Math.sin(idAngle) * offset * 0.8;
            
            // 2. USER (Bottom Left)
            const userAngle = -Math.PI / 2 + (2 * Math.PI / 3) + axisRotation;
            const userX = cx + Math.cos(userAngle) * offset;
            const userY = cy + Math.sin(userAngle) * offset;
            
            // 3. WORLD (Bottom Right)
            const worldAngle = -Math.PI / 2 + (4 * Math.PI / 3) + axisRotation;
            const worldX = cx + Math.cos(worldAngle) * offset;
            const worldY = cy + Math.sin(worldAngle) * offset;

            const axes = [
                { x: idX, y: idY, label: "ID" },
                { x: userX, y: userY, label: "YOU" },
                { x: worldX, y: worldY, label: "WORLD" }
            ];

            // --- DRAW AXIS INFINITY (The Structure) ---
            if (!mini || (mini && nodesToRender.length > 0)) {
                ctx.beginPath();
                ctx.moveTo(idX, idY);
                ctx.lineTo(userX, userY);
                ctx.lineTo(worldX, worldY);
                ctx.closePath();
                // If Anti-Gravity, the axis glows more intently
                ctx.strokeStyle = isAntiGravity ? 'rgba(34, 211, 238, 0.3)' : 'rgba(71, 85, 105, 0.15)'; 
                ctx.lineWidth = isAntiGravity ? 2 : 1;
                ctx.stroke();

                // Axis Labels
                if (!mini) {
                    ctx.font = '9px monospace';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.textAlign = 'center';
                    // Use axes array to draw labels
                    axes.forEach(a => ctx.fillText(a.label, a.x, a.y + 15));
                }

                // Randomly spawn sparks between axes
                if (Math.random() < 0.05) {
                    const from = axes[Math.floor(Math.random() * 3)];
                    const to = axes[Math.floor(Math.random() * 3)];
                    if (from !== to) spawnSpark(from, to);
                }

                // Draw Center Point (The Singularity)
                ctx.beginPath();
                ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fill();
            }

            // --- SPARK ENGINE ---
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.progress += s.speed;
                if (s.progress >= 1) {
                    sparks.splice(i, 1);
                    continue;
                }
                const p1 = s.path[0];
                const p2 = s.path[1];
                const curX = p1.x + (p2.x - p1.x) * s.progress;
                const curY = p1.y + (p2.y - p1.y) * s.progress;
                
                ctx.beginPath();
                ctx.arc(curX, curY, 1, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
            }

            // --- PHYSICS ENGINE ---
            simulationNodes.forEach(n => {
                // If this node is selected via list, override physics to center
                if (selectedNodeId && n.id === selectedNodeId) {
                    const dx = cx - n.x;
                    const dy = cy - n.y;
                    n.x += dx * 0.1; // Pull to center aggressively
                    n.y += dy * 0.1;
                    n.pulse += 0.2; // Fast pulse
                } else {
                    // Assign Target Gravity Centers dynamically
                    let tx = cx, ty = cy;
                    if (n.type === 'IDENTITY') { tx = idX; ty = idY; }
                    else if (n.type === 'USER_CONTEXT') { tx = userX; ty = userY; }
                    else { tx = worldX; ty = worldY; }

                    // [PHYSICS RULE 1: GRAVITY vs ANTI-GRAVITY]
                    if (isAntiGravity) {
                        // Anti-Gravity: Nodes gently float UPWARD and OUTWARD (Expanding Mind)
                        const dx = n.x - cx;
                        const dy = n.y - cy;
                        
                        n.vx += dx * 0.0005;
                        n.vy += dy * 0.0005;
                        n.vy -= 0.05; 

                        // Wrap around if they float off top
                        if (n.y < -20) {
                            n.y = canvas.height + 20;
                            n.x = Math.random() * canvas.width;
                            n.vy = -Math.random() * 2; 
                        }
                    } else {
                        // Standard Gravity: Pull to Trinity Centers
                        if (tx !== undefined && ty !== undefined) {
                            const dx = tx - n.x;
                            const dy = ty - n.y;
                            n.vx += dx * 0.002; // Gentle pull
                            n.vy += dy * 0.002;
                        }
                    }

                    // [PHYSICS RULE 2: REPULSION]
                    for (let other of simulationNodes) {
                        if (n.id === other.id) continue;
                        const dx = n.x - other.x;
                        const dy = n.y - other.y;
                        const distSq = dx*dx + dy*dy;
                        const minDist = mini ? 100 : 400; 
                        if (distSq < minDist && distSq > 0) {
                            const dist = Math.sqrt(distSq);
                            const force = (mini ? 5 : 20) / distSq; 
                            n.vx += (dx / dist) * force;
                            n.vy += (dy / dist) * force;
                        }
                    }

                    // Physics Step
                    n.vx *= 0.92; // Friction
                    n.vy *= 0.92;
                    n.x += n.vx;
                    n.y += n.vy;
                    
                    // Bounds
                    if (!isAntiGravity) {
                        const margin = 5;
                        if(n.x < margin) n.vx += 0.5;
                        if(n.x > canvas.width - margin) n.vx -= 0.5;
                        if(n.y < margin) n.vy += 0.5;
                        if(n.y > canvas.height - margin) n.vy -= 0.5;
                    } else {
                        if(n.x < 0) n.x = canvas.width;
                        if(n.x > canvas.width) n.x = 0;
                    }
                }

                // [PHYSICS RULE 3: PULSE]
                let isExcited = false;
                if (activeStage === 'MEMORY') isExcited = true;
                else if (activeStage === 'ROUTER' && n.type === 'IDENTITY') isExcited = true;
                else if (activeStage === 'SWARM' && n.type === 'WORLD_KNOWLEDGE') isExcited = true;

                if (isExcited || isAntiGravity || (selectedNodeId && n.id === selectedNodeId)) {
                    n.pulse += 0.1; 
                } else {
                    n.pulse += 0.02; 
                }

                // --- RENDER NODE ---
                const pulseScale = (Math.sin(n.pulse) + 1) / 2; // 0 to 1
                const baseSize = mini ? 1.5 : (n.val > 0.8 ? 3 : 2);
                let size = baseSize + ((isExcited || isAntiGravity) ? pulseScale * 2 : 0);
                
                // Highlight selected node
                if (selectedNodeId && n.id === selectedNodeId) {
                    size = size * 2;
                }

                ctx.beginPath();
                ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
                
                // Color Logic
                let color = '#fff';
                if (n.truthState === 'DISPUTED') {
                    const intensity = 0.5 + pulseScale * 0.5;
                    color = `rgba(239, 68, 68, ${intensity})`; 
                } else {
                    if (n.type === 'IDENTITY') color = '#c084fc'; // Purple
                    else if (n.type === 'USER_CONTEXT') color = '#22d3ee'; // Cyan
                    else color = '#4ade80'; // Green
                }
                
                ctx.fillStyle = color;
                ctx.fill();

                // Selected/Synced Halo
                if ((n.synced && !mini) || (selectedNodeId && n.id === selectedNodeId)) {
                    ctx.strokeStyle = (selectedNodeId && n.id === selectedNodeId) ? 'rgba(255, 255, 255, 0.8)' : `rgba(255, 255, 255, 0.1)`;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, size + 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // --- RENDER CONNECTIONS (Dendrites) ---
            if (!mini) {
                ctx.lineWidth = 0.5;
                simulationNodes.forEach((n, i) => {
                    // Connect to nearby nodes of SAME type (Cluster)
                    for (let j = i + 1; j < simulationNodes.length; j++) {
                        const other = simulationNodes[j];
                        if (n.type !== other.type) continue;
                        
                        const dx = n.x - other.x;
                        const dy = n.y - other.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < 60) {
                            ctx.beginPath();
                            ctx.moveTo(n.x, n.y);
                            ctx.lineTo(other.x, other.y);
                            let alpha = 1 - (dist / 60);
                            
                            let strokeColor = '100, 116, 139'; 
                            if (n.truthState === 'DISPUTED') strokeColor = '239, 68, 68'; 
                            else if (n.type === 'IDENTITY') strokeColor = '192, 132, 252';
                            else if (n.type === 'USER_CONTEXT') strokeColor = '34, 211, 238';
                            else if (n.type === 'WORLD_KNOWLEDGE') strokeColor = '74, 222, 128';

                            ctx.strokeStyle = `rgba(${strokeColor}, ${alpha * 0.2})`;
                            ctx.stroke();
                        }
                    }
                });
            }

            animationFrameId = requestAnimationFrame(render);
        };
        render();

        // Click Handler (Only if not mini)
        const handleClick = (e: MouseEvent) => {
             if (mini || !onNodeSelect) return;
             const rect = canvas.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;

             const clicked = simulationNodes.find(n => {
                 const dx = n.x - x;
                 const dy = n.y - y;
                 return Math.sqrt(dx*dx + dy*dy) < 15; 
             });

             if (clicked) {
                 onNodeSelect(clicked.id);
             } else {
                 // onNodeSelect(null); // Optional: deselect on click empty space
             }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (mini) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hovered = simulationNodes.find(n => {
                const dx = n.x - x;
                const dy = n.y - y;
                return Math.sqrt(dx*dx + dy*dy) < 15;
            });

            if (hovered) {
                setHoveredNode({ content: hovered.content, type: hovered.type, id: hovered.id });
                canvas.style.cursor = 'pointer';
            } else {
                setHoveredNode(null);
                canvas.style.cursor = 'default';
            }
        }

        canvas.addEventListener('mousedown', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);
        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousedown', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
        }
    }, [dimensions, filter, activeStage, mini, selectedNodeId, onNodeSelect]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-transparent rounded overflow-hidden">
            <canvas ref={canvasRef} className="block" />
            
            {/* Hover Preview Overlay (Replaces old sticky selectedNode) */}
            {hoveredNode && !mini && !selectedNodeId && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur-sm animate-fade-in shadow-xl z-20 pointer-events-none">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold px-1.5 rounded ${
                            hoveredNode.type === 'IDENTITY' ? 'bg-purple-900 text-purple-300' : 
                            hoveredNode.type === 'USER_CONTEXT' ? 'bg-cyan-900 text-cyan-300' : 
                            'bg-green-900 text-green-300'
                        }`}>
                            {hoveredNode.type}
                        </span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono leading-relaxed max-h-32 overflow-hidden truncate">
                        {hoveredNode.content}
                    </div>
                </div>
            )}
        </div>
    );
};
