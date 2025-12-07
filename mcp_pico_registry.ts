
// ZIA PICO-MCP REGISTRY v1.0
// 자연어 설명(Description)을 제거하고, 함수 시그니처(Signature) 중심의 압축 프로토콜을 구현합니다.
// 동시성 제어를 위한 Atomic Lock 시스템을 포함합니다.

export interface PicoTool {
  id: string; // 도구의 고유 ID (해시값)
  name: string; // 도구 이름
  signature: string; // Pico 서명: (params) -> returnType (자연어 설명 대체)
  category: 'MATH' | 'DATA' | 'SYSTEM' | 'NETWORK';
  cost: number; // 실행 비용 (토큰 단위)
}

export class PicoRegistry {
  private tools: Map<string, PicoTool> = new Map();
  private executionQueue: string[] = [];
  private isLocked: boolean = false; // Mutex Lock

  constructor() {
    // 기본 도구 등록 (자연어 설명 없이 서명만으로 등록)
    this.register({
      id: '0x1A4',
      name: 'EigenSolver',
      signature: 'eigen(matrix: Array<Array<number>>) -> { values: Array<complex>, vectors: Array<Array<complex>> }',
      category: 'MATH',
      cost: 15
    });

    this.register({
      id: '0x2B8',
      name: 'FDE_Compress',
      signature: 'fde_encode(vectors: Tensor<float32>, dim: 128) -> BitArray',
      category: 'DATA',
      cost: 40
    });

    this.register({
      id: '0x3C9',
      name: 'SwarmBroadcast',
      signature: 'broadcast(data: Any, ttl: number) -> Promise<NodeCount>',
      category: 'NETWORK',
      cost: 10
    });
  }

  public register(tool: PicoTool) {
    this.tools.set(tool.id, tool);
  }

  public getRegistryDump(): PicoTool[] {
    return Array.from(this.tools.values());
  }

  // Pico 프로토콜의 핵심: 컨텍스트 주입용 문자열 생성
  // 자연어를 완전히 배제하여 토큰 사용량을 최소화함
  public getSystemPromptInjection(): string {
    let prompt = "[AVAILABLE_TOOLS_PICO_PROTOCOL]\n";
    this.tools.forEach(tool => {
      prompt += `- ${tool.name}: ${tool.signature}\n`;
    });
    prompt += "[PROTOCOL: Call tools using code syntax only. No explanations needed.]";
    return prompt;
  }

  // 동시성 제어 (Concurrency Control)
  // 도구 실행 요청을 큐에 넣고 순차적으로 처리
  public async executeToolSafely(toolName: string, params: any): Promise<string> {
    // 큐에 작업 추가
    this.executionQueue.push(toolName);

    // 락 대기 (Spin-lock 시뮬레이션)
    while (this.isLocked || this.executionQueue[0] !== toolName) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 임계 구역 (Critical Section) 진입
    this.isLocked = true;
    this.executionQueue.shift(); // 큐에서 제거

    try {
      // 실제 실행 로직 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 800)); // 연산 시간
      return `[Result] ${toolName} executed safely. Output generated.`;
    } finally {
      // 락 해제
      this.isLocked = false;
    }
  }

  // 효율성 계산: 자연어 대비 절약된 토큰 수 추정
  public calculateEfficiency(): number {
    let savedTokens = 0;
    this.tools.forEach(tool => {
        // 평균적인 자연어 설명은 약 30~50 토큰, 서명은 약 5~10 토큰
        savedTokens += 35; 
    });
    return savedTokens;
  }
}

export const picoRegistry = new PicoRegistry();
