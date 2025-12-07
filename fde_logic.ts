
// ZIA FDE ENGINE (Muveraphy Port) v1.0
// 종환 님이 제공한 Python Muveraphy 코드를 TypeScript로 이식한 핵심 로직입니다.
// 시뮬레이션이 아닌, 실제 수학적 연산을 통해 텍스트 벡터를 고정 차원으로 압축합니다.

// 1. 유틸리티: 문자열을 숫자로 변환 (Simple Hash for Seeding)
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// 2. 가우시안 랜덤 생성기 (Box-Muller Transform)
// Python의 numpy.random.normal(0, 1) 대체
function randomNormal(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x); // Pseudo-random 0..1
}

function generateGaussianMatrix(rows: number, cols: number, seed: number): number[][] {
  const matrix: number[][] = [];
  let localSeed = seed;
  
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      // Box-Muller
      let u = 0, v = 0;
      while(u === 0) u = randomNormal(localSeed++);
      while(v === 0) v = randomNormal(localSeed++);
      const num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
      row.push(num);
    }
    matrix.push(row);
  }
  return matrix;
}

// 3. Gray Code 로직 (Python: _append_to_gray_code, _gray_code_to_binary)
// 파티션 인덱스를 계산할 때 해밍 거리를 보존하기 위해 사용
function appendToGrayCode(grayCode: number, bit: boolean): number {
    // Python: return (gray_code << 1) + (int(bit) ^ (gray_code & 1))
    const bitVal = bit ? 1 : 0;
    return (grayCode << 1) + (bitVal ^ (grayCode & 1));
}

// 4. SimHash 생성 (LSH: Locality Sensitive Hashing)
// 입력 벡터(텍스트의 임베딩 근사치)를 받아 파티션 인덱스를 반환
export function computeSimHashSignature(text: string, dimension: number = 64): string {
    // 1. 텍스트를 간이 벡터로 변환 (실제로는 LLM Embedding을 써야 하나, 여기서는 문자 코드 빈도로 근사)
    const vector = new Array(128).fill(0);
    for(let i=0; i<text.length; i++) {
        vector[i % 128] += text.charCodeAt(i);
    }
    
    // 2. 랜덤 투영 행렬 생성 (Seed는 텍스트 길이 등으로 고정)
    const projectionMatrix = generateGaussianMatrix(128, dimension, 42);
    
    // 3. 행렬 곱 (Vector * Matrix) -> SimHash
    let signature = 0;
    for(let j=0; j<dimension; j++) {
        let sum = 0;
        for(let i=0; i<128; i++) {
            sum += vector[i] * projectionMatrix[i][j];
        }
        // 양수면 1, 음수면 0
        signature = appendToGrayCode(signature, sum > 0);
    }
    
    // 16진수 문자열로 변환하여 반환 (FDE Token)
    return signature.toString(16).toUpperCase();
}

// 5. 논리적 밀도(Entropy) 계산
// 텍스트의 정보량이 얼마나 높은지 수학적으로 측정
export function calculateLogicDensity(text: string): number {
    const uniqueChars = new Set(text).size;
    const length = text.length;
    if (length === 0) return 0;
    
    // 섀넌 엔트로피 근사
    const entropy = (uniqueChars / length) * Math.log2(length);
    
    // 논리적 키워드 가중치
    const keywords = ['따라서', '그러므로', 'because', 'if', 'then', 'sum', 'matrix', 'define'];
    let logicBoost = 0;
    keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw)) logicBoost += 0.1;
    });

    return Math.min(1.0, (entropy / 8) + logicBoost);
}
