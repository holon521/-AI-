
// ZIA 하이퍼-그래프 컴퓨팅 그리드 (HYPER-GRAPH COMPUTE GRID) v1.3

export type NodeType = 'LOCAL_HOST' | 'COLAB_WORKER' | 'KAGGLE_KERNEL' | 'SWARM_PEER';
export type NodeStatus = 'DISCONNECTED' | 'IDLE' | 'COMPUTING' | 'SYNCING' | 'THROTTLED' | 'DONATING';
export type RuntimeEnv = 'PYTHON_3_10' | 'R_STATISTICS' | 'NODE_N8N' | 'LANGCHAIN_CORE';

export interface Container {
    id: string;
    env: RuntimeEnv;
    status: 'STARTING' | 'RUNNING' | 'PAUSED';
    memoryUsage: string;
    uptime: number;
}

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
  currentTask?: string;
  containers: Container[];
  metrics: {
    contributedOps: number; 
    consumedOps: number;    
    sharedStorage: number;  
    ratio: number;          
    socialScore: number;
  };
}

class SwarmController {
  private nodes: ComputeNode[] = [];
  private benevolencePool: number = 15.5; 

  public connectSimulatedNode(type: NodeType): ComputeNode {
    const id = Math.random().toString(36).substring(7);
    let node: ComputeNode = {
        id, type, name: type, status: 'IDLE',
        specs: { device: 'Virtual GPU', memory: '16GB', tflops: 10.0 },
        latency: 100, metrics: { contributedOps: 0, consumedOps: 0, sharedStorage: 0, ratio: 1, socialScore: 0 },
        containers: []
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
}

export const swarm = new SwarmController();
