
// ZIA FDE ENGINE (Muveraphy Port) v1.0

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
    for(let j=0; j<dimension; j++) {
        let sum = 0;
        for(let i=0; i<128; i++) {
            sum += vector[i] * projectionMatrix[i][j];
        }
        signature = appendToGrayCode(signature, sum > 0);
    }
    
    return signature.toString(16).toUpperCase();
}

export function calculateLogicDensity(text: string): number {
    const uniqueChars = new Set(text).size;
    const length = text.length;
    if (length === 0) return 0;
    
    const entropy = (uniqueChars / length) * Math.log2(length);
    
    const keywords = ['따라서', '그러므로', 'because', 'if', 'then', 'sum', 'matrix', 'define'];
    let logicBoost = 0;
    keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw)) logicBoost += 0.1;
    });

    return Math.min(1.0, (entropy / 8) + logicBoost);
}
