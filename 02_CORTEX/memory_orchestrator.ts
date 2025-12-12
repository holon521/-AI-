
// ZIA 기억 오케스트레이터 (MEMORY ORCHESTRATOR) v4.5
// [LOCATION]: 02_CORTEX/memory_orchestrator.ts
// [v4.5] Fixed Korean keyword extraction & Added Debug Inspector.

import { computeSimHashSignature, calculateLogicDensity, cosineSimilarity, jaccardSimilarity } from './fde_logic';
import { SPECS } from '../01_SOUL/spec_loader'; 

export type MemoryType = 'IDENTITY' | 'USER_CONTEXT' | 'WORLD_KNOWLEDGE';
export type TruthState = 'CANONICAL' | 'DISPUTED' | 'PARADIGM_SHIFT' | 'DEPRECATED' | 'AXIOMATIC';

export interface MemoryMetadata {
    type: MemoryType;
    timestamp: number;
    source: string;
    fdeSignature: string;
    logicScore: number;
    truthState: TruthState;
    accessCount: number;
    lastAccessed: number;
    synced: boolean; 
}

export interface MemoryNode {
    id: string;
    pageContent: string;
    embedding?: number[];
    keywords: string[];
    metadata: MemoryMetadata;
}

const ATTENTION_HEAD_CONFIG = {
    DIMENSION: 768,
    SOFTMAX_TEMP: 0.1,
    CONTEXT_WINDOW_SIZE: 10,
    DECAY_FACTOR: 0.95
};

