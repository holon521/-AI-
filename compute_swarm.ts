
// ZIA 하이퍼-그래프 컴퓨팅 그리드 (HYPER-GRAPH COMPUTE GRID) v1.3
// [플랫폼 확장] MCP 기반 컨테이너 오케스트레이션 및 다중 런타임 환경 지원

export type NodeType = 'LOCAL_HOST' | 'COLAB_WORKER' | 'KAGGLE_KERNEL' | 'SWARM_PEER';
export type NodeStatus = 'DISCONNECTED' | 'IDLE' | 'COMPUTING' | 'SYNCING' | 'THROTTLED' | 'DONATING';

// 실행 환경 타입 (컨테이너 이미지)
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
  containers: Container[]; // 노드 내 실행 중인 컨테이너 목록
  
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

  constructor() {}

  public connectSimulatedNode(type: NodeType): ComputeNode {
    const id = Math.random().toString(36).substring(7);
    let node: ComputeNode;

    const initialMetrics = {
        contributedOps: 100, consumedOps: 10, sharedStorage: 1024, ratio: 10.0, socialScore: 0
    };

    if (type === 'COLAB_WORKER') {
      node = {
        id, type, name: 'Google Colab T4-1', status: 'IDLE',
        specs: { device: 'NVIDIA T4', memory: '12GB VRAM', tflops: 8.1 },
        latency: 120, metrics: initialMetrics,
        containers: [] // 초기엔 컨테이너 없음
      };
      // Colab은 기본적으로 파이썬 환경 탑재
      this.spawnContainer(node, 'PYTHON_3_10');
    } else if (type === 'LOCAL_HOST') {
      node = {
        id, type, name: 'Local Host (MCP Bridge)', status: 'IDLE',
        specs: { device: 'Local GPU/CPU', memory: 'System', tflops: 2.5 },
        latency: 5, metrics: initialMetrics,
        containers: []
      };
      // 로컬은 멀티 환경
      this.spawnContainer(node, 'PYTHON_3_10');
      this.spawnContainer(node, 'NODE_N8N');
    } else {
      const isDonor = Math.random() < 0.2; 
      node = {
        id, type,
        name: isDonor ? `Angel Node ${id.substring(0,3)}` : `Peer Node ${id.substring(0,3)}`,
        status: isDonor ? 'DONATING' : 'SYNCING',
        specs: { device: isDonor ? 'RTX 4090 Cluster' : 'Shared Resource', memory: 'Top-tier', tflops: isDonor ? 80.0 : 1.2 },
        latency: 150, 
        metrics: {
            contributedOps: isDonor ? 5000 : 100, consumedOps: 100, sharedStorage: 5000, 
            ratio: isDonor ? 50.0 : 1.0, socialScore: isDonor ? 100 : 0
        },
        containers: []
      };
    }

    this.nodes.push(node);
    if (node.status === 'DONATING') this.benevolencePool += node.specs.tflops;
    return node;
  }

  // 컨테이너 생성 (Docker Run 시뮬레이션)
  public spawnContainer(node: ComputeNode, env: RuntimeEnv) {
      const container: Container = {
          id: `ctr-${Math.random().toString(36).substring(7)}`,
          env: env,
          status: 'STARTING',
          memoryUsage: '0MB',
          uptime: 0
      };
      node.containers.push(container);
      
      // 부팅 시뮬레이션
      setTimeout(() => {
          container.status = 'RUNNING';
          container.memoryUsage = env === 'PYTHON_3_10' ? '150MB' : '80MB';
      }, 1500);
  }

  public donateResource(nodeId: string, amount: number) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
          node.metrics.socialScore += amount;
          this.benevolencePool += amount;
          node.status = 'DONATING';
      }
  }

  public useSubsidy(amount: number): boolean {
      if (this.benevolencePool >= amount) {
          this.benevolencePool -= amount;
          return true; 
      }
      return false; 
  }

  public getBenevolencePoolStats() { return this.benevolencePool; }

  public getTotalComputePower(): number {
    return this.nodes.reduce((acc, node) => {
        if (node.status === 'THROTTLED') return acc + (node.specs.tflops * 0.1);
        if (node.status !== 'DISCONNECTED') return acc + node.specs.tflops;
        return acc;
    }, 0);
  }

  public getActiveNodes(): ComputeNode[] {
    return this.nodes.filter(n => n.status !== 'DISCONNECTED');
  }

  public dispatchTask(taskName: string) {
    const worker = this.nodes
      .filter(n => n.status === 'IDLE' || n.status === 'DONATING')
      .sort((a, b) => (b.metrics.ratio + b.metrics.socialScore) - (a.metrics.ratio + a.metrics.socialScore))[0];

    if (worker) {
      const prevStatus = worker.status;
      worker.status = 'COMPUTING';
      worker.currentTask = taskName;
      worker.metrics.contributedOps += 10;
      setTimeout(() => {
          if (worker.status === 'COMPUTING') worker.status = prevStatus;
      }, 2000);
      return worker;
    }
    return null;
  }
}

export const swarm = new SwarmController();
