
// ZIA FDE ENGINE (Muveraphy Port) v1.1
// [v1.1] Added Mathematical Distance & Similarity Metrics (Topology Foundation)

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
}

function randomNormal(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x); 
}

function generateGaussianMatrix(rows: number, cols: number, seed: number): number[][] {
  const matrix: number[][] = [];
  let localSeed = seed;
  
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
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

function appendToGrayCode(grayCode: number, bit: boolean): number {
    const bitVal = bit ? 1 : 0;
    return (grayCode << 1) + (bitVal ^ (grayCode & 1));
}

export function computeSimHashSignature(text: string, dimension: number = 64): string {
    const vector = new Array(128).fill(0);
    for(let i=0; i<text.length; i++) {
        vector[i % 128] += text.charCodeAt(i);
    }
    
    const projectionMatrix = generateGaussianMatrix(128, dimension, 42);
    
    let signature = 0;
    bigLoop: for(let j=0; j<dimension; j++) {
        let sum = 0;
        for(let i=0; i<128; i++) {
            sum += vector[i] * projectionMatrix[i][j];
        }
        // Javascript bitwise operations are 32-bit. 
        // For simulation, we keep it simple. Real implementation needs BigInt for >32 dim.
        if (j >= 32) break bigLoop; 
        
        signature = appendToGrayCode(signature, sum > 0);
    }
    
    // Convert to Hex (Padding ensures fixed length look)
    return (signature >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// [v1.1] Hamming Distance Calculation (Topological Distance)
// 두 지식(FDE 서명) 사이의 거리를 계산하여, 의미적으로 얼마나 가까운지 수학적으로 판별함.
export function computeHammingDistance(sig1: string, sig2: string): number {
    let val1 = parseInt(sig1, 16);
    let val2 = parseInt(sig2, 16);
    let xor = val1 ^ val2;
    let distance = 0;
    
    while (xor > 0) {
        distance += xor & 1;
        xor >>= 1;
    }
    return distance;
}

// [v1.1] Similarity Score (0.0 ~ 1.0)
// 해밍 거리를 정규화하여 유사도 점수 반환. (거리가 0이면 유사도 1.0)
export function computeSimilarity(sig1: string, sig2: string, dimension: number = 32): number {
    const distance = computeHammingDistance(sig1, sig2);
    return 1.0 - (distance / dimension);
}

export function calculateLogicDensity(text: string): number {
    const uniqueChars = new Set(text).size;
    const length = text.length;
    if (length === 0) return 0;
    
    const entropy = (uniqueChars / length) * Math.log2(length);
    
    // 논리적 연결어 가중치 (한글/영어)
    const keywords = [
        '따라서', '그러므로', '왜냐하면', '결론적으로', '하지만', '반면',
        'because', 'if', 'then', 'therefore', 'however', 'implies', 'axiom',
        'sum', 'matrix', 'define', 'proof'
    ];
    let logicBoost = 0;
    keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw)) logicBoost += 0.05;
    });

    return Math.min(1.0, (entropy / 8) + logicBoost);
}
