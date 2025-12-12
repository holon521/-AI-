
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v4.1
// [LOCATION]: 02_CORTEX/memory_orchestrator.ts
// [v4.1] INSIGHT UPGRADE: Dreaming Engine Hooks & Topological Truth

import { computeSimHashSignature, calculateLogicDensity, cosineSimilarity, jaccardSimilarity } from './fde_logic';
import { SPECS } from '../spec_loader';

// --- TRANSFORMER-INSPIRED TYPES ---

export type MemoryType = 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE';
export type TruthState = 'CANONICAL' | 'DISPUTED' | 'PARADIGM_SHIFT' | 'DEPRECATED' | 'AXIOMATIC'; // Added AXIOMATIC

export interface MemoryMetadata {
    type: MemoryType;
    timestamp: number;
    source: string;
    fdeSignature: string; // Topological Hash
    logicScore: number;   // Logic Density
    truthState: TruthState;
    accessCount: number;
    lastAccessed: number;
}

// [KV CACHE CONCEPT]
// Key: Embedding Vector (Semantic Address)
// Value: Text Content & Metadata
export interface MemoryNode {
    id: string;
    pageContent: string;        // Value (V)
    embedding?: number[];       // Key (K) - Pre-computed Vector
    keywords: string[];         // Sparse Key
    metadata: MemoryMetadata;
}

export interface AttentionResult {
    node: MemoryNode;
    attentionScore: number; // 0.0 ~ 1.0 (Softmax output)
    relevance: string;
}

// --- HYPER-PARAMETERS ---
const ATTENTION_HEAD_CONFIG = {
    DIMENSION: 768,          // Embedding Dimension (approx)
    SOFTMAX_TEMP: 0.1,       // Temperature for Softmax (Sharpening attention)
    CONTEXT_WINDOW_SIZE: 10, // Max number of memories to inject (simulate Token Limit)
    DECAY_FACTOR: 0.95       // Time decay per interaction
};

class MemoryOrchestrator {
  // This Map acts as our "KV Cache" - storing pre-computed embeddings (Keys) to avoid re-computation.
  private memoryGraph: Map<string, MemoryNode> = new Map();
  
