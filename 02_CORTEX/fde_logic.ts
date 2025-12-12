
// ZIA FDE ENGINE & MATH UTILS v3.3 (HAMMING LOGIC)
// [LOCATION]: 02_CORTEX/fde_logic.ts
// [v3.3] Added computeHammingSimilarity for SimHash comparison.

// 1. PSEUDO-RANDOM GENERATOR (Deterministic, Inlined for speed)
class Mulberry32 {
    private state: number;
    constructor(seed: number) { this.state = seed; }
    // Inline-friendly next()
    next(): number {
        var t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// 2. MATRIX PROJECTION (MuVERA-Style with Zero-Allocation)
export function computeSimHashSignature(text: string): string {
    const dimension = 64; 
    const projection = new Float32Array(dimension).fill(0); 
    const len = text.length;
    
    let i = 0;
    while (i < len) {
        let code = text.charCodeAt(i);
        
        // Skip non-word characters
        if (
            (code >= 65 && code <= 90) || 
            (code >= 97 && code <= 122) || 
            (code >= 48 && code <= 57) || 
            (code >= 44032 && code <= 55203)
        ) {
            let h = 0x811c9dc5; 
            while (i < len) {
                code = text.charCodeAt(i);
                if (
                    !((code >= 65 && code <= 90) || 
                    (code >= 97 && code <= 122) || 
                    (code >= 48 && code <= 57) || 
                    (code >= 44032 && code <= 55203))
                ) {
                    break;
                }
                h ^= code;
                h = Math.imul(h, 0x01000193);
                i++;
            }
            
            let t = h >>> 0; 
            for (let j = 0; j < dimension; j++) {
                 t += 0x6D2B79F5;
                 let z = Math.imul(t ^ (t >>> 15), t | 1);
                 z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
                 const rand = ((z ^ (z >>> 14)) >>> 0) / 4294967296;
                 
                 projection[j] += rand > 0.5 ? 1 : -1;
            }
        } else {
            i++;
        }
    }

    let signature = "";
    let chunk = 0;
    for (let j = 0; j < dimension; j++) {
        const bit = projection[j] >= 0 ? 1 : 0;
        chunk = (chunk << 1) | bit;
        if ((j + 1) % 4 === 0) {
            signature += chunk.toString(16);
            chunk = 0;
        }
    }
    return signature.toUpperCase();
}

// 3. LOGICAL DENSITY (Zero-Allocation Logic)
export function calculateLogicDensity(text: string): number {
    const len = text.length;
    if (len === 0) return 0;
    
    const uniqueChars = new Set();
    for(let i=0; i<len; i++) {
        uniqueChars.add(text.charCodeAt(i));
    }
    
    const entropy = (uniqueChars.size / len) * Math.log2(len);
    
    const keywords = [
        '따라서', '그러므로', '왜냐하면', '결론적으로', '가정하면', 
        'because', 'therefore', 'implies', 'axiom', 'if', 'then', 'else',
        'define', 'assume', 'proof'
    ];
    
    let logicBoost = 0;
    const lowerText = text.toLowerCase(); 
    
    for (const kw of keywords) {
        if (lowerText.includes(kw)) logicBoost += 0.1;
    }

    return Math.min(1.0, (entropy / 8) + logicBoost);
}

// 4. VECTOR MATH
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return (magA === 0 || magB === 0) ? 0 : dot / (magA * magB);
}

export function jaccardSimilarity(arrA: string[], arrB: string[]): number {
    if (arrA.length === 0 || arrB.length === 0) return 0;
    const setA = new Set(arrA);
    let intersection = 0;
    for(const item of arrB) {
        if (setA.has(item)) intersection++;
    }
    const union = setA.size + arrB.length - intersection;
    return intersection / union;
}

// 5. HAMMING SIMILARITY (For SimHash Hex Strings)
export function computeHammingSimilarity(hex1: string, hex2: string): number {
    if (hex1.length !== hex2.length) return 0;
    let matchingBits = 0;
    const totalBits = hex1.length * 4;

    for (let i = 0; i < hex1.length; i++) {
        const v1 = parseInt(hex1[i], 16);
        const v2 = parseInt(hex2[i], 16);
        // XOR gives 1 where bits differ. We want matching bits.
        // 0xF (1111) is the mask.
        let diff = v1 ^ v2;
        // Count bits in diff
        let diffCount = 0;
        while(diff > 0) {
            if ((diff & 1) === 1) diffCount++;
            diff >>= 1;
        }
        matchingBits += (4 - diffCount);
    }
    
    return matchingBits / totalBits;
}
