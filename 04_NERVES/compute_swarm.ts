
// ZIA 하이퍼-그래프 컴퓨팅 그리드 (HYPER-GRAPH COMPUTE GRID) v2.1
// [LOCATION]: 03_NERVES/compute_swarm.ts

export type NodeType = 'LOCAL_HOST' | 'COLAB_WORKER' | 'KAGGLE_KERNEL' | 'SWARM_PEER';
export type NodeStatus = 'DISCONNECTED' | 'IDLE' | 'COMPUTING' | 'SYNCING' | 'THROTTLED' | 'DONATING';

export interface ComputeNode {
  id: string;
  type: NodeType;
  name: string;
  status: NodeStatus;
  specs: {
    device: string; 
    memory: string; 
    tflops: number; 
  };
  latency: number; 
  metrics: {
    contributedOps: number; 
    consumedOps: number;    
    ratio: number;          
    socialScore: number;
  };
}

class SwarmController {
  private nodes: ComputeNode[] = [];
  private benevolencePool: number = 15.5; 

  constructor() {
      // Initialize with a placeholder local node
      this.connectSimulatedNode('LOCAL_HOST');
  }

  public connectSimulatedNode(type: NodeType): ComputeNode {
    const id = Math.random().toString(36).substring(7);
    let node: ComputeNode = {
        id, type, name: type, status: 'IDLE',
        specs: { device: 'Virtual Core', memory: 'System', tflops: 1.0 },
        latency: 0, metrics: { contributedOps: 0, consumedOps: 0, ratio: 1, socialScore: 0 }
    };
    this.nodes.push(node);
    return node;
  }

  public getBenevolencePoolStats() { return this.benevolencePool; }

  public getTotalComputePower(): number {
    return this.nodes.reduce((acc, node) => acc + node.specs.tflops, 0);
  }

  public getActiveNodes(): ComputeNode[] {
    return this.nodes.filter(n => n.status !== 'DISCONNECTED');
  }

  public updateNodeMetrics(nodeId: string, contributed: number, consumed: number) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
          node.metrics.contributedOps += contributed;
          node.metrics.consumedOps += consumed;
          const denominator = node.metrics.consumedOps === 0 ? 1 : node.metrics.consumedOps;
          node.metrics.ratio = node.metrics.contributedOps / denominator;
          node.metrics.socialScore = Math.min(100, node.metrics.ratio * 10);

          if (contributed > consumed) {
              this.benevolencePool += (contributed - consumed) * 0.1; 
          }
      }
  }
}

export const swarm = new SwarmController();