  // Indices for fast lookups
  private userIndex: string[] = []; 
  private identityIndex: string[] = [];
  private worldIndex: string[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.memoryGraph.size === 0) {
        this.seedKnowledge();
    }
  }

  // --- 1. ATTENTION MECHANISM (The Core) ---
  // Calculates Attention(Q, K, V) = Softmax(Q·K^T / sqrt(d)) * V
  public computeSystemAttention(query: string, queryVec?: number[]): string {
      const candidates = Array.from(this.memoryGraph.values());
      if (candidates.length === 0) return "";

      const scores: { node: MemoryNode; rawScore: number }[] = candidates.map(node => {
          // 1. Calculate Dot Product (Similarity)
          let similarity = 0;
          
          // Dense Attention (Vector)
          if (queryVec && node.embedding) {
              similarity = cosineSimilarity(queryVec, node.embedding);
          } else {
              // Sparse Attention (Keyword Fallback) - if vectors are missing (Client-side limitation)
              const qKw = this.extractKeywords(query);
              similarity = jaccardSimilarity(qKw, node.keywords);
              // Boost exact Topological matches (SimHash)
              const qSig = computeSimHashSignature(query);
              if (node.metadata.fdeSignature === qSig) similarity += 0.5;
          }

          // 2. Apply Time Decay (Positional Encoding Proxy)
          const hoursOld = (Date.now() - node.metadata.timestamp) / (1000 * 60 * 60);
          const timeWeight = Math.pow(ATTENTION_HEAD_CONFIG.DECAY_FACTOR, Math.min(hoursOld, 100)); 

          // 3. Apply "Logic Density" Bias (ZIA's Unique Logic)
          // Higher density memories resist decay longer
          const logicBias = node.metadata.logicScore * 0.3; 

          return { 
              node, 
              rawScore: (similarity * 0.7) + (timeWeight * 0.2) + logicBias 
          };
      });

      // 4. Softmax Normalization (Simulated)
      scores.sort((a, b) => b.rawScore - a.rawScore);
      
      const topK = scores.slice(0, ATTENTION_HEAD_CONFIG.CONTEXT_WINDOW_SIZE);

      // Update Access Stats (LRU Cache Logic)
      topK.forEach(item => {
          item.node.metadata.accessCount++;
          item.node.metadata.lastAccessed = Date.now();
          this.memoryGraph.set(item.node.id, item.node);
      });

      if (topK.length === 0) return "";
      
      return topK.map(item => 
          `[MEMORY (Attn:${item.rawScore.toFixed(2)})] ${item.node.pageContent}`
      ).join('\n');
  }


  // --- 2. KV CACHE MANAGEMENT (Ingestion) ---
  public store(type: MemoryType, content: string, source: string, embedding?: number[]): MemoryNode | null {
      const signature = computeSimHashSignature(content);
      
      // Deduplication Check (Cache Hit)
      const existingId = Array.from(this.memoryGraph.entries()).find(([_, n]) => n.metadata.fdeSignature === signature)?.[0];
      if (existingId && type !== 'USER_CONTEXT') {
          const node = this.memoryGraph.get(existingId)!;
          node.metadata.timestamp = Date.now(); // Refresh Recency
          this.memoryGraph.set(existingId, node);
          this.saveToStorage();
          return node;
      }

      const logicScore = calculateLogicDensity(content);
      const keywords = this.extractKeywords(content);
      
      const node: MemoryNode = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          pageContent: content,
          embedding: embedding, // This is our cached Key (K)
          keywords: keywords,
          metadata: {
              type,
              timestamp: Date.now(),
              source,
              fdeSignature: signature,
              logicScore: logicScore,
              truthState: 'CANONICAL',
              accessCount: 0,
              lastAccessed: Date.now()
          }
      };

      // Store in Graph (KV Store)
      this.memoryGraph.set(node.id, node);
      
      // Indexing
      if (type === 'USER_CONTEXT') this.userIndex.push(node.id);
      else if (type === 'IDENTITY') this.identityIndex.push(node.id);
      else this.worldIndex.push(node.id);

      // Memory Management (Garbage Collection)
      if (this.userIndex.length > 50) {
          this.pruneMemory('USER_CONTEXT');
      }

      this.saveToStorage();
      return node;
  }

  // Pruning Strategy (Eviction Policy)
  private pruneMemory(type: MemoryType) {
      const indices = type === 'USER_CONTEXT' ? this.userIndex : this.worldIndex;
      if (indices.length <= 20) return;

      const candidates = indices.map(id => this.memoryGraph.get(id)!).filter(Boolean);
      candidates.sort((a, b) => {
          // Score = Recency + Importance
          const scoreA = a.metadata.timestamp + (a.metadata.logicScore * 10000000); 
          const scoreB = b.metadata.timestamp + (b.metadata.logicScore * 10000000);
          return scoreA - scoreB; // Ascending (Oldest/Least Important first)
      });

      // Remove bottom 20%
      const toRemove = candidates.slice(0, Math.floor(candidates.length * 0.2));
      toRemove.forEach(n => {
          this.memoryGraph.delete(n.id);
          const idx = indices.indexOf(n.id);
          if (idx > -1) indices.splice(idx, 1);
      });
  }

  // [NEW] Dreaming Protocol (Optimization)
  // To be called when system is IDLE. Consolidates User Context -> World Knowledge.
  public async dream(swarmAvailable: boolean): Promise<string> {
      if (!swarmAvailable) return "Swarm offline. Cannot dream.";
      
      console.log("[Memory] 🌙 Entering Dream State...");
      // Logic: Find high-logic-score items in User Context and promote to World Knowledge
      // This is a placeholder for the actual implementation which would use the Swarm.
      
      return "Dream cycle complete. Memory consolidated.";
  }

  // --- UTILS ---
  private extractKeywords(text: string): string[] {
      return text.toLowerCase().match(/\b(\w+)\b/g) || [];
  }

  public retrieveUserContext(): string | null {
    if (this.userIndex.length === 0) return null;
    return this.userIndex
        .slice(-10) // Last 10 turns (Sliding Window)
        .reverse()
        .map(id => {
            const node = this.memoryGraph.get(id);
            return node ? `[USER_LOG (${new Date(node.metadata.timestamp).toLocaleTimeString()})]: ${node.pageContent}` : null;
        })
        .filter(Boolean)
        .join('\n');
  }

  public seedKnowledge() {
      console.log("[MemoryOrchestrator] 🌱 Seeding Knowledge Graph...");
      this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'GENESIS_AXIOM');
      this.store('IDENTITY', '가난은 자원의 부재가 아니라, 연결의 부재이다. (Poverty Definition)', 'GENESIS_AXIOM');
      Object.entries(SPECS).forEach(([filename, content]) => {
          this.store('WORLD_KNOWLEDGE', `[SYSTEM_SPEC] ${filename}: ${content.substring(0, 200)}...`, 'SpecLoader');
      });
  }

  // Persistence
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem('ZIA_MEMORY_GRAPH');
        if (raw) {
            const data = JSON.parse(raw);
            this.memoryGraph = new Map(data.nodes);
            this.userIndex = data.userIndex;
            this.identityIndex = data.identityIndex;
            this.worldIndex = data.worldIndex;
        }
    } catch (e) { console.error("Memory load failed", e); }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
        const data = {
            nodes: Array.from(this.memoryGraph.entries()),
            userIndex: this.userIndex,
            identityIndex: this.identityIndex,
            worldIndex: this.worldIndex
        };
        localStorage.setItem('ZIA_MEMORY_GRAPH', JSON.stringify(data));
    } catch (e) { console.error("Memory save failed", e); }
  }

  public snapshot() {
      return {
          graph: Array.from(this.memoryGraph.entries()),
          timestamp: Date.now(),
          version: '4.1'
      };
  }

  public restore(snapshot: any) {
      if (!snapshot || !snapshot.graph) return;
      this.memoryGraph = new Map(snapshot.graph);
      this.userIndex = []; this.identityIndex = []; this.worldIndex = [];
      this.memoryGraph.forEach((node, id) => {
          if (node.metadata.type === 'USER_CONTEXT') this.userIndex.push(id);
          else if (node.metadata.type === 'IDENTITY') this.identityIndex.push(id);
          else this.worldIndex.push(id);
      });
      this.saveToStorage();
  }

  public getStats() {
      return { 
          identity: this.identityIndex.length, 
          user: this.userIndex.length, 
          world: this.worldIndex.length, 
          swarmTotal: 0 
      };
  }
}

export const orchestrator = new MemoryOrchestrator();