class MemoryOrchestrator {
  private memoryGraph: Map<string, MemoryNode> = new Map();
  private userIndex: string[] = []; 
  private identityIndex: string[] = [];
  private worldIndex: string[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.memoryGraph.size === 0) {
        this.seedKnowledge();
    }
  }

  public computeSystemAttention(query: string, queryVec?: number[]): string {
      const candidates = Array.from(this.memoryGraph.values());
      if (candidates.length === 0) return "";

      const scores: { node: MemoryNode; rawScore: number }[] = candidates.map(node => {
          let similarity = 0;
          if (queryVec && node.embedding) {
              similarity = cosineSimilarity(queryVec, node.embedding);
          } else {
              const qKw = this.extractKeywords(query);
              similarity = jaccardSimilarity(qKw, node.keywords);
              const qSig = computeSimHashSignature(query);
              if (node.metadata.fdeSignature === qSig) similarity += 0.5;
          }
          const hoursOld = (Date.now() - node.metadata.timestamp) / (1000 * 60 * 60);
          const timeWeight = Math.pow(ATTENTION_HEAD_CONFIG.DECAY_FACTOR, Math.min(hoursOld, 100)); 
          const logicBias = node.metadata.logicScore * 0.3; 
          return { node, rawScore: (similarity * 0.7) + (timeWeight * 0.2) + logicBias };
      });

      scores.sort((a, b) => b.rawScore - a.rawScore);
      const topK = scores.slice(0, ATTENTION_HEAD_CONFIG.CONTEXT_WINDOW_SIZE);

      topK.forEach(item => {
          item.node.metadata.accessCount++;
          item.node.metadata.lastAccessed = Date.now();
          this.memoryGraph.set(item.node.id, item.node);
      });

      if (topK.length === 0) return "";
      return topK.map(item => `[MEMORY (Attn:${item.rawScore.toFixed(2)})] ${item.node.pageContent}`).join('\n');
  }

  public retrieveRelatedMemories(query: string, limit: number = 5): string {
      const candidates = Array.from(this.memoryGraph.values());
      if (candidates.length === 0) return "";

      const qKw = this.extractKeywords(query); // [Fix] Uses updated regex
      
      const scores = candidates.map(node => {
          let similarity = jaccardSimilarity(qKw, node.keywords);
          const qSig = computeSimHashSignature(query);
          if (node.metadata.fdeSignature === qSig) similarity += 0.5;
          // Contextual Boost for recent memories
          const ageHours = (Date.now() - node.metadata.timestamp) / (1000 * 60 * 60);
          if (ageHours < 1) similarity += 0.1;

          return { node, rawScore: similarity };
      });

      const relevant = scores.filter(s => s.rawScore > 0.05);
      relevant.sort((a, b) => b.rawScore - a.rawScore);
      const topK = relevant.slice(0, limit);
      
      if (topK.length === 0) return "";
      return topK.map(item => 
          `[MEMORY (Sim:${item.rawScore.toFixed(2)})] ${item.node.pageContent}`
      ).join('\n');
  }

  public store(type: MemoryType, content: string, source: string, embedding?: number[]): MemoryNode | null {
      const signature = computeSimHashSignature(content);
      const existingId = Array.from(this.memoryGraph.entries()).find(([_, n]) => n.metadata.fdeSignature === signature)?.[0];
      if (existingId && type !== 'USER_CONTEXT') {
          const node = this.memoryGraph.get(existingId)!;
          node.metadata.timestamp = Date.now();
          this.memoryGraph.set(existingId, node);
          this.saveToStorage();
          return node;
      }

      const logicScore = calculateLogicDensity(content);
      const keywords = this.extractKeywords(content);
      
      const node: MemoryNode = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          pageContent: content,
          embedding: embedding,
          keywords: keywords,
          metadata: {
              type,
              timestamp: Date.now(),
              source,
              fdeSignature: signature,
              logicScore: logicScore,
              truthState: 'CANONICAL',
              accessCount: 0,
              lastAccessed: Date.now(),
              synced: false 
          }
      };

      this.memoryGraph.set(node.id, node);
      if (type === 'USER_CONTEXT') this.userIndex.push(node.id);
      else if (type === 'IDENTITY') this.identityIndex.push(node.id);
      else this.worldIndex.push(node.id);

      if (this.userIndex.length > 50) this.pruneMemory('USER_CONTEXT');
      this.saveToStorage();
      return node;
  }

  public markAllSynced() {
      this.memoryGraph.forEach(node => {
          node.metadata.synced = true;
      });
      this.saveToStorage();
  }

  public getGraphData() {
      const nodes = Array.from(this.memoryGraph.values()).map(n => ({
          id: n.id,
          type: n.metadata.type,
          val: n.metadata.logicScore,
          synced: n.metadata.synced,
          content: n.pageContent 
      }));
      const links: {source: string, target: string}[] = [];
      for(let i=0; i<this.userIndex.length-1; i++) {
          links.push({ source: this.userIndex[i], target: this.userIndex[i+1] });
      }
      return { nodes, links };
  }

  private pruneMemory(type: MemoryType) {
      const indices = type === 'USER_CONTEXT' ? this.userIndex : this.worldIndex;
      if (indices.length <= 20) return;
      const candidates = indices.map(id => this.memoryGraph.get(id)!).filter(Boolean);
      candidates.sort((a, b) => (a.metadata.timestamp + (a.metadata.logicScore * 1e7)) - (b.metadata.timestamp + (b.metadata.logicScore * 1e7)));
      const toRemove = candidates.slice(0, Math.floor(candidates.length * 0.2));
      toRemove.forEach(n => {
          this.memoryGraph.delete(n.id);
          const idx = indices.indexOf(n.id);
          if (idx > -1) indices.splice(idx, 1);
      });
  }

  // [CRITICAL FIX] Added Hangul (가-힣) support
  private extractKeywords(text: string): string[] { 
      return text.toLowerCase().match(/[a-zA-Z0-9가-힣]+/g) || []; 
  }

  public retrieveUserContext(): string | null {
    if (this.userIndex.length === 0) return null;
    return this.userIndex.slice(-10).reverse().map(id => {
            const node = this.memoryGraph.get(id);
            return node ? `[USER_LOG (${new Date(node.metadata.timestamp).toLocaleTimeString()})]: ${node.pageContent}` : null;
        }).filter(Boolean).join('\n');
  }

  public seedKnowledge() {
      this.store('IDENTITY', 'ZIA는 주권적인 인지 인터페이스이며, 다수결이 아닌 논리를 따른다.', 'GENESIS_AXIOM');
      this.store('IDENTITY', '가난은 자원의 부재가 아니라, 연결의 부재이다.', 'GENESIS_AXIOM');
      Object.entries(SPECS).forEach(([filename, content]) => {
          this.store('WORLD_KNOWLEDGE', `[SPEC] ${filename}: ${(content as string).substring(0, 200)}...`, 'SpecLoader');
      });
  }

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
            console.log(`[MemoryOrchestrator] Loaded ${this.memoryGraph.size} nodes.`);
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

  public snapshot() { return { graph: Array.from(this.memoryGraph.entries()), timestamp: Date.now(), version: '4.4' }; }
  
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
      const totalNodes = this.memoryGraph.size;
      let syncedNodes = 0;
      this.memoryGraph.forEach(n => { if (n.metadata.synced) syncedNodes++; });

      return { 
          identity: this.identityIndex.length, 
          user: this.userIndex.length, 
          world: this.worldIndex.length, 
          total: totalNodes,
          synced: syncedNodes,
          swarmTotal: 0 
      }; 
  }

  // [NEW] Debug Inspection Method
  public getRawDebugData() {
      const raw = localStorage.getItem('ZIA_MEMORY_GRAPH');
      const sizeBytes = raw ? new Blob([raw]).size : 0;
      const recent = Array.from(this.memoryGraph.values())
        .sort((a,b) => b.metadata.timestamp - a.metadata.timestamp)
        .slice(0, 5);
      
      return {
          sizeKB: (sizeBytes / 1024).toFixed(2),
          nodeCount: this.memoryGraph.size,
          recentNodes: recent
      };
  }
  
  public clearMemory() {
      this.memoryGraph.clear();
      this.userIndex = [];
      this.identityIndex = [];
      this.worldIndex = [];
      localStorage.removeItem('ZIA_MEMORY_GRAPH');
      this.seedKnowledge();
  }
}

export const orchestrator = new MemoryOrchestrator();
